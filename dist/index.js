"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const readline = __importStar(require("readline"));
const dotenv_flow_1 = __importDefault(require("dotenv-flow"));
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
dotenv_flow_1.default.config({
    path: path_1.default.resolve(__dirname, '..')
});
// ----- Command Handlers -----
function handleGetRules(args) {
    return __awaiter(this, void 0, void 0, function* () {
        return { rules: [] };
    });
}
function handleAddRule(args) {
    return __awaiter(this, void 0, void 0, function* () {
        return { ruleId: 'stub' };
    });
}
function handleGetDocs(args) {
    return __awaiter(this, void 0, void 0, function* () {
        return { docs: [] };
    });
}
function handleRefreshCache(args) {
    return __awaiter(this, void 0, void 0, function* () {
        return { refreshed: true };
    });
}
// ----- Protocol Method Handlers -----
function handleInitialize(requestId) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            protocolVersion: '2024-11-05',
            serverInfo: {
                name: 'context-lizard-foo',
                version: '0.2.0'
            },
            capabilities: {}
        };
    });
}
function handleToolsList(requestId) {
    return __awaiter(this, void 0, void 0, function* () {
        return { tools: toolsList };
    });
}
// ----- Response Transformation Layer -----
function createMCPResponse({ requestId, result }) {
    return JSON.stringify({
        jsonrpc: '2.0',
        id: requestId,
        result
    }) + '\n';
}
function createMCPErrorResponse({ requestId, error }) {
    return JSON.stringify({
        jsonrpc: '2.0',
        id: requestId,
        error
    }) + '\n';
}
// ----- Command Registry -----
const commandRegistry = {
    get_rules: {
        description: 'Retrieve project rules.',
        paramsSchema: zod_1.z.object({}),
        handler: handleGetRules
    },
    add_rule: {
        description: 'Add a new rule.',
        paramsSchema: zod_1.z.object({}),
        handler: handleAddRule
    },
    get_docs: {
        description: 'Fetch documentation for assigned tech stacks.',
        paramsSchema: zod_1.z.object({}),
        handler: handleGetDocs
    },
    refresh_cache: {
        description: 'Force-refresh local cache from Supabase.',
        paramsSchema: zod_1.z.object({}),
        handler: handleRefreshCache
    }
};
// ----- Tools List Generation -----
const toolsList = Object.entries(commandRegistry).map(([name, def]) => ({
    name,
    description: def.description,
    params: { type: 'object', properties: {} }
}));
// ----- Protocol Method Registry -----
const protocolMethodRegistry = {
    initialize: {
        handler: handleInitialize
    },
    'tools/list': {
        handler: handleToolsList
    }
};
// ----- Helper Functions -----
function parseJSONRequest(line) {
    try {
        const parsed = JSON.parse(line);
        return { success: true, parsed };
    }
    catch (err) {
        return { success: false, error: { code: -32700, message: 'Parse error' } };
    }
}
function validateJSONRPCRequest(request) {
    if (request.jsonrpc !== '2.0' || typeof request.method !== 'string') {
        return { success: false, error: { code: -32600, message: 'Invalid Request' } };
    }
    return { success: true, validated: request };
}
// ----- Type-Safe Dispatcher -----
function dispatchCommand(method, params, requestId) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = commandRegistry[method];
        if (!command) {
            return {
                success: false,
                error: { code: -32601, message: 'Method not found' }
            };
        }
        try {
            const validatedParams = command.paramsSchema.parse(params || {});
            const result = yield command.handler(validatedParams);
            return { success: true, result };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return {
                    success: false,
                    error: { code: -32602, message: `Invalid params: ${error.message}` }
                };
            }
            return {
                success: false,
                error: { code: -32000, message: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    });
}
// ----- MCP Server Main Logic -----
console.error('Context Lizard MCP server started. Waiting for JSON-RPC requests on stdin...');
const mcpStdioListener = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});
mcpStdioListener.on('line', (lineOfInputFromStdin) => __awaiter(void 0, void 0, void 0, function* () {
    console.error('[MCP] Received line:', lineOfInputFromStdin);
    const parseResult = parseJSONRequest(lineOfInputFromStdin);
    if (!parseResult.success) {
        console.error('[MCP] JSON parse error:', parseResult.error);
        const errorResp = createMCPErrorResponse({ requestId: null, error: parseResult.error });
        process.stdout.write(errorResp);
        return;
    }
    const validationResult = validateJSONRPCRequest(parseResult.parsed);
    if (!validationResult.success) {
        console.error('[MCP] Validation error:', validationResult.error);
        const errorResp = createMCPErrorResponse({ requestId: null, error: validationResult.error });
        process.stdout.write(errorResp);
        return;
    }
    const request = validationResult.validated;
    if (request.id === null || request.id === undefined) {
        console.error('[MCP] Received notification (no response sent):', lineOfInputFromStdin);
        return;
    }
    if (request.method in protocolMethodRegistry) {
        const protocolMethod = protocolMethodRegistry[request.method];
        try {
            const result = yield protocolMethod.handler(request.id);
            const resp = createMCPResponse({ requestId: request.id, result });
            process.stdout.write(resp);
        }
        catch (error) {
            console.error('[MCP] Protocol method error:', error);
            const errorResp = createMCPErrorResponse({
                requestId: request.id,
                error: { code: -32000, message: error instanceof Error ? error.message : 'Unknown error' }
            });
            process.stdout.write(errorResp);
        }
        return;
    }
    const dispatchResult = yield dispatchCommand(request.method, request.params, request.id);
    if (dispatchResult.success) {
        const resp = createMCPResponse({ requestId: request.id, result: dispatchResult.result });
        process.stdout.write(resp);
    }
    else {
        console.error('[MCP] Command error:', dispatchResult.error);
        const errorResp = createMCPErrorResponse({ requestId: request.id, error: dispatchResult.error });
        process.stdout.write(errorResp);
    }
}));
