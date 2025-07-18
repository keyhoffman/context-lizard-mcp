# System Overview: Context Lizard + Cursor MCP Integration

## What Are We Building?

You are building a developer workflow that allows users to create, manage, and retrieve custom code rules and documentation directly from their code editor (Cursor), without ever leaving their development environment. The system consists of several components working together:

- **Context Lizard Web App:** Where users log in, define custom code rules, assign tech stacks, and manage their projects.
- **Supabase Backend:** Stores all user data, generated rule files (in various formats), and documentation.
- **Context Lizard MCP Server:** A Node.js/TypeScript server that acts as a bridge between Cursor and the Context Lizard backend.
- **Cursor Editor:** The code editor where users want to interact with rules, documentation, and automation tools using the MCP protocol.

## Full Workflow: End-to-End Flow

1. **Rule & Project Management (Web App)**
   - Users log into Context Lizard, define rules, assign tech stacks, and manage their projects.
   - The web app stores all configurations, rules, and documentation in Supabase.

2. **Working in Cursor**
   - While coding, users want to access, add, or update code rules and documentation without leaving Cursor.
   - Users can provide "good" and "bad" code examples or other rule data directly in Cursor.

3. **Triggering the MCP Server**
   - Users invoke a tool or command in Cursor (via chat, command palette, or UI) to interact with Context Lizard.
   - Cursor communicates with the local MCP server (running as a Node.js process) using the MCP protocol (typically over stdio).

4. **MCP Server as the Bridge**
   - The MCP server receives requests from Cursor (e.g., fetch rules, add rule, get docs).
   - It fetches or updates data in Supabase as needed.
   - The MCP server can cache data locally (using SQLite or in-memory) to improve performance and reduce redundant network calls.
   - It returns data to Cursor in the required format.

5. **Immediate Feedback in Cursor**
   - Cursor injects the returned rules or documentation into the LLM prompt, chat context, or displays it in the UI.
   - Users see updated rules or documentation instantly, and AI features in Cursor can leverage the new context.

6. **Optional File Generation**
   - If needed, users can trigger file generation (e.g., rule files in JSON, `.mdc`, etc.) for local use.
   - For direct file writing into the project, a separate CLI tool or manual download may be required, as MCP servers typically do not write files to disk directly.

## Detailed Summary: MCP Server Functionality

### Core Role

The MCP server is the **protocol bridge** between Cursor and your cloud backend (Supabase). It enables dynamic, secure, and context-aware communication between the editor and your backend services.

### Key Responsibilities

- **Expose Tools/Commands:**  
  Implements MCP tools such as:
  - `get_rules`: Retrieve project rules.
  - `add_rule`: Accepts "good" and "bad" code examples (and metadata) to create a new rule in the backend.
  - `get_docs`: Fetch documentation for assigned tech stacks.
  - `refresh_cache`: Optionally force-refreshes local cache from Supabase.

- **Handle Requests from Cursor:**  
  Listens for JSON-formatted requests from Cursor, parses arguments, and routes to the appropriate tool handler.

- **Backend Communication:**  
  Makes HTTP requests to Supabase to fetch, create, or update rules and documentation.

- **Local Caching:**  
  Stores recently fetched rules and documentation in a local SQLite database (or in-memory) for fast repeated access and offline resilience.

- **Cross-Platform Operation:**  
  Uses Node.js APIs to ensure all file operations and paths work on Mac, Windows, and Linux.

- **Environment Configuration:**  
  Reads Supabase credentials and other config from environment variables or `.env` files, supporting secure and flexible deployment.

- **Error Handling & Logging:**  
  Returns clear error messages to Cursor for invalid requests or backend errors, and logs activity for troubleshooting.

### Example User Flow: Adding a New Rule

1. **User selects code in Cursor and invokes "Add Rule" tool.**
2. **Cursor sends a request to the MCP server** with the provided code examples.
3. **MCP server calls the Context Lizard backend** to create a new rule with the examples.
4. **Backend generates and stores the new rule** in Supabase.
5. **MCP server fetches the updated rule set** (or just the new rule).
6. **MCP server returns the updated rules** to Cursor.
7. **Cursor injects the new rule into the chat/system prompt**, making it immediately available for AI features.

### Supported Functionality

- **Fetching and returning rules/documentation on demand.**
- **Adding new rules directly from Cursor,** using user-provided examples.
- **Caching data locally for speed and resilience.**
- **Supporting extensibility** for future tools (e.g., project listing, documentation search).
- **Providing a seamless, in-editor workflow** for rule management and context enrichment.

## How the MCP Server Fits Into the System

- **It is the only component Cursor talks to directly**—Cursor never talks to Supabase or your backend APIs itself.
- **Acts as a secure, local process** that mediates all data flow between the editor and Context Lizard.
- **Enables all in-editor automation, context injection, and dynamic rule/documentation retrieval.**
- **Allows you to add new features and tools** for Cursor users without changing the web app or backend.

**In summary:**  
You are building an integrated system where the MCP server is the keystone, enabling developers to manage and use code rules and documentation entirely within Cursor, with real-time, secure, and efficient communication to your Context Lizard backend. This creates a powerful, modern developer experience that streamlines rule creation, retrieval, and AI-powered assistance—all from the editor.

Sources
