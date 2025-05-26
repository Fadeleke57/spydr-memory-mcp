//import { hc } from "hono/client";
//import { TodoApp } from "../api/TodoAPI.ts";
import { Logout, withLoginRequired } from "./Auth.tsx";

//const client = hc<TodoApp>(`${window.location.origin}/api`);

const Home = withLoginRequired(() => {

  return (
    <div className="max-w-md flex flex-col justify-center items-center gap-4 text-center mx-auto text-[hsl(var(--foreground))]">
      <p>
        Welcome to the Spydr MCP Manager! Connect by adding Spydr Memory to
        the config file in the MCP Client...
      </p>
      <span>
        <pre className="bg-[hsl(var(--secondary))] rounded-lg p-4 overflow-x-auto text-left mx-auto max-w-lg">
          <code>
            {`"spydr-memory": {
  "command": "npx",
  "args": [
    "mcp-remote@latest",
    "https://memory.spydr.dev/sse",
    "--host",
    "127.0.0.1"
  ]
}`}
          </code>
        </pre>
      </span>{" "}
      <Logout />
    </div>
  );
});

export default Home;
