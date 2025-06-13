# Spydr Memory MCP Server

**Author:** Farouk Adeleke (farouk@spydr.dev)  
**Version:** 1.0.0

---

## Overview

The Spydr Memory MCP (Model-Context Protocol) Server is a powerful backend service designed to act as an intelligent intermediary between AI agents and a sophisticated memory storage system. Built with [Hono](https://hono.dev/) for high-performance on edge environments like Cloudflare Workers, it exposes a set of tools that allow authorized agents to securely search and retrieve information from "memories" and "webs" (collections of memories).

Authentication is securely handled by [Stytch](https://stytch.com/), ensuring that all interactions with the memory service are properly authenticated and authorized using JWTs. This server implements the [Model-Context Protocol](https://modelcontext.protocol.ai/), providing a standardized way for AI models to interact with external tools and data sources.

## Key Features

* **High-Performance Edge Server**: Built with Hono, optimized for Cloudflare Workers.
* **Secure Authentication**: Integrated with Stytch for robust JWT-based bearer token and session authentication.
* **Model-Context Protocol (MCP)**: Implements MCP to provide standardized tools for AI agents.
    * **`FindWebs` Tool**: Search for collections of related memories.
    * **`FindMemories` Tool**: Perform semantic searches for specific memories within webs.
* **Service-Oriented Design**: A dedicated `MemoryService` cleanly abstracts communication with the backend Spydr API.
* **OAuth 2.0 Support**: Provides a discovery endpoint for Dynamic Client Registration.
* **Developer-Friendly**: Includes modern tooling like ESLint, Commitlint, and Husky for code quality and consistent commits.

## Directory Structure


.
├── .husky/             # Git hooks (for commit messages)
├── src/
│   ├── lib/
│   │   └── auth.ts     # Stytch authentication middleware
│   ├── index.ts        # Main server entry point and routing
│   ├── MemoryMCP.ts    # MCP agent implementation with tool definitions
│   └── MemoryService.ts# Service for communicating with the Spydr backend API
├── .dev.vars.example   # Example for local development environment variables (Cloudflare)
├── .env.example        # Example for client-side environment variables
├── commitlint.config.mjs # Configuration for commit message linting
├── eslint.config.js    # ESLint configuration
├── LICENSE             # Project License
└── README.md           # This file


## Getting Started

Follow these instructions to get a local instance of the server up and running for development and testing.

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or later recommended)
* [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) for running locally
* A [Stytch](https://stytch.com/) account for authentication credentials.
* Access to the Spydr API endpoint.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd fadeleke57-spydr-memory-mcp
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Configuration

The server requires several environment variables to connect to Stytch and the Spydr API.

1.  **For Local Development (Wrangler):**
    Create a `.dev.vars` file in the root directory by copying the example:
    ```bash
    cp .dev.vars.example .dev.vars
    ```
    Now, edit `.dev.vars` and fill in the values:
    * `STYTCH_PROJECT_ID`: Your Stytch Project ID.
    * `STYTCH_SECRET`: Your Stytch Project Secret.
    * `CLIENT_URL`: The base URL of your client-side application (e.g., `http://localhost:3000`).
    * `API_URL`: The base URL of the Spydr backend API.

2.  **For Client-Side Applications:**
    If you have a frontend component, create a `.env` file for it:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and add your public Stytch token:
    * `VITE_STYTCH_PUBLIC_TOKEN`: Your public token from the Stytch dashboard.

## Running the Server

* **Local Development:**
    Use the Wrangler CLI to run the server locally. It will automatically load the variables from your `.dev.vars` file.
    ```bash
    wrangler dev
    ```
    The server will typically be available at `http://localhost:8787`.

* **Deployment:**
    Deploy the server to your Cloudflare account. Make sure to configure the required secrets (environment variables) in your Cloudflare dashboard.
    ```bash
    wrangler deploy
    ```

## API Endpoints

The server exposes the following endpoints:

* `GET /`: Redirects to the main Spydr Memory application (`https://spydr.dev/memory`).
* `GET /health`: A simple health check endpoint. Returns a `200 OK` status.
* `GET /.well-known/oauth-authorization-server`: OAuth discovery endpoint for client registration.
* `POST /mcp`: The main endpoint for handling MCP requests from AI agents. This endpoint is protected by bearer token authentication.
* `GET /sse/*`: A Server-Sent Events (SSE) endpoint for streaming MCP responses. Also protected by bearer token authentication.

## MCP Tools

The core functionality is exposed through the following MCP tools:

#### 1. `FindWebs`
Searches for Webs (collections of related memories).

* **Description**: "Search for Webs (collections of related memories). Use this only if the user explicitly asks to search for webs, or if you need to narrow the memory search scope by webId."
* **Parameters**:
    * `query` (string, required): The search query for finding relevant webs.
    * `scope` (enum, optional, default: `"All"`):
        * `"User.all"`: Searches only the user's own webs.
        * `"All"`: Includes both public webs and the user's private ones.

#### 2. `FindMemories`
Searches for memories using a semantic query.

* **Description**: "Search for memories using a semantic query. Optionally, limit the search to a specific web or memory. You can also call this tool multiple times (when instructed or to improve context quality) to orchestrate fine-grained context for responses."
* **Parameters**:
    * `query` (string, required): The semantic query used to search memories.
    * `scope` (enum, optional, default: `"User.all"`):
        * `"User.all"`: Searches across all of the user's webs.
        * `"Web"`: Restricts the search to a specific web.
    * `webId` (string, optional): The ID of the web to search within. Required if `scope` is `"Web"`.
    * `sourceId` (string, optional): The ID of a specific memory to search within.

## Contributing

Contributions are welcome! To ensure code quality and a consistent commit history, this project uses ESLint, Prettier, and Commitlint.

* **Commit Messages**: Before committing, please ensure your commit messages adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification. The `commit-msg` hook managed by Husky will automatically check your message.

    Example of a valid commit message:
    ```
    feat: add new `FindMemories` scope for public search
    ```

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.


