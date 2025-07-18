import * as readline from 'readline'
import dotenvFlow from 'dotenv-flow'
import { z } from 'zod'
import path from 'path'
import { zodToJsonSchema } from 'zod-to-json-schema'

dotenvFlow.config({
  path: path.resolve(__dirname)
})

// ----- Error Types -----

type MCPError = {
  code: number
  message: string
}

// ----- Business Object Types -----

export type GetRulesArguments = {
  // Placeholder for future arguments
}

export type GetRulesResponseData = {
  rules: any[] // Placeholder for actual rule objects
}

export type AddRuleArguments = {
  // Placeholder for future arguments
}

export type AddRuleResponseData = {
  ruleId: string
}

export type GetDocsArguments = {
  // Placeholder for future arguments
}

export type GetDocsResponseData = {
  docs: any[] // Placeholder for actual documentation objects
}

export type RefreshCacheArguments = {
  // Placeholder for future arguments
}

export type RefreshCacheResponseData = {
  refreshed: boolean
}

// ----- Type Definitions -----

type CommandHandler<TArgs, TResult> = (args: TArgs) => Promise<TResult>

type CommandDefinition<TArgs, TResult> = {
  description: string
  paramsSchema: z.ZodSchema<TArgs>
  displayName: string
  handler: CommandHandler<TArgs, TResult>
  type: 'chat' | 'background'
}

type CommandRegistry = {
  get_rules: CommandDefinition<GetRulesArguments, GetRulesResponseData>
  add_rule: CommandDefinition<AddRuleArguments, AddRuleResponseData>
  get_docs: CommandDefinition<GetDocsArguments, GetDocsResponseData>
  refresh_cache: CommandDefinition<RefreshCacheArguments, RefreshCacheResponseData>
}

// ----- Protocol Method Types -----

type ProtocolHandlerResult<T = any> =
  | { success: true; result: T }
  | { success: false; error: MCPError }

type ProtocolHandler = (requestId: string, params?: object) => Promise<ProtocolHandlerResult>

type ProtocolMethodDefinition = {
  handler: ProtocolHandler
}

type ProtocolMethodRegistry = {
  initialize: ProtocolMethodDefinition
  'tools/list': ProtocolMethodDefinition
  'tools/call': ProtocolMethodDefinition
}

// ----- Command Handlers -----

async function handleGetRules(args: GetRulesArguments): Promise<GetRulesResponseData> {
  return { rules: [
    { id: 'rule-1', description: 'No hardcoding API keys in source code.' },
    { id: 'rule-2', description: 'All PRs must be reviewed by at least one other engineer.' },
    { id: 'rule-3', description: 'Write unit tests for all new features.' }
  ] }
}

async function handleAddRule(args: AddRuleArguments): Promise<AddRuleResponseData> {
  return { ruleId: 'stub' }
}

async function handleGetDocs(args: GetDocsArguments): Promise<GetDocsResponseData> {
  return { docs: [] }
}

async function handleRefreshCache(args: RefreshCacheArguments): Promise<RefreshCacheResponseData> {
  return { refreshed: true }
}

// ----- Protocol Method Handlers -----

async function handleInitialize(requestId: string): Promise<ProtocolHandlerResult> {
  return {
    success: true,
    result: {
      protocolVersion: '2025-03-26',
      serverInfo: {
        name: 'context-lizard-foo',
        version: '0.2.0'
      },
      capabilities: {
        tools: {
          chat: true
        }
      }
    }
  }
}

async function handleToolsList(requestId: string): Promise<ProtocolHandlerResult> {
  console.error('[MCP] Generating tools list, commandRegistry keys:', Object.keys(commandRegistry))
  console.error('[MCP] toolsList:', toolsList)
  return {
    success: true,
    result: { tools: toolsList }
  }
}

async function handleToolsCall(requestId: string, params?: { name?: string; arguments?: object }): Promise<ProtocolHandlerResult> {
  if (!params || typeof params.name !== 'string') {
    return { success: false, error: { code: -32602, message: 'Missing or invalid tool name in tools/call' } }
  }
  const toolName = params.name
  const toolArgs = params.arguments || {}
  const dispatchResult = await dispatchCommand(toolName as keyof CommandRegistry, toolArgs, requestId)
  if (dispatchResult.success) {
    return { success: true, result: dispatchResult.result }
  } else {
    return { success: false, error: dispatchResult.error }
  }
}

// ----- Response Transformation Layer -----

function createMCPResponse<T>({ requestId, result }: { requestId: any, result: T }): string {
  return JSON.stringify({
    jsonrpc: '2.0',
    id: requestId,
    result
  }) + '\n'
}

function createMCPErrorResponse({ requestId, error }: { requestId: any, error: MCPError }): string {
  return JSON.stringify({
    jsonrpc: '2.0',
    id: requestId,
    error
  }) + '\n'
}

// ----- Command Registry -----

const commandRegistry: CommandRegistry = {
  get_rules: {
    description: 'Retrieve project rules.',
    paramsSchema: z.object({}),
    handler: handleGetRules,
    displayName: 'Get Rules',
    type: 'chat'
  },
  add_rule: {
    description: 'Add a new rule.',
    paramsSchema: z.object({}),
    handler: handleAddRule,
    displayName: 'Add Rule',
    type: 'chat'
  },
  get_docs: {
    description: 'Fetch documentation for assigned tech stacks.',
    paramsSchema: z.object({}),
    handler: handleGetDocs,
    displayName: 'Get Docs',
    type: 'chat'
  },
  refresh_cache: {
    description: 'Force-refresh local cache from Supabase.',
    paramsSchema: z.object({}),
    handler: handleRefreshCache,
    displayName: 'Refresh Cache',
    type: 'chat'
  }
}

// ----- Tools List Generation -----

const toolsList = Object.entries(commandRegistry).map(([name, def]) => {
  const schema = zodToJsonSchema(def.paramsSchema, 'commandInput')
  let inputSchema = schema
  const schemaAny = schema as any
  if (typeof schemaAny.$ref === 'string' && typeof schemaAny.definitions === 'object') {
    const refName = schemaAny.$ref.replace('#/definitions/', '')
    inputSchema = schemaAny.definitions[refName]
  }
  return {
    name,
    displayName: def.displayName,
    description: def.description,
    inputSchema
  }
})

// ----- Protocol Method Registry -----

const protocolMethodRegistry: ProtocolMethodRegistry = {
  initialize: {
    handler: handleInitialize
  },
  'tools/list': {
    handler: handleToolsList
  },
  'tools/call': {
    handler: handleToolsCall
  }
}

// ----- Helper Functions -----

function parseJSONRequest(line: string): { success: true, parsed: any } | { success: false, error: MCPError } {
  try {
    const parsed = JSON.parse(line)
    return { success: true, parsed }
  } catch (err) {
    return { success: false, error: { code: -32700, message: 'Parse error' } }
  }
}

function validateJSONRPCRequest(request: any): { success: true, validated: any } | { success: false, error: MCPError } {
  if (request.jsonrpc !== '2.0' || typeof request.method !== 'string') {
    return { success: false, error: { code: -32600, message: 'Invalid Request' } }
  }

  return { success: true, validated: request }
}

// ----- Type-Safe Dispatcher -----

async function dispatchCommand(
  method: keyof CommandRegistry, 
  params: any, 
  requestId: any
): Promise<{ success: true, result: any } | { success: false, error: MCPError }> {
  const command = commandRegistry[method]
  
  if (!command) {
    return { 
      success: false, 
      error: { code: -32601, message: 'Method not found' } 
    }
  }

  try {
    const validatedParams = command.paramsSchema.parse(params || {})
    const result = await command.handler(validatedParams)
    
    return { success: true, result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: { code: -32602, message: `Invalid params: ${error.message}` } 
      }
    }
    
    return { 
      success: false, 
      error: { code: -32000, message: error instanceof Error ? error.message : 'Unknown error' } 
    }
  }
}

// ----- MCP Server Main Logic -----

console.error('Context Lizard MCP server started. Waiting for JSON-RPC requests on stdin...')

const mcpStdioListener = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
})

mcpStdioListener.on('line', async lineOfInputFromStdin => {
  console.error('[MCP] Received line:', lineOfInputFromStdin)
  
  const parseResult = parseJSONRequest(lineOfInputFromStdin)
  if (!parseResult.success) {
    console.error('[MCP] JSON parse error:', parseResult.error)
    const errorResp = createMCPErrorResponse({ requestId: null, error: parseResult.error })
    process.stdout.write(errorResp)
    return
  }

  const validationResult = validateJSONRPCRequest(parseResult.parsed)
  if (!validationResult.success) {
    console.error('[MCP] Validation error:', validationResult.error)
    const errorResp = createMCPErrorResponse({ requestId: null, error: validationResult.error })
    process.stdout.write(errorResp)
    return
  }

  const request = validationResult.validated

  if (request.id === null || request.id === undefined) {
    console.error('[MCP] Received notification (no response sent):', lineOfInputFromStdin)
    return
  }

  if (request.method in protocolMethodRegistry) {
    const protocolMethod = protocolMethodRegistry[request.method as keyof ProtocolMethodRegistry]
    let handlerResult: ProtocolHandlerResult
    if (protocolMethod.handler.length === 2) {
      handlerResult = await protocolMethod.handler(request.id, request.params)
    } else {
      handlerResult = await protocolMethod.handler(request.id)
    }
    if (handlerResult.success) {
      const resp = createMCPResponse({ requestId: request.id, result: handlerResult.result })
      console.error('[MCP] Outgoing response:', resp)
      process.stdout.write(resp)
    } else {
      console.error('[MCP] Protocol method error:', handlerResult.error)
      const errorResp = createMCPErrorResponse({ 
        requestId: request.id, 
        error: handlerResult.error
      })
      console.error('[MCP] Outgoing response:', errorResp)
      process.stdout.write(errorResp)
    }
    return
  }

  const dispatchResult = await dispatchCommand(request.method as keyof CommandRegistry, request.params, request.id)
  
  if (dispatchResult.success) {
    const resp = createMCPResponse({ requestId: request.id, result: dispatchResult.result })
    process.stdout.write(resp)
  } else {
    console.error('[MCP] Command error:', dispatchResult.error)
    const errorResp = createMCPErrorResponse({ requestId: request.id, error: dispatchResult.error })
    process.stdout.write(errorResp)
  }
})