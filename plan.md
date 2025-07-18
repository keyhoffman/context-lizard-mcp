# Context Lizard MCP Server: Initial Scaffold Plan

## 1. Project Scaffold
- Initialize a Node.js + TypeScript project in `context-lizard-rules-inject-mcp`.
- Set up `tsconfig.json`, `package.json`, and install basic dependencies:
  - `typescript`
  - `ts-node`
  - `dotenv`
  - (others as needed)

## 2. Basic MCP Server
- Create an entrypoint (e.g., `index.ts`) that:
  - Listens for JSON messages on `stdin`
  - Writes JSON responses to `stdout`
- Implement a simple dispatcher for commands:
  - `get_rules`
  - `add_rule`
  - `get_docs`
  - `refresh_cache`
- Each command should have a stub handler for now.

## 3. Configuration
- Set up `dotenv` to load environment variables from a `.env` file.
- Create a sample `.env` file with placeholder variables.

## 4. Stub Backend Communication
- Add placeholder functions for backend API calls (to be implemented later).

## 5. Stub Local Cache
- Implement a simple in-memory cache (e.g., using a `Map` or plain object) for rules and docs.

## 6. Logging & Error Handling
- Add basic logging (using `console.log`) and error handling for invalid requests.

## 7. Documentation
- Add comments and a minimal README section describing how to run the server locally.