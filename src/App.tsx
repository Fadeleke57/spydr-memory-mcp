import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { StytchUIClient } from "@stytch/vanilla-js";
import { StytchProvider } from "@stytch/react";

import Home from "./Home.tsx";
import { Authenticate, Authorize, Login } from "./Auth.tsx";

const stytch = new StytchUIClient(
  import.meta.env.VITE_STYTCH_PUBLIC_TOKEN ?? ""
);

function App() {
  return (
    <StytchProvider stytch={stytch}>
      <main className="flex h-screen flex-col items-center justify-center bg-[hsl(var(--background))]">
        <Router>
          <Routes>
            <Route path="/oauth/authorize" element={<Authorize />} />
            <Route path="/login" element={<Login />} />
            <Route path="/authenticate" element={<Authenticate />} />
            <Route path="/home" element={<Home />} />
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </Router>
      </main>
    </StytchProvider>
  );
}

export default App;
