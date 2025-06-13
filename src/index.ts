import { MemoryMCP } from "./MemoryMCP.ts";
import {
  getStytchOAuthEndpointUrl,
  stytchBearerTokenAuthMiddleware,
} from "./lib/auth.ts";
import { cors } from "hono/cors";
import { Hono } from "hono";

// so the Worker runtime can find it
export { MemoryMCP };

export default new Hono<{ Bindings: Env }>()
  .use(cors())

  .get("/health", (c) => {
    return c.json({ status: 200, message: "ok" });
  })

  // redirect to spydr.dev/memory
  .get("/", (c) => {
    return c.redirect("https://spydr.dev/memory", 302);
  })

  // serve the OAuth Authorization Server response for Dynamic Client Registration
  .get("/.well-known/oauth-authorization-server", async (c) => {
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
  .use("/sse/*", stytchBearerTokenAuthMiddleware)
  .route("/sse", new Hono().mount("/", MemoryMCP.serveSSE("/sse").fetch))

  .use("/mcp", stytchBearerTokenAuthMiddleware)
  .route("/mcp", new Hono().mount("/", MemoryMCP.serve("/mcp").fetch));

// no static assets yet, but we'll add them later: TODO - Start the memory management UI
//.mount("/", (req, env) => env.ASSETS.fetch(req));
