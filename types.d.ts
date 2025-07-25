// context from the auth process, extracted from the Stytch auth token JWT and provided to the MCP Server as this.props
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
