// Context from the auth process, extracted from the Stytch auth token JWT
// and provided to the MCP Server as this.props
export type AuthenticationContext = {
  claims: {
    iss: string;
    scope: string;
    sub: string;
    aud: string[];
    client_id: string;
    exp: number;
    iat: number;
    nbf: number;
    jti: string;
  };
  accessToken: string;
};

export type AddToSpydrMemoryRequest = {
  client: Client;
  content: Content;
  webId?: string;
  clientId?: string;
};

export type SearchSpydrMemoriesRequest = {
  query: string;
  scope: "User.all" | "Web";
  webId?: string;
  sourceId?: string;
  clientId?: string;
};

export type UpdateStytchConnectedAppBody = {
  client_name?: string;
  client_description?: string;
  redirect_urls?: string[];
  access_token_expiry_minutes?: number;
  post_logout_redirect_urls?: string[];
  full_access_allowed?: boolean;
  access_token_template_content?: string;
  logo_url?: string;
  bypass_consent_for_offline_access?: boolean;
};

export enum Client {
  Claude = "Claude",
  ChatGPT = "ChatGPT",
  "Cascade - Windsurf" = "Cascade - Windsurf",
  Cursor = "Cursor",
  Cline = "Cline",
  Warp = "Warp",
  Other = "Other",
  Continue = "Continue",
  "Roo-Cline" = "Roo-Cline",
  Encovo = "Encovo",
  HighlightAI = "Highlight AI",
}

export type Message = {
  content: string;
  role: Client | "User";
};

export type Messages = Message[];
export type Content = string | Messages;
