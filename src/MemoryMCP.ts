import {
  McpServer,
  /*ResourceTemplate,*/
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { memoryService } from "./MemoryService.ts";
import { AuthenticationContext, Client } from "./lib/types.ts";
import { McpAgent } from "agents/mcp";

const Message = z.object({
  content: z.string(),
  role: z.union([z.nativeEnum(Client), z.literal("User")]),
});

export class MemoryMCP extends McpAgent<
  Cloudflare.Env,
  unknown,
  AuthenticationContext
> {
  /**
   * Initialize the MCP agent
   */
  async init() {
    console.log("[MemoryMCP] Initializing agent.");
  }

  /**
   * Get the MemoryService instance
   */
  private get memoryService() {
    console.log("[MemoryMCP] Accessing memoryService.");
    if (!this.props.accessToken || !this.props.claims.client_id) {
      console.error(
        "[MemoryMCP] AccessToken or Client ID is not available in props. Ensure stytchBearerTokenAuthMiddleware populates it."
      );
      throw new Error(
        "Access token or client ID not available for MemoryService."
      );
    }
    return memoryService(
      this.env,
      this.props.accessToken,
      this.props.claims.client_id
    );
  }

  /**
   * Format a successful response
   */
  formatResponse = (
    description: string,
    returnData: any
  ): {
    content: Array<{ type: "text"; text: string }>;
  } => {
    console.log(`[MemoryMCP] Formatting success response: ${description}`);
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

  /**
   * Format an error response
   */
  formatErrorResponse = (
    error: string,
    details?: any
  ): {
    content: Array<{ type: "text"; text: string }>;
  } => {
    console.log(`[MemoryMCP] Formatting error response: ${error}`);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error}\n\n${details ? JSON.stringify(details, null, 2) : ""}`,
        },
      ],
    };
  };

  /**
   * Get the MCP server instance
   */
  get server() {
    console.log("[MemoryMCP] Accessing server getter to build McpServer.");
    const server = new McpServer({
      name: "Spydr Interaction Server (via MemoryMCP)",
      version: "1.0.0",
    });

    /**
     * Find memories based on a tactical semantic query
     */
    server.tool(
      "FindSpydrMemories",
      "Search for memories using a tactical semantic query. Optionally, limit the search to a specific web or memory. You can also call this tool multiple times (when instructed or to improve context quality) to orchestrate fine-grained context for responses.",
      {
        query: z
          .string()
          .describe(
            "The tactical semantic query used to search within the user's memories."
          ),
        scope: z
          .enum(["User.all", "Web"])
          .optional()
          .default("User.all")
          .describe(
            `"User.all" searches across all of the user's webs. "Web" restricts the search to a specific web (webId or sourceId required).`
          ),
        webId: z
          .string()
          .optional()
          .describe(
            "The ID of the web to search within. Required if scope is 'Web' and a sourceId is not provided. If a user ever says to refer to a specific web, you should always use the webId provided by the user."
          ),
        sourceId: z
          .string()
          .optional()
          .describe(
            "Optional. The ID of a specific memory (source) to search within. Only use if the user clearly refers to a specific memory and make sure to set the scope to 'Web'. If a user ever says to refer to a specific memory, you should always use the sourceId provided by the user."
          ),
      },
      async ({ webId, query, sourceId, scope }) => {
        console.log(
          `[MCP Tool: FindMemories] Called with query: "${query}", scope: "${scope}", webId: "${webId}", sourceId: "${sourceId}"`
        );
        let parsedWebId, parsedSourceId;
        if (webId) {
          parsedWebId = webId
            .replace("@Web-", "")
            .replace("Web-", "")
            .replace("Web", "")
            .replace("@", "");
        }
        if (sourceId) {
          parsedSourceId = sourceId
            .replace("@Memory-", "")
            .replace("Memory-", "")
            .replace("Memory", "")
            .replace("@", "");
        }
        try {
          const data = await this.memoryService.searchSpydrMemories(
            query,
            scope,
            parsedWebId,
            parsedSourceId
          );
          console.log(
            `[MCP Tool: FindMemories] Search completed. Found ${data.length} memories.`
          );
          return this.formatResponse(
            "Memory search completed successfully.",
            data
          );
        } catch (e: any) {
          console.error("[MCP Tool: Find Memories] Error:", e);
          return this.formatErrorResponse("Could not search memories.", {
            message: e.message,
          });
        }
      }
    );

    server.tool(
      "AddToSpydrMemory",
      "Add a new memory to the user's memory collection. This tool should be used when the user explicitly asks to add a memory, or when you need to add a memory to the user's memory collection.",
      {
        client: z
          .nativeEnum(Client)
          .describe(
            "The client that generated the memory. This should be the name of the client that generated the memory."
          ),
        content: z
          .union([z.string(), z.array(Message)])
          .describe(
            "The content of the memory. This should be the content of the memory. Try to be as detailed as possible."
          ),
      },
      async ({ client, content }) => {
        console.log("[MCP Tool: Add To Memory] Adding memory:", {
          client,
          content,
        });
        try {
          const data = await this.memoryService.addToSpydrMemory(
            client,
            content
          );
          return this.formatResponse("Memory added successfully.", data);
        } catch (e: any) {
          console.error("[MCP Tool: Add To Memory] Error:", e);
          return this.formatErrorResponse("Could not add memory.", {
            message: e.message,
          });
        }
      }
    );

    return server;
  }
}
