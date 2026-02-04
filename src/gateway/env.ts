import type { MoltbotEnv } from '../types';

/**
 * Build environment variables to pass to the Moltbot container process
 * 
 * @param env - Worker environment bindings
 * @returns Environment variables record
 */
export function buildEnvVars(env: MoltbotEnv): Record<string, string> {
  const envVars: Record<string, string> = {};

  // Authentication: API key only (subscription OAuth blocked for third-party tools)
  // Normalize the base URL by removing trailing slashes
  const normalizedBaseUrl = env.AI_GATEWAY_BASE_URL?.replace(/\/+$/, '');
  const isOpenAIGateway = normalizedBaseUrl?.endsWith('/openai');

  // API keys
  if (env.AI_GATEWAY_API_KEY) {
    if (isOpenAIGateway) {
      envVars.OPENAI_API_KEY = env.AI_GATEWAY_API_KEY;
    } else {
      envVars.ANTHROPIC_API_KEY = env.AI_GATEWAY_API_KEY;
    }
    console.log('[Auth] AI Gateway API key configured');
  }

  // Direct provider keys
  if (!envVars.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY) {
    envVars.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
    console.log('[Auth] Direct Anthropic API key configured');
  }
  if (!envVars.OPENAI_API_KEY && env.OPENAI_API_KEY) {
    envVars.OPENAI_API_KEY = env.OPENAI_API_KEY;
  }

  // Pass base URL for AI Gateway
  if (normalizedBaseUrl) {
    envVars.AI_GATEWAY_BASE_URL = normalizedBaseUrl;
    if (isOpenAIGateway) {
      envVars.OPENAI_BASE_URL = normalizedBaseUrl;
    } else {
      envVars.ANTHROPIC_BASE_URL = normalizedBaseUrl;
    }
  } else if (env.ANTHROPIC_BASE_URL) {
    envVars.ANTHROPIC_BASE_URL = env.ANTHROPIC_BASE_URL;
  }

  // Log authentication mode
  if (envVars.ANTHROPIC_API_KEY) {
    console.log('[Auth] API mode active');
  }

  // Map MOLTBOT_GATEWAY_TOKEN to CLAWDBOT_GATEWAY_TOKEN (container expects this name)
  if (env.MOLTBOT_GATEWAY_TOKEN) envVars.CLAWDBOT_GATEWAY_TOKEN = env.MOLTBOT_GATEWAY_TOKEN;
  if (env.DEV_MODE) envVars.CLAWDBOT_DEV_MODE = env.DEV_MODE; // Pass DEV_MODE as CLAWDBOT_DEV_MODE to container
  if (env.CLAWDBOT_BIND_MODE) envVars.CLAWDBOT_BIND_MODE = env.CLAWDBOT_BIND_MODE;
  if (env.TELEGRAM_BOT_TOKEN) envVars.TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
  if (env.TELEGRAM_DM_POLICY) envVars.TELEGRAM_DM_POLICY = env.TELEGRAM_DM_POLICY;
  if (env.DISCORD_BOT_TOKEN) envVars.DISCORD_BOT_TOKEN = env.DISCORD_BOT_TOKEN;
  if (env.DISCORD_DM_POLICY) envVars.DISCORD_DM_POLICY = env.DISCORD_DM_POLICY;
  if (env.DISCORD_WATCH_CHANNELS) envVars.DISCORD_WATCH_CHANNELS = env.DISCORD_WATCH_CHANNELS;
  if (env.SLACK_BOT_TOKEN) envVars.SLACK_BOT_TOKEN = env.SLACK_BOT_TOKEN;
  if (env.SLACK_APP_TOKEN) envVars.SLACK_APP_TOKEN = env.SLACK_APP_TOKEN;
  if (env.CDP_SECRET) envVars.CDP_SECRET = env.CDP_SECRET;
  if (env.WORKER_URL) envVars.WORKER_URL = env.WORKER_URL;
  // MOLTBOT_URL for X API calls (fallback to WORKER_URL if not set)
  if (env.MOLTBOT_URL || env.WORKER_URL) {
    envVars.MOLTBOT_URL = env.MOLTBOT_URL || env.WORKER_URL;
  }

  // Google AI / Gemini API
  if (env.GOOGLE_AI_API_KEY) envVars.GOOGLE_AI_API_KEY = env.GOOGLE_AI_API_KEY;
  if (env.GOOGLE_EMAIL) envVars.GOOGLE_EMAIL = env.GOOGLE_EMAIL;
  if (env.GOOGLE_PASSWORD) envVars.GOOGLE_PASSWORD = env.GOOGLE_PASSWORD;
  if (env.GOOGLE_APP_PASSWORD) envVars.GOOGLE_APP_PASSWORD = env.GOOGLE_APP_PASSWORD;
  if (env.GOOGLE_SERVICE_ACCOUNT_KEY) envVars.GOOGLE_SERVICE_ACCOUNT_KEY = env.GOOGLE_SERVICE_ACCOUNT_KEY;

  // X (Twitter) browser credentials
  if (env.X_USERNAME) envVars.X_USERNAME = env.X_USERNAME;
  if (env.X_PASSWORD) envVars.X_PASSWORD = env.X_PASSWORD;
  // X API credentials (for container-side calls if needed)
  if (env.X_API_KEY) envVars.X_API_KEY = env.X_API_KEY;
  if (env.X_API_SECRET) envVars.X_API_SECRET = env.X_API_SECRET;
  if (env.X_ACCESS_TOKEN) envVars.X_ACCESS_TOKEN = env.X_ACCESS_TOKEN;
  if (env.X_ACCESS_TOKEN_SECRET) envVars.X_ACCESS_TOKEN_SECRET = env.X_ACCESS_TOKEN_SECRET;

  // SNS platform credentials
  if (env.NOTE_EMAIL) envVars.NOTE_EMAIL = env.NOTE_EMAIL;
  if (env.NOTE_PASSWORD) envVars.NOTE_PASSWORD = env.NOTE_PASSWORD;
  if (env.THREADS_USERNAME) envVars.THREADS_USERNAME = env.THREADS_USERNAME;
  if (env.THREADS_PASSWORD) envVars.THREADS_PASSWORD = env.THREADS_PASSWORD;
  if (env.COCONALA_EMAIL) envVars.COCONALA_EMAIL = env.COCONALA_EMAIL;
  if (env.COCONALA_PASSWORD) envVars.COCONALA_PASSWORD = env.COCONALA_PASSWORD;
  if (env.METAMASK_PASSWORD) envVars.METAMASK_PASSWORD = env.METAMASK_PASSWORD;

  return envVars;
}
