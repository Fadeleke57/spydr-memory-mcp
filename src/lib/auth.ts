import { createRemoteJWKSet, jwtVerify } from "jose";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { getCookie } from "hono/cookie";


function logTokenPreview(label: string, token: string) {
  console.log(`[${label}] Token: ${token}`);
}

async function validateStytchJWT(token: string, env: Cloudflare.Env) {
  if (!jwks) {
    console.log("[validateStytchJWT] JWKS not initialized");
    const jwksUrl = getStytchOAuthEndpointUrl(env, ".well-known/jwks.json");
    console.log(`[validateStytchJWT] Initializing JWKS from: ${jwksUrl}`);
    jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  logTokenPreview("validateStytchJWT", token);
  console.log("[JWKS] JWKS initialized", jwks);
  const response = await jwtVerify(token, jwks, {
    audience: env.STYTCH_PROJECT_ID,
    issuer: [`stytch.com/${env.STYTCH_PROJECT_ID}`],
    typ: "JWT",
    algorithms: ["RS256"],
  });
  console.log("[validateStytchJWT] JWT verified", response.payload);
  return response;
}

export const stytchSessionAuthMiddleware = createMiddleware<{
  Variables: {
    userID: string;
    sessionToken: string;
  };
  Bindings: Cloudflare.Env;
}>(async (c, next) => {
  const sessionCookie = getCookie(c, "stytch_session_jwt");
  const sessionToken = getCookie(c, "stytch_session");
  console.log(
    `[SessionMiddleware] Incoming cookie: ${
      sessionCookie && sessionToken ? "Present" : "Missing"
    }`
  );

  try {
    console.log("[Session Cookie]", sessionCookie);
    console.log("[Session Token]", sessionToken);
    const verifyResult = await validateStytchJWT(sessionCookie ?? "", c.env);
    console.log(
      "[SessionMiddleware] JWT verified. Claims:",
      verifyResult.payload
    );
    c.set("userID", verifyResult.payload.sub!);
    c.set("sessionToken", sessionToken ?? "");
  } catch (error) {
    console.error("[SessionMiddleware] Authentication failed:", error);
    throw new HTTPException(401, { message: "Unauthenticated" });
  }

  console.log(
    "[SessionMiddleware] Authentication passed, proceeding to next middleware"
  );
  await next();
});

export const stytchBearerTokenAuthMiddleware = createMiddleware<{
  Bindings: Cloudflare.Env;
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

// determine the correct Stytch public URL based on environment
export function getStytchOAuthEndpointUrl(env: Cloudflare.Env, endpoint: string): string {
  const baseURL = env.STYTCH_PROJECT_ID.includes("test")
    ? "https://test.stytch.com/v1/public"
    : "https://api.stytch.com/v1/public";

  console.log(
    `[getStytchOAuthEndpointUrl] Base URL: ${baseURL}, Endpoint: ${endpoint}`
  );
  return `${baseURL}/${env.STYTCH_PROJECT_ID}/${endpoint}`;
}
