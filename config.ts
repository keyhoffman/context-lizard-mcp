export const AllEnvironmentVariables = [
  'supabase_url',
  'supabase_key',
] as const

export type EnvironmentVariable = typeof AllEnvironmentVariables[number]

export const EnvironmentVariableToProcessMap: Record<EnvironmentVariable, string> = {
  supabase_url: 'SUPABASE_URL',
  supabase_key: 'SUPABASE_KEY',
}

export const getEnvironmentVariable = (key: EnvironmentVariable): string => {
  const value = process.env[EnvironmentVariableToProcessMap[key]]!
  return value
}

export const EnvironmentConfig = {
  supabaseUrl: getEnvironmentVariable('supabase_url'),
  supabaseKey: getEnvironmentVariable('supabase_key'),
} 