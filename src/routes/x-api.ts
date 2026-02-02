import { Hono } from 'hono';
import type { AppEnv, MoltbotEnv } from '../types';

/**
 * X (Twitter) API routes
 *
 * These endpoints provide a secure way for the MoltBot container to post to X
 * without exposing API credentials to the container.
 *
 * Authentication: Uses shared secret (same as CDP_SECRET) or Cloudflare Access
 */
const xApi = new Hono<AppEnv>();

// ============================================================================
// OAuth 1.0a Implementation
// ============================================================================

/**
 * Percent encode a string according to RFC 3986
 * X API requires strict RFC 3986 encoding
 */
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

/**
 * Generate a random nonce for OAuth
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create OAuth 1.0a signature
 */
async function createOAuthSignature(
  method: string,
  url: string,
  oauthParams: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): Promise<string> {
  // 1. Create parameter string (sorted alphabetically)
  const sortedParams = Object.keys(oauthParams)
    .sort()
    .map(key => `${percentEncode(key)}=${percentEncode(oauthParams[key])}`)
    .join('&');

  // 2. Create signature base string
  const signatureBaseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(sortedParams)
  ].join('&');

  // 3. Create signing key
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  // 4. Calculate HMAC-SHA1 signature using Web Crypto API
  const encoder = new TextEncoder();
  const keyData = encoder.encode(signingKey);
  const messageData = encoder.encode(signatureBaseString);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

  // 5. Base64 encode the signature
  const signatureArray = new Uint8Array(signature);
  const binaryString = String.fromCharCode(...signatureArray);
  return btoa(binaryString);
}

/**
 * Build OAuth 1.0a Authorization header
 */
async function buildOAuthHeader(
  method: string,
  url: string,
  env: MoltbotEnv
): Promise<string> {
  const apiKey = env.X_API_KEY;
  const apiSecret = env.X_API_SECRET;
  const accessToken = env.X_ACCESS_TOKEN;
  const accessTokenSecret = env.X_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error('X API credentials not configured');
  }

  // OAuth parameters (without signature)
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: generateNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0'
  };

  // Calculate signature
  const signature = await createOAuthSignature(
    method,
    url,
    oauthParams,
    apiSecret,
    accessTokenSecret
  );

  oauthParams.oauth_signature = signature;

  // Build Authorization header
  const headerParams = Object.keys(oauthParams)
    .sort()
    .map(key => `${percentEncode(key)}="${percentEncode(oauthParams[key])}"`)
    .join(', ');

  return `OAuth ${headerParams}`;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate request authentication
 * Accepts either CDP_SECRET query param or valid Cloudflare Access JWT
 */
function validateAuth(c: { req: { query: (key: string) => string | undefined }; env: MoltbotEnv }): boolean {
  const secret = c.req.query('secret');

  // Check CDP_SECRET authentication
  if (secret && c.env.CDP_SECRET && secret === c.env.CDP_SECRET) {
    return true;
  }

  // For now, also allow requests without auth in dev mode
  if (c.env.DEV_MODE === 'true') {
    return true;
  }

  return false;
}

/**
 * Check if X API credentials are configured
 */
function hasXApiCredentials(env: MoltbotEnv): boolean {
  return !!(
    env.X_API_KEY &&
    env.X_API_SECRET &&
    env.X_ACCESS_TOKEN &&
    env.X_ACCESS_TOKEN_SECRET
  );
}

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /x/status - Check X API configuration status
 */
xApi.get('/status', async (c) => {
  const configured = hasXApiCredentials(c.env);
  const missing: string[] = [];

  if (!c.env.X_API_KEY) missing.push('X_API_KEY');
  if (!c.env.X_API_SECRET) missing.push('X_API_SECRET');
  if (!c.env.X_ACCESS_TOKEN) missing.push('X_ACCESS_TOKEN');
  if (!c.env.X_ACCESS_TOKEN_SECRET) missing.push('X_ACCESS_TOKEN_SECRET');

  return c.json({
    configured,
    missing: missing.length > 0 ? missing : undefined,
    endpoint: '/x/tweet',
    usage: 'POST /x/tweet?secret={CDP_SECRET} with JSON body { "text": "..." }'
  });
});

/**
 * POST /x/tweet - Post a tweet to X
 *
 * Query params:
 *   - secret: CDP_SECRET for authentication
 *
 * Body (JSON):
 *   - text: Tweet text (required, max 280 chars)
 *   - reply_to?: Tweet ID to reply to (optional)
 *   - quote_tweet_id?: Tweet ID to quote (optional)
 *
 * Response:
 *   - success: boolean
 *   - data?: { id, text } on success
 *   - error?: string on failure
 */
xApi.post('/tweet', async (c) => {
  // Validate authentication
  if (!validateAuth(c)) {
    return c.json({
      success: false,
      error: 'Unauthorized. Provide ?secret={CDP_SECRET}'
    }, 401);
  }

  // Check credentials
  if (!hasXApiCredentials(c.env)) {
    return c.json({
      success: false,
      error: 'X API credentials not configured',
      missing: [
        !c.env.X_API_KEY && 'X_API_KEY',
        !c.env.X_API_SECRET && 'X_API_SECRET',
        !c.env.X_ACCESS_TOKEN && 'X_ACCESS_TOKEN',
        !c.env.X_ACCESS_TOKEN_SECRET && 'X_ACCESS_TOKEN_SECRET'
      ].filter(Boolean)
    }, 503);
  }

  // Parse request body
  let body: { text?: string; reply_to?: string; quote_tweet_id?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      error: 'Invalid JSON body'
    }, 400);
  }

  // Validate text
  const text = body.text?.trim();
  if (!text) {
    return c.json({
      success: false,
      error: 'text is required'
    }, 400);
  }

  if (text.length > 280) {
    return c.json({
      success: false,
      error: `Tweet too long: ${text.length}/280 characters`
    }, 400);
  }

  // Build X API request
  const xApiUrl = 'https://api.x.com/2/tweets';

  try {
    // Build OAuth header
    const authHeader = await buildOAuthHeader('POST', xApiUrl, c.env);

    // Build request body
    const requestBody: Record<string, unknown> = { text };

    if (body.reply_to) {
      requestBody.reply = { in_reply_to_tweet_id: body.reply_to };
    }

    if (body.quote_tweet_id) {
      requestBody.quote_tweet_id = body.quote_tweet_id;
    }

    console.log('[X-API] Posting tweet:', text.slice(0, 50) + (text.length > 50 ? '...' : ''));

    // Send request to X API
    const response = await fetch(xApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json() as {
      data?: { id: string; text: string };
      errors?: Array<{ message: string; code?: number }>;
      detail?: string;
      title?: string;
    };

    if (!response.ok) {
      console.error('[X-API] Error response:', JSON.stringify(responseData));

      // Extract error message
      let errorMessage = 'X API error';
      if (responseData.errors?.[0]?.message) {
        errorMessage = responseData.errors[0].message;
      } else if (responseData.detail) {
        errorMessage = responseData.detail;
      } else if (responseData.title) {
        errorMessage = responseData.title;
      }

      return c.json({
        success: false,
        error: errorMessage,
        status: response.status,
        details: responseData
      }, response.status as 400 | 401 | 403 | 429 | 500);
    }

    console.log('[X-API] Tweet posted successfully:', responseData.data?.id);

    // Build tweet URL
    const tweetUrl = responseData.data?.id
      ? `https://x.com/i/status/${responseData.data.id}`
      : undefined;

    return c.json({
      success: true,
      data: responseData.data,
      url: tweetUrl
    }, 201);

  } catch (error) {
    console.error('[X-API] Request failed:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /x/thread - Post a thread (multiple tweets)
 *
 * Body (JSON):
 *   - tweets: Array of tweet texts (required, 2-25 tweets)
 *
 * Response:
 *   - success: boolean
 *   - data?: Array of { id, text } on success
 *   - error?: string on failure
 */
xApi.post('/thread', async (c) => {
  // Validate authentication
  if (!validateAuth(c)) {
    return c.json({
      success: false,
      error: 'Unauthorized. Provide ?secret={CDP_SECRET}'
    }, 401);
  }

  // Check credentials
  if (!hasXApiCredentials(c.env)) {
    return c.json({
      success: false,
      error: 'X API credentials not configured'
    }, 503);
  }

  // Parse request body
  let body: { tweets?: string[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({
      success: false,
      error: 'Invalid JSON body'
    }, 400);
  }

  // Validate tweets array
  const tweets = body.tweets;
  if (!tweets || !Array.isArray(tweets) || tweets.length < 2) {
    return c.json({
      success: false,
      error: 'tweets array with at least 2 items is required'
    }, 400);
  }

  if (tweets.length > 25) {
    return c.json({
      success: false,
      error: 'Maximum 25 tweets per thread'
    }, 400);
  }

  // Validate each tweet
  for (let i = 0; i < tweets.length; i++) {
    const text = tweets[i]?.trim();
    if (!text) {
      return c.json({
        success: false,
        error: `Tweet ${i + 1} is empty`
      }, 400);
    }
    if (text.length > 280) {
      return c.json({
        success: false,
        error: `Tweet ${i + 1} too long: ${text.length}/280 characters`
      }, 400);
    }
  }

  const xApiUrl = 'https://api.x.com/2/tweets';
  const results: Array<{ id: string; text: string }> = [];
  let previousTweetId: string | undefined;

  try {
    for (let i = 0; i < tweets.length; i++) {
      const text = tweets[i].trim();

      // Build OAuth header (must be regenerated for each request due to timestamp/nonce)
      const authHeader = await buildOAuthHeader('POST', xApiUrl, c.env);

      // Build request body
      const requestBody: Record<string, unknown> = { text };
      if (previousTweetId) {
        requestBody.reply = { in_reply_to_tweet_id: previousTweetId };
      }

      console.log(`[X-API] Posting thread tweet ${i + 1}/${tweets.length}`);

      const response = await fetch(xApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json() as {
        data?: { id: string; text: string };
        errors?: Array<{ message: string }>;
      };

      if (!response.ok) {
        console.error(`[X-API] Thread tweet ${i + 1} failed:`, responseData);
        return c.json({
          success: false,
          error: `Failed to post tweet ${i + 1}: ${responseData.errors?.[0]?.message || 'Unknown error'}`,
          posted: results,
          failedAt: i + 1
        }, response.status as 400 | 401 | 403 | 429 | 500);
      }

      if (responseData.data) {
        results.push(responseData.data);
        previousTweetId = responseData.data.id;
      }

      // Rate limit protection: wait 1 second between tweets
      if (i < tweets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[X-API] Thread posted successfully: ${results.length} tweets`);

    // Build thread URL (first tweet)
    const threadUrl = results[0]?.id
      ? `https://x.com/i/status/${results[0].id}`
      : undefined;

    return c.json({
      success: true,
      data: results,
      url: threadUrl,
      count: results.length
    }, 201);

  } catch (error) {
    console.error('[X-API] Thread request failed:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      posted: results
    }, 500);
  }
});

/**
 * DELETE /x/tweet/:id - Delete a tweet
 */
xApi.delete('/tweet/:id', async (c) => {
  // Validate authentication
  if (!validateAuth(c)) {
    return c.json({
      success: false,
      error: 'Unauthorized. Provide ?secret={CDP_SECRET}'
    }, 401);
  }

  // Check credentials
  if (!hasXApiCredentials(c.env)) {
    return c.json({
      success: false,
      error: 'X API credentials not configured'
    }, 503);
  }

  const tweetId = c.req.param('id');
  if (!tweetId) {
    return c.json({
      success: false,
      error: 'Tweet ID is required'
    }, 400);
  }

  const xApiUrl = `https://api.x.com/2/tweets/${tweetId}`;

  try {
    const authHeader = await buildOAuthHeader('DELETE', xApiUrl, c.env);

    console.log('[X-API] Deleting tweet:', tweetId);

    const response = await fetch(xApiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader
      }
    });

    const responseData = await response.json() as {
      data?: { deleted: boolean };
      errors?: Array<{ message: string }>;
    };

    if (!response.ok) {
      console.error('[X-API] Delete failed:', responseData);
      return c.json({
        success: false,
        error: responseData.errors?.[0]?.message || 'Delete failed',
        status: response.status
      }, response.status as 400 | 401 | 403 | 404 | 500);
    }

    console.log('[X-API] Tweet deleted:', tweetId);

    return c.json({
      success: true,
      deleted: responseData.data?.deleted ?? true,
      id: tweetId
    });

  } catch (error) {
    console.error('[X-API] Delete request failed:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { xApi };
