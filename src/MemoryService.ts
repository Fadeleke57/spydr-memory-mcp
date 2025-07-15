import {
  AddToSpydrMemoryRequest,
  Client,
  Content,
} from "./lib/types";

class MemoryService {
  private API_URL: string;

  /**
   * Initialize the MemoryService
   */
  constructor(
    private env: Cloudflare.Env,
    private accessToken: string,
    public clientId: string
  ) {
    const baseUrl = this.env.API_URL;
    if (!baseUrl) {
      console.error("[MemoryService] API_URL is not configured.");
      throw new Error("API_URL is not configured.");
    }
    this.API_URL = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  }

  /**
   * Make a request to the API
   */
  private async makeRequest(
    path: string,
    method: "GET" | "POST" = "GET",
    body?: any
  ): Promise<any> {
    const url = `${this.API_URL}/api/v1${path}`; // path should start with '/'

    if (!this.accessToken) {
      console.error(
        "[MemoryService] Access token is missing for API call to",
        url
      );
      throw new Error("Authentication token is missing for API call.");
    }

    const headers: HeadersInit = {
      Authorization: `Bearer ${this.accessToken}`,
    };

    if (method === "POST" && body) {
      headers["Content-Type"] = "application/json";
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method === "POST") {
      options.body = JSON.stringify(body);
    }

    console.log(`[MemoryService] Making API call: ${method} ${url}`);
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[MemoryService] API call to ${url} failed: ${response.status} ${response.statusText}`,
        errorBody
      );
      throw new Error(`${response.status}: ${errorBody}`);
    }
    return response.json();
  }

  /**
   * Search for webs based on a query
   */
  async searchWebs(query: string, scope: "User.all" | "All" = "All") {
    const apiPath = `/search/webs?query=${encodeURIComponent(
      query
    )}&scope=${encodeURIComponent(scope)}`;
    return this.makeRequest(apiPath, "GET");
  }

  /**
   * Search for memories based on a semantic query
   */
  async searchSpydrMemories(
    query: string,
    scope: "User.all" | "Web" = "User.all",
    webId?: string,
    sourceId?: string
  ) {
    const params = new URLSearchParams({
      query,
      scope
    });
    if (webId) params.append("webId", webId);
    if (sourceId) params.append("sourceId", sourceId);
    if (this.clientId) params.append("clientId", this.clientId);

    const apiPath = `/search/memories?${params.toString()}`;
    return this.makeRequest(apiPath, "GET");
  }

  async addToSpydrMemory(client: Client, content: Content) {
    const apiPath = `/add/memory`;
    const body: AddToSpydrMemoryRequest = {
      client,
      content,
      clientId: this.clientId,
    };
    return this.makeRequest(apiPath, "POST", body);
  }

  /**
   * Retrieves a specific source by its ID.
   *    * Corresponds to Python endpoint: GET /{source_id}
  
  async getSourceById(sourceId: string) {
    // Ensure the path starts with a slash, and sourceId is URI encoded if it can contain special characters.
    // However, path parameters are typically not encoded in the path template itself.
    return this.makeRequest(`/sources/${encodeURIComponent(sourceId)}`, "GET");
  } */

  /**
   * Retrieves a specific web by its ID.
   * Corresponds to Python endpoint: GET /id?webId={webId}
   
  async getWebById(webId: string) {
    return this.makeRequest(
      `/webs/id?webId=${encodeURIComponent(webId)}`,
      "GET"
    );
  }*/
}

export const memoryService = (
  env: Cloudflare.Env,
  accessToken: string,
  clientId: string
) => new MemoryService(env, accessToken, clientId);
