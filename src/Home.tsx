import { useState, useEffect, FormEvent } from "react";
import { hc } from "hono/client";
import { TodoApp } from "../api/TodoAPI.ts";
import { Logout, withLoginRequired } from "./Auth.tsx";
import { Todo } from "../types";

const client = hc<TodoApp>(`${window.location.origin}/api`);

const createTodo = (todoText: string) =>
  client.todos
    .$post({ json: { todoText } })
    .then((res) => res.json())
    .then((res) => res.todos);

const getTodos = () =>
  client.todos
    .$get()
    .then((res) => res.json())
    .then((res) => res.todos);

const deleteTodo = (id: string) =>
  client.todos[":id"]
    .$delete({ param: { id } })
    .then((res) => res.json())
    .then((res) => res.todos);

const markComplete = (id: string) =>
  client.todos[":id"].complete
    .$post({ param: { id } })
    .then((res) => res.json())
    .then((res) => res.todos);

const Home = withLoginRequired(() => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState("");

  // Fetch todos on component mount
  useEffect(() => {
    getTodos().then((todos) => setTodos(todos));
  }, []);

  const onAddTodo = (evt: FormEvent) => {
    evt.preventDefault();
    createTodo(newTodoText).then((todos) => setTodos(todos));
    setNewTodoText("");
  };

  const onCompleteTodo = (id: string) => {
    markComplete(id).then((todos) => setTodos(todos));
  };

  const onDeleteTodo = (id: string) => {
    deleteTodo(id).then((todos) => setTodos(todos));
  };

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
    "-y",
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
