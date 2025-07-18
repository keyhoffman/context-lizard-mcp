"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentConfig = exports.getEnvironmentVariable = exports.EnvironmentVariableToProcessMap = exports.AllEnvironmentVariables = void 0;
exports.AllEnvironmentVariables = [
    'supabase_url',
    'supabase_key',
];
exports.EnvironmentVariableToProcessMap = {
    supabase_url: 'SUPABASE_URL',
    supabase_key: 'SUPABASE_KEY',
};
const getEnvironmentVariable = (key) => {
    const value = process.env[exports.EnvironmentVariableToProcessMap[key]];
    return value;
};
exports.getEnvironmentVariable = getEnvironmentVariable;
exports.EnvironmentConfig = {
    supabaseUrl: (0, exports.getEnvironmentVariable)('supabase_url'),
    supabaseKey: (0, exports.getEnvironmentVariable)('supabase_key'),
};
