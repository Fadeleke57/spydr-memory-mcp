console.log("Initializing Spydr Memory MCP server...");
import { MemoryMCP } from "./MemoryMCP.ts";
import {
  stytchBearerTokenAuthMiddleware,
} from "./lib/auth.ts";
import { getStytchOAuthEndpointUrl } from "./utils";
import { cors } from "hono/cors";
import { Hono } from "hono";

// so the Worker runtime can find it
export { MemoryMCP };

export default new Hono<{ Bindings: Cloudflare.Env }>()
  .use(cors())
  .use("*", async (c, next) => {
    console.log(`[index.ts] Request: ${c.req.method} ${c.req.url}`);
    await next();
    console.log(`[index.ts] Response: ${c.req.method} ${c.req.url} - ${c.res.status}`);
  })
  .get("/health", (c) => {
    console.log("[index.ts] Handling /health request");
    return c.json({ status: 200, message: "ok" });
  })

  // redirect to spydr.dev/memory
  .get("/", (c) => {
    console.log("[index.ts] Handling / request, redirecting to spydr.dev/memory");
    return c.redirect("https://spydr.dev/memory", 302);
  })

  // serve the OAuth Authorization Server response for Dynamic Client Registration
  .get("/.well-known/oauth-authorization-server", async (c) => {
    console.log("[index.ts] Handling /.well-known/oauth-authorization-server request");
    return c.json({
      issuer: c.env.STYTCH_PROJECT_ID,
      authorization_endpoint: `${c.env.CLIENT_URL}/oauth/authorize`, // link to the OAuth Authorization screen on spydr
      token_endpoint: getStytchOAuthEndpointUrl(c.env, "oauth2/token"),
      registration_endpoint: getStytchOAuthEndpointUrl(
        c.env,
        "oauth2/register"
      ),
      scopes_supported: ["openid", "profile", "email", "offline_access"],
      response_types_supported: ["code"],
      response_modes_supported: ["query"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"],
    });
  })

  // let the MCP Server have a go at handling the request
  .use("/sse/*", (c, next) => {
    console.log("[index.ts] Applying stytchBearerTokenAuthMiddleware for /sse/*");
    return stytchBearerTokenAuthMiddleware(c, next);
  })
  .route("/sse", new Hono().mount("/", MemoryMCP.serveSSE("/sse").fetch))

  .use("/mcp", (c, next) => {
    console.log("[index.ts] Applying stytchBearerTokenAuthMiddleware for /mcp");
    return stytchBearerTokenAuthMiddleware(c, next);
  })
  .route("/mcp", new Hono().mount("/", MemoryMCP.serve("/mcp").fetch));

// no static assets yet, but we'll add them later: TODO - Start the memory management UI
//.mount("/", (req, env) => env.ASSETS.fetch(req));
