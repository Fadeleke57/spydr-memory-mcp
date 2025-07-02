import {
  McpServer,
  /*ResourceTemplate,*/
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { memoryService } from "./MemoryService.ts";
import { AuthenticationContext } from "../types";
import { McpAgent } from "agents/mcp";

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
    if (!this.props.accessToken) {
      console.error(
        "[MemoryMCP] AccessToken is not available in props. Ensure stytchBearerTokenAuthMiddleware populates it."
      );
      throw new Error("Access token not available for MemoryService.");
    }
    return memoryService(this.env, this.props.accessToken);
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
     * Find webs based on a query
     */
    server.tool(
      "FindWebs",
      "Search for Webs (collections of related memories). Use this only if the user explicitly asks to search for webs, or if you need to narrow the memory search scope by webId.",
      {
        query: z
          .string()
          .describe("The search query for finding relevant webs."),
        scope: z
          .enum(["User.all", "All"])
          .optional()
          .default("All")
          .describe(
            `"User.all" searches only the user's own webs. "All" includes both public webs and the user's private ones. You should only use User.all if the user asks to search within their own webs.`
          ),
      },
      async ({ query, scope }) => {
        console.log(`[MCP Tool: FindWebs] Called with query: "${query}", scope: "${scope}"`);
        try {
          const data = await this.memoryService.searchWebs(query, scope);
          console.log(`[MCP Tool: FindWebs] Successfully found ${data.webs.length} webs.`);
          return this.formatResponse("Successfully found matching webs.", data);
        } catch (e: any) {
          console.error(`[MCP Tool: Find Webs] Error:`, e);
          return this.formatErrorResponse("Could not find any webs.", {
            message: e.message,
          });
        }
      }
    );

    /**
     * Find memories based on a semantic query
     */
    server.tool(
      "FindMemories",
      "Search for memories using a semantic query. Optionally, limit the search to a specific web or memory. You can also call this tool multiple times (when instructed or to improve context quality) to orchestrate fine-grained context for responses.",
      {
        query: z
          .string()
          .describe(
            "The semantic query used to search within the user's memories."
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
        console.log(`[MCP Tool: FindMemories] Called with query: "${query}", scope: "${scope}", webId: "${webId}", sourceId: "${sourceId}"`);
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
          const data = await this.memoryService.searchMemories(
            query,
            scope,
            parsedWebId,
            parsedSourceId
          );
          console.log(`[MCP Tool: FindMemories] Search completed. Found ${data.length} memories.`);
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

    return server;
  }
}
