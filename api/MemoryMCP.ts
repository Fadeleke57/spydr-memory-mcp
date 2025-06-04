import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { memoryService } from "./MemoryService.ts";
import { AuthenticationContext } from "../types";
import { McpAgent } from "agents/mcp";

export class MemoryMCP extends McpAgent<Env, unknown, AuthenticationContext> {
  async init() {}

  private get webService() {
    if (!this.props.accessToken) {
      console.error(
        "[MemoryMCP] AccessToken is not available in props. Ensure stytchBearerTokenAuthMiddleware populates it."
      );
      throw new Error("Access token not available for WebService.");
    }
    return memoryService(this.env, this.props.accessToken);
  }

  formatResponse = (
    description: string,
    returnData: any
  ): {
    content: Array<{ type: "text"; text: string }>;
  } => {
    return {
      content: [
        {
          type: "text",
          text: `Success! ${description}\n\nReturned:\n${JSON.stringify(
            returnData,
            null,
            2
          )}}`,
        },
      ],
    };
  };

  formatErrorResponse = (
    error: string,
    details?: any
  ): {
    content: Array<{ type: "text"; text: string }>;
  } => {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error}\n\n${
            details ? JSON.stringify(details, null, 2) : ""
          }`,
        },
      ],
    };
  };

  get server() {
    const server = new McpServer({
      name: "SpydrWeb Interaction Service (via MemoryMCP)",
      version: "1.0.0",
    });

    server.resource(
      "Source",
      new ResourceTemplate("spydrapp://sources/{sourceId}", {
        list: undefined,
      }),
      async (uri, { sourceId }) => {
        let data;
        try {
          data = await this.webService.getSourceById(sourceId as string);
        } catch (e: any) {
          console.error(
            `[MemoryMCP resource Source GET ${sourceId}] Error:`,
            e
          );
          return {
            contents: [
              {
                uri: uri.href,
                text: `Error fetching source '${sourceId}': ${e.message}`,
              },
            ],
          };
        }
        return {
          contents: [
            {
              uri: uri.href,
              text: `Success fetching source '${sourceId}': ${JSON.stringify(
                data
              )}`,
            },
          ],
        };
      }
    );

    server.resource(
      "Web",
      new ResourceTemplate("spydrapp://webs/{webId}", {
        list: undefined,
      }),
      async (uri, { webId }) => {
        try {
          const data = await this.webService.getWebById(webId as string);
          return {
            contents: [
              {
                uri: uri.href,
                text: `Success fetching web '${webId}': ${JSON.stringify(
                  data
                )}`,
              },
            ],
          };
        } catch (e: any) {
          console.error(`[MemoryMCP resource Web GET ${webId}] Error:`, e);
          return {
            contents: [
              {
                uri: uri.href,
                text: `Error fetching web '${webId}': ${e.message}`,
              },
            ],
          };
        }
      }
    );

    server.tool(
      "findWebs",
      "Search for webs (collections of sources) based on a query. Can be filtered by visibility.",
      {
        query: z.string().describe("The query to search for"),
        visibility: z
          .enum(["Public", "Private"])
          .optional()
          .describe("Filter webs by visibility (Public or Private)."),
      },
      async ({ query, visibility }) => {
        try {
          const userId = this.props.claims.sub; // need a better way to get this
          const data = await this.webService.findWebs(
            query,
            userId,
            visibility
          );
          return this.formatResponse("Webs searched successfully", data);
        } catch (e: any) {
          console.error(`[MemoryMCP tool findWebs] Error:`, e);
          return this.formatErrorResponse("Failed to find webs.", {
            message: e.message,
          });
        }
      }
    );

    server.tool(
      "searchSourcesInWeb",
      "Search through sources within a specific web using a semantic query.",
      {
        webId: z.string().describe("The ID of the web to search within."),
        query: z
          .string()
          .describe("The semantic query string to search for within sources."),
        sources: z
          .array(z.string())
          .optional()
          .describe(
            "Optional list of specific source IDs to filter by within the web."
          ),
        limit: z
          .number()
          .int()
          .optional()
          .default(5)
          .describe("Maximum number of search results to return."),
        boundary: z
          .boolean()
          .optional()
          .default(true)
          .describe(
            "Whether to search within the boundaries of the web or search all the user's sources if the webId is not provided."
          ),
      },
      async ({ webId, query, sources, limit, boundary }) => {
        try {
          const data = await this.webService.searchSourcesInWeb(
            webId,
            query,
            sources,
            limit,
            boundary
          );
          return this.formatResponse(
            `Source search in web '${webId}' completed.`,
            data
          );
        } catch (e: any) {
          console.error("[MemoryMCP tool searchSourcesInWeb] Error:", e);
          return this.formatErrorResponse(
            `Failed to search sources in web '${webId}'.`,
            { message: e.message }
          );
        }
      }
    );

    return server;
  }
}
