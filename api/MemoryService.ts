class MemoryService {
  private API_URL: string;
  constructor(private env: Env, private accessToken: string) {
    const baseUrl = this.env.API_URL;
    if (!baseUrl) {
      console.error("[MemoryService] API_URL is not configured.");
      throw new Error("API_URL is not configured.");
    }
    this.API_URL = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  }

  private async makeRequest(
    path: string,
    method: "GET" | "POST" = "GET",
    body?: any
  ): Promise<any> {
    const url = `${this.API_URL}${path}`; // path should start with '/'

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
      throw new Error(
        `API request to ${url} failed with status ${response.status}: ${errorBody}`
      );
    }
    return response.json();
  }
  /**
   * Searches for webs based on a query.
   * Corresponds to Python endpoint: GET /search
   */
  async findWebs(
    query: string,
    userId: string,
    visibility?: "Public" | "Private"
  ) {
    let apiPath = `/search?query=${encodeURIComponent(
      query
    )}&userId=${encodeURIComponent(userId)}`;
    if (visibility) {
      apiPath += `&visibility=${encodeURIComponent(visibility)}`;
    }
    return this.makeRequest(apiPath, "GET");
  }

  /**
   * Searches sources within a specific web.
   * Corresponds to Python endpoint: GET /search/all
   */
  async searchSourcesInWeb(
    webId: string,
    query: string,
    sources?: string[],
    limit: number = 5,
    boundary: boolean = true
  ) {
    let apiPath = `/sources/search/all?webId=${encodeURIComponent(
      webId
    )}&query=${encodeURIComponent(query)}&limit=${limit}&boundary=${boundary}`;
    if (sources && sources.length > 0) {
      sources.forEach((sourceId) => {
        apiPath += `&sources=${encodeURIComponent(sourceId)}`;
      });
    }
    return this.makeRequest(apiPath, "GET");
  }

  /**
   * Retrieves a specific source by its ID.
   * Corresponds to Python endpoint: GET /{source_id}
   */
  async getSourceById(sourceId: string) {
    // Ensure the path starts with a slash, and sourceId is URI encoded if it can contain special characters.
    // However, path parameters are typically not encoded in the path template itself.
    return this.makeRequest(`/sources/${encodeURIComponent(sourceId)}`, "GET");
  }

  /**
   * Retrieves a specific web by its ID.
   * Corresponds to Python endpoint: GET /id?webId={webId}
   */
  async getWebById(webId: string) {
    return this.makeRequest(`/webs/id?webId=${encodeURIComponent(webId)}`, "GET");
  }
}

// Factory function to create instances of MemoryService
export const memoryService = (env: Env, accessToken: string) =>
  new MemoryService(env, accessToken);
