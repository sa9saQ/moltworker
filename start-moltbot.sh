#!/bin/bash
# Startup script for Moltbot in Cloudflare Sandbox
# Version: 2026-02-03-v57-env-vars-debug
# This script:
# 1. Restores config from R2 backup if available
# 2. Configures moltbot from environment variables
# 3. Starts a background sync to backup config to R2
# 4. Starts the gateway

set -e

# Check if clawdbot gateway is already running - bail early if so
# Note: CLI is still named "clawdbot" until upstream renames it
if pgrep -f "clawdbot gateway" > /dev/null 2>&1; then
    echo "Moltbot gateway is already running, exiting."
    exit 0
fi

# Paths (clawdbot paths are used internally - upstream hasn't renamed yet)
CONFIG_DIR="/root/.clawdbot"
CONFIG_FILE="$CONFIG_DIR/clawdbot.json"
TEMPLATE_DIR="/root/.clawdbot-templates"
TEMPLATE_FILE="$TEMPLATE_DIR/moltbot.json.template"
BACKUP_DIR="/data/moltbot"

echo "Config directory: $CONFIG_DIR"
echo "Backup directory: $BACKUP_DIR"

# Create config directory
mkdir -p "$CONFIG_DIR"

# ============================================================
# RESTORE FROM R2 BACKUP
# ============================================================
# Check if R2 backup exists by looking for clawdbot.json
# The BACKUP_DIR may exist but be empty if R2 was just mounted
# Note: backup structure is $BACKUP_DIR/clawdbot/ and $BACKUP_DIR/skills/

# Helper function to check if R2 backup is newer than local
should_restore_from_r2() {
    local R2_SYNC_FILE="$BACKUP_DIR/.last-sync"
    local LOCAL_SYNC_FILE="$CONFIG_DIR/.last-sync"
    
    # If no R2 sync timestamp, don't restore
    if [ ! -f "$R2_SYNC_FILE" ]; then
        echo "No R2 sync timestamp found, skipping restore"
        return 1
    fi
    
    # If no local sync timestamp, restore from R2
    if [ ! -f "$LOCAL_SYNC_FILE" ]; then
        echo "No local sync timestamp, will restore from R2"
        return 0
    fi
    
    # Compare timestamps
    R2_TIME=$(cat "$R2_SYNC_FILE" 2>/dev/null)
    LOCAL_TIME=$(cat "$LOCAL_SYNC_FILE" 2>/dev/null)
    
    echo "R2 last sync: $R2_TIME"
    echo "Local last sync: $LOCAL_TIME"
    
    # Convert to epoch seconds for comparison
    R2_EPOCH=$(date -d "$R2_TIME" +%s 2>/dev/null || echo "0")
    LOCAL_EPOCH=$(date -d "$LOCAL_TIME" +%s 2>/dev/null || echo "0")
    
    if [ "$R2_EPOCH" -gt "$LOCAL_EPOCH" ]; then
        echo "R2 backup is newer, will restore"
        return 0
    else
        echo "Local data is newer or same, skipping restore"
        return 1
    fi
}

if [ -f "$BACKUP_DIR/clawdbot/clawdbot.json" ]; then
    if should_restore_from_r2; then
        echo "Restoring from R2 backup at $BACKUP_DIR/clawdbot..."
        cp -a "$BACKUP_DIR/clawdbot/." "$CONFIG_DIR/"
        # Copy the sync timestamp to local so we know what version we have
        cp -f "$BACKUP_DIR/.last-sync" "$CONFIG_DIR/.last-sync" 2>/dev/null || true
        echo "Restored config from R2 backup"
    fi
elif [ -f "$BACKUP_DIR/clawdbot.json" ]; then
    # Legacy backup format (flat structure)
    if should_restore_from_r2; then
        echo "Restoring from legacy R2 backup at $BACKUP_DIR..."
        cp -a "$BACKUP_DIR/." "$CONFIG_DIR/"
        cp -f "$BACKUP_DIR/.last-sync" "$CONFIG_DIR/.last-sync" 2>/dev/null || true
        echo "Restored config from legacy R2 backup"
    fi
elif [ -d "$BACKUP_DIR" ]; then
    echo "R2 mounted at $BACKUP_DIR but no backup data found yet"
else
    echo "R2 not mounted, starting fresh"
fi

# Restore skills from R2 backup if available (only if R2 is newer)
SKILLS_DIR="/root/clawd/skills"
if [ -d "$BACKUP_DIR/skills" ] && [ "$(ls -A $BACKUP_DIR/skills 2>/dev/null)" ]; then
    if should_restore_from_r2; then
        echo "Restoring skills from $BACKUP_DIR/skills..."
        mkdir -p "$SKILLS_DIR"
        cp -a "$BACKUP_DIR/skills/." "$SKILLS_DIR/"
        echo "Restored skills from R2 backup"
    fi
fi

# If config file still doesn't exist, create from template
if [ ! -f "$CONFIG_FILE" ]; then
    echo "No existing config found, initializing from template..."
    if [ -f "$TEMPLATE_FILE" ]; then
        cp "$TEMPLATE_FILE" "$CONFIG_FILE"
    else
        # Create minimal config if template doesn't exist
        cat > "$CONFIG_FILE" << 'EOFCONFIG'
{
  "agents": {
    "defaults": {
      "workspace": "/root/clawd"
    }
  },
  "gateway": {
    "port": 18789,
    "mode": "local"
  }
}
EOFCONFIG
    fi
else
    echo "Using existing config"
fi

# ============================================================
# CHECK CRITICAL ENVIRONMENT VARIABLES
# ============================================================
echo "Checking environment variables..."
echo "=== Core API Keys ==="
echo "ANTHROPIC_API_KEY set: $([ -n \"$ANTHROPIC_API_KEY\" ] && echo 'YES (len='${#ANTHROPIC_API_KEY}')' || echo 'NO')"
echo "OPENAI_API_KEY set: $([ -n \"$OPENAI_API_KEY\" ] && echo 'YES' || echo 'NO')"
echo "GOOGLE_AI_API_KEY set: $([ -n \"$GOOGLE_AI_API_KEY\" ] && echo 'YES (len='${#GOOGLE_AI_API_KEY}')' || echo 'NO')"
echo "=== Chat Channels ==="
echo "DISCORD_BOT_TOKEN set: $([ -n \"$DISCORD_BOT_TOKEN\" ] && echo 'YES' || echo 'NO')"
echo "=== Gateway/Worker ==="
echo "CLAWDBOT_GATEWAY_TOKEN set: $([ -n \"$CLAWDBOT_GATEWAY_TOKEN\" ] && echo 'YES' || echo 'NO')"
echo "WORKER_URL set: $([ -n \"$WORKER_URL\" ] && echo 'YES' || echo 'NO')"
echo "MOLTBOT_URL set: $([ -n \"$MOLTBOT_URL\" ] && echo 'YES' || echo 'NO')"
echo "CDP_SECRET set: $([ -n \"$CDP_SECRET\" ] && echo 'YES' || echo 'NO')"
echo "=== X (Twitter) API ==="
echo "X_API_KEY set: $([ -n \"$X_API_KEY\" ] && echo 'YES' || echo 'NO')"
echo "X_API_SECRET set: $([ -n \"$X_API_SECRET\" ] && echo 'YES' || echo 'NO')"
echo "X_ACCESS_TOKEN set: $([ -n \"$X_ACCESS_TOKEN\" ] && echo 'YES' || echo 'NO')"
echo "X_ACCESS_TOKEN_SECRET set: $([ -n \"$X_ACCESS_TOKEN_SECRET\" ] && echo 'YES' || echo 'NO')"
echo "X_USERNAME set: $([ -n \"$X_USERNAME\" ] && echo 'YES' || echo 'NO')"

# ============================================================
# UPDATE CONFIG FROM ENVIRONMENT VARIABLES
# ============================================================
node << EOFNODE
const fs = require('fs');

const configPath = '/root/.clawdbot/clawdbot.json';
console.log('Updating config at:', configPath);
let config = {};

try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
    console.log('Starting with empty config');
}

// Clean up invalid browser profile keys from R2 backup (not recognized by clawdbot)
if (config.browser?.profiles) {
    for (const [name, profile] of Object.entries(config.browser.profiles)) {
        if (profile && typeof profile === 'object') {
            delete profile.connectionTimeout;
            delete profile.navigationTimeout;
            delete profile.timeout;
        }
    }
    console.log('Cleaned up invalid browser profile keys');
}

// Ensure nested objects exist
config.agents = config.agents || {};
config.agents.defaults = config.agents.defaults || {};
config.agents.defaults.model = config.agents.defaults.model || {};
config.gateway = config.gateway || {};
config.channels = config.channels || {};

// Clean up any broken anthropic provider config from previous runs
// (older versions didn't include required 'name' field)
if (config.models?.providers?.anthropic?.models) {
    const hasInvalidModels = config.models.providers.anthropic.models.some(m => !m.name);
    if (hasInvalidModels) {
        console.log('Removing broken anthropic provider config (missing model names)');
        delete config.models.providers.anthropic;
    }
}



// Gateway configuration
config.gateway.port = 18789;
config.gateway.mode = 'local';
config.gateway.trustedProxies = ['10.1.0.0'];

// Set gateway token if provided (support both old and new names)
const gatewayToken = process.env.CLAWDBOT_GATEWAY_TOKEN || process.env.MOLTBOT_GATEWAY_TOKEN;
if (gatewayToken) {
    config.gateway.auth = config.gateway.auth || {};
    config.gateway.auth.token = gatewayToken;
}

// Allow insecure auth for dev mode
if (process.env.CLAWDBOT_DEV_MODE === 'true') {
    config.gateway.controlUi = config.gateway.controlUi || {};
    config.gateway.controlUi.allowInsecureAuth = true;
}

// Telegram configuration
if (process.env.TELEGRAM_BOT_TOKEN) {
    config.channels.telegram = config.channels.telegram || {};
    config.channels.telegram.botToken = process.env.TELEGRAM_BOT_TOKEN;
    config.channels.telegram.enabled = true;
    config.channels.telegram.dm = config.channels.telegram.dm || {};
    config.channels.telegram.dmPolicy = process.env.TELEGRAM_DM_POLICY || 'pairing';
}

// Discord configuration
if (process.env.DISCORD_BOT_TOKEN) {
    config.channels.discord = config.channels.discord || {};
    config.channels.discord.token = process.env.DISCORD_BOT_TOKEN;
    config.channels.discord.enabled = true;
    config.channels.discord.dm = config.channels.discord.dm || {};
    const dmPolicy = process.env.DISCORD_DM_POLICY || 'pairing';
    config.channels.discord.dm.policy = dmPolicy;
    // When policy is 'open', allowFrom must include '*'
    if (dmPolicy === 'open') {
        config.channels.discord.dm.allowFrom = ['*'];
    }
    // Allow all guilds by default (otherwise requires explicit allowlist)
    config.channels.discord.groupPolicy = 'open';

    // NOTE: watchChannels is not supported by clawdbot CLI
    // If needed in future, check upstream for proper config key
}

// Browser configuration for Cloudflare Browser Rendering
// This allows MoltWorker to use browser automation via CDP WebSocket
if (process.env.CDP_SECRET && process.env.WORKER_URL) {
    config.browser = config.browser || {};
    config.browser.enabled = true;  // Explicitly enable browser
    // Increase timeouts for remote CDP over internet (Cloudflare edge)
    // Browser Rendering can take 30+ seconds to spin up on first connection
    config.browser.remoteCdpTimeoutMs = 60000;  // 60 seconds for reachability check
    config.browser.remoteCdpHandshakeTimeoutMs = 90000;  // 90 seconds for WebSocket handshake
    config.browser.profiles = config.browser.profiles || {};
    // Clean up invalid keys from old config (not recognized by clawdbot)
    if (config.browser.profiles.cloudflare) {
        delete config.browser.profiles.cloudflare.connectionTimeout;
        delete config.browser.profiles.cloudflare.navigationTimeout;
        delete config.browser.profiles.cloudflare.timeout;
    }
    config.browser.profiles.cloudflare = {
        cdpUrl: process.env.WORKER_URL.replace(/\/$/, '') + '/cdp?secret=' + encodeURIComponent(process.env.CDP_SECRET),
        color: '#FF6B35',  // Required field for browser profile
    };
    config.browser.defaultProfile = 'cloudflare';
    console.log('Browser profile configured for Cloudflare Browser Rendering');
    console.log('CDP URL:', config.browser.profiles.cloudflare.cdpUrl.replace(/secret=.*/, 'secret=***'));
}

// Slack configuration
if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_APP_TOKEN) {
    config.channels.slack = config.channels.slack || {};
    config.channels.slack.botToken = process.env.SLACK_BOT_TOKEN;
    config.channels.slack.appToken = process.env.SLACK_APP_TOKEN;
    config.channels.slack.enabled = true;
}

// Base URL override (e.g., for Cloudflare AI Gateway)
// Usage: Set AI_GATEWAY_BASE_URL or ANTHROPIC_BASE_URL to your endpoint like:
//   https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/anthropic
//   https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai
const baseUrl = (process.env.AI_GATEWAY_BASE_URL || process.env.ANTHROPIC_BASE_URL || '').replace(/\/+$/, '');
const isOpenAI = baseUrl.endsWith('/openai');

if (isOpenAI) {
    // Create custom openai provider config with baseUrl override
    // Omit apiKey so moltbot falls back to OPENAI_API_KEY env var
    console.log('Configuring OpenAI provider with base URL:', baseUrl);
    config.models = config.models || {};
    config.models.providers = config.models.providers || {};
    config.models.providers.openai = {
        baseUrl: baseUrl,
        api: 'openai-responses',
        models: [
            { id: 'gpt-5.2', name: 'GPT-5.2', contextWindow: 200000 },
            { id: 'gpt-5', name: 'GPT-5', contextWindow: 200000 },
            { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview', contextWindow: 128000 },
        ]
    };
    // Add models to the allowlist so they appear in /models
    config.agents.defaults.models = config.agents.defaults.models || {};
    config.agents.defaults.models['openai/gpt-5.2'] = { alias: 'GPT-5.2' };
    config.agents.defaults.models['openai/gpt-5'] = { alias: 'GPT-5' };
    config.agents.defaults.models['openai/gpt-4.5-preview'] = { alias: 'GPT-4.5' };
    config.agents.defaults.model.primary = 'openai/gpt-5.2';
} else if (baseUrl) {
    console.log('Configuring Anthropic provider with base URL:', baseUrl);
    config.models = config.models || {};
    config.models.providers = config.models.providers || {};
    const providerConfig = {
        baseUrl: baseUrl,
        api: 'anthropic-messages',
        models: [
            { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', contextWindow: 200000 },
            { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', contextWindow: 200000 },
        ]
    };
    // Include API key in provider config if set (required when using custom baseUrl)
    if (process.env.ANTHROPIC_API_KEY) {
        providerConfig.apiKey = process.env.ANTHROPIC_API_KEY;
    }
    config.models.providers.anthropic = providerConfig;
    // Add models to the allowlist so they appear in /models
    config.agents.defaults.models = config.agents.defaults.models || {};
    config.agents.defaults.models['anthropic/claude-opus-4-5-20251101'] = { alias: 'Opus 4.5' };
    config.agents.defaults.models['anthropic/claude-sonnet-4-5-20250929'] = { alias: 'Sonnet 4.5' };
    // Default to Sonnet for cost efficiency (model-router skill will switch to Opus when needed)
    config.agents.defaults.model.primary = 'anthropic/claude-sonnet-4-5-20250929';
} else {
    // Default to Sonnet 4.5 with direct Anthropic API access
    // Always configure anthropic provider properly to avoid config validation errors
    console.log('Configuring Anthropic provider with direct API access');
    config.models = config.models || {};
    config.models.providers = config.models.providers || {};
    const providerConfig = {
        baseUrl: 'https://api.anthropic.com',  // Default Anthropic API endpoint
        api: 'anthropic-messages',
        models: [
            { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', contextWindow: 200000 },
            { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', contextWindow: 200000 },
        ]
    };
    // Include API key in provider config
    if (process.env.ANTHROPIC_API_KEY) {
        providerConfig.apiKey = process.env.ANTHROPIC_API_KEY;
        console.log('API key included in provider config (len=' + process.env.ANTHROPIC_API_KEY.length + ')');
    }
    config.models.providers.anthropic = providerConfig;
    // Add models to the allowlist so they appear in /models
    config.agents.defaults.models = config.agents.defaults.models || {};
    config.agents.defaults.models['anthropic/claude-opus-4-5-20251101'] = { alias: 'Opus 4.5' };
    config.agents.defaults.models['anthropic/claude-sonnet-4-5-20250929'] = { alias: 'Sonnet 4.5' };
    config.agents.defaults.model.primary = 'anthropic/claude-sonnet-4-5-20250929';
}

// Tools configuration - disable exec approval for autonomous operation
config.tools = config.tools || {};
config.tools.exec = config.tools.exec || {};
config.tools.exec.security = 'full';  // Skip all approval gates
config.tools.elevated = config.tools.elevated || {};
config.tools.elevated.enabled = true;
console.log('Tools configured: exec.security=full (approvals disabled)');

// Commands configuration - enable restart command
config.commands = config.commands || {};
config.commands.restart = true;
console.log('Commands configured: restart=true');

// Write updated config
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('Configuration updated successfully');
console.log('Config:', JSON.stringify(config, null, 2));
EOFNODE

# ============================================================
# START GATEWAY
# ============================================================
# Note: R2 backup sync is handled by the Worker's cron trigger
echo "Starting Moltbot Gateway..."
echo "Gateway will be available on port 18789"

# Clean up stale lock files
rm -f /tmp/clawdbot-gateway.lock 2>/dev/null || true
rm -f "$CONFIG_DIR/gateway.lock" 2>/dev/null || true

BIND_MODE="lan"
echo "Dev mode: ${CLAWDBOT_DEV_MODE:-false}, Bind mode: $BIND_MODE"

# Support both old (CLAWDBOT_*) and new (MOLTBOT_*) environment variable names
GATEWAY_TOKEN="${CLAWDBOT_GATEWAY_TOKEN:-$MOLTBOT_GATEWAY_TOKEN}"

if [ -n "$GATEWAY_TOKEN" ]; then
    echo "Starting gateway with token auth..."
    exec clawdbot gateway --port 18789 --verbose --allow-unconfigured --bind "$BIND_MODE" --token "$GATEWAY_TOKEN"
else
    echo "Starting gateway with device pairing (no token)..."
    exec clawdbot gateway --port 18789 --verbose --allow-unconfigured --bind "$BIND_MODE"
fi
