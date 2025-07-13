import { UpdateStytchConnectedAppBody } from "./types";

export function getStytchOAuthEndpointUrl(
  env: Cloudflare.Env,
  endpoint: string
): string {
  const baseURL = env.STYTCH_PROJECT_ID.includes("test")
    ? "https://test.stytch.com/v1/public"
    : "https://api.stytch.com/v1/public";

  console.log(
    `[getStytchOAuthEndpointUrl] Base URL: ${baseURL}, Endpoint: ${endpoint}`
  );
  return `${baseURL}/${env.STYTCH_PROJECT_ID}/${endpoint}`;
}

export function getStytchConnectedAppUrl(
  env: Cloudflare.Env,
  clientId: string
): string {
  const baseURL = env.STYTCH_PROJECT_ID.includes("test")
    ? "https://test.stytch.com/v1/connected_apps/clients"
    : "https://api.stytch.com/v1/connected_apps/clients";

  console.log(
    `[getStytchConnectedAppUrl] Base URL: ${baseURL}, Client ID: ${clientId}`
  );
  return `${baseURL}/${clientId}`;
}

export async function updateStytchConnectedApp(env: Cloudflare.Env, clientId: string, body: UpdateStytchConnectedAppBody) {
    const stytchApiUrl = getStytchConnectedAppUrl(env, clientId);
    const stytchApiSecret = btoa(`${env.STYTCH_PROJECT_ID}:${env.STYTCH_SECRET}`);
    
    try {
        const apiResponse = await fetch(stytchApiUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${stytchApiSecret}`,
            },
            body: JSON.stringify(body),
        });
        
        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error(
                `[updateStytchConnectedApp] Error updating connected app: ${apiResponse.status} ${apiResponse.statusText}`,
                errorBody
            );
        } else {
            const responseData = await apiResponse.json();
            console.log(
                "[updateStytchConnectedApp] Successfully updated connected app:",
                responseData
            );
        }
    } catch (error) {
        console.error(
            "[updateStytchConnectedApp] Exception when updating connected app:",
            error
        );
    }
}
