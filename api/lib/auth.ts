import { createRemoteJWKSet, jwtVerify } from "jose";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { getCookie } from "hono/cookie";

/**
 * Logs a partial token for debugging without exposing the whole JWT
 */
function logTokenPreview(label: string, token: string) {
  console.log(
    `[${label}] Token: ${token}`
  );
}

/**
 * Middleware for session cookie-based auth using the Stytch FE SDK
 */
export const stytchSessionAuthMiddleware = createMiddleware<{
  Variables: {
    userID: string;
  };
  Bindings: Env;
}>(async (c, next) => {
  const sessionCookie = getCookie(c, "stytch_session_jwt");
  console.log(
    `[SessionMiddleware] Incoming cookie: ${
      sessionCookie ? "Present" : "Missing"
    }`
  );

  try {
    const verifyResult = await validateStytchJWT(sessionCookie ?? "", c.env);
    console.log(
      "[SessionMiddleware] JWT verified. Claims:",
      verifyResult.payload
    );

    c.set("userID", verifyResult.payload.sub!);
  } catch (error) {
    console.error("[SessionMiddleware] Authentication failed:", error);
    throw new HTTPException(401, { message: "Unauthenticated" });
  }

  console.log(
    "[SessionMiddleware] Authentication passed, proceeding to next middleware"
  );
  await next();
});

/**
 * Middleware for validating Bearer tokens (used after OAuth flows)
 */
export const stytchBearerTokenAuthMiddleware = createMiddleware<{
  Bindings: Env;
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  console.log(
    `[BearerMiddleware] Incoming Authorization header: ${
      authHeader ?? "Missing"
    }`
  );

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[BearerMiddleware] Invalid or missing Authorization header");
    throw new HTTPException(401, {
      message: "Missing or invalid access token",
    });
  }

  const accessToken = authHeader.substring(7);
  logTokenPreview("BearerMiddleware", accessToken);

  try {
    const verifyResult = await validateStytchJWT(accessToken, c.env);
    console.log(
      "[BearerMiddleware] JWT verified. Claims:",
      verifyResult.payload
    );

    // @ts-expect-error Props go brr
    c.executionCtx.props = {
      claims: verifyResult.payload,
      accessToken,
    };
  } catch (error) {
    console.error("[BearerMiddleware] Authentication failed:", error);
    throw new HTTPException(401, { message: "Unauthenticated" });
  }

  console.log(
    "[BearerMiddleware] Authentication passed, proceeding to next middleware"
  );
  await next();
});

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

/**
 * Validates the JWT using JOSE and Stytch's JWKS endpoint
 */
async function validateStytchJWT(token: string, env: Env) {
  if (!jwks) {
    const jwksUrl = getStytchOAuthEndpointUrl(env, ".well-known/jwks.json");
    console.log(`[validateStytchJWT] Initializing JWKS from: ${jwksUrl}`);
    jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  logTokenPreview("validateStytchJWT", token);

  return await jwtVerify(token, jwks, {
    audience: env.STYTCH_PROJECT_ID,
    issuer: [`stytch.com/${env.STYTCH_PROJECT_ID}`],
    typ: "JWT",
    algorithms: ["RS256"],
  });
}

/**
 * Determines the correct Stytch public URL based on environment
 */
export function getStytchOAuthEndpointUrl(env: Env, endpoint: string): string {
  const baseURL = env.STYTCH_PROJECT_ID.includes("test")
    ? "https://test.stytch.com/v1/public"
    : "https://api.stytch.com/v1/public";

  console.log(
    `[getStytchOAuthEndpointUrl] Base URL: ${baseURL}, Endpoint: ${endpoint}`
  );
  return `${baseURL}/${env.STYTCH_PROJECT_ID}/${endpoint}`;
}
