import {
  IdentityProvider,
  useStytch,
  useStytchUser,
} from "@stytch/react";
import { useEffect } from "react";
import { Button } from "./components/ui/button";
import { CustomLoginForm } from "./components/LoginForm";

export const withLoginRequired = (Component: React.FC) => () => {
  const { user, fromCache } = useStytchUser();

  useEffect(() => {
    if (!user && !fromCache) {
      localStorage.setItem("returnTo", window.location.href);
      window.location.href = "/login";
    }
  }, [user, fromCache]);

  if (!user) {
    return null;
  }
  return <Component />;
};

const onAuthenticationComplete = () => {
  window.location.href = "/home?src=mcp_auth_complete";
};

export function Login() {
  return <CustomLoginForm />;
}

export const Authorize = withLoginRequired(function () {
  return <IdentityProvider />;
});

export function Authenticate() {
  const client = useStytch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;
    client.oauth
      .authenticate(token, { session_duration_minutes: 60 })
      .then(onAuthenticationComplete);
    console.log("[Authenticate] Redirected to home");
  }, [client]);

  return <span className="text-[hsl(var(--foreground))]">Loading...</span>;
}

export const Logout = function () {
  const stytch = useStytch();
  const { user } = useStytchUser();

  if (!user) return null;

  return <Button className="max-w-md" onClick={() => stytch.session.revoke()}> Log Out </Button>;
};
