#!/usr/bin/env node
/**
 * X API Client - ローカルOAuth 1.0a署名版
 *
 * Cloudflare Workers不要で直接X APIを呼び出す
 *
 * 必要な環境変数:
 *   X_API_KEY           - Consumer Key (API Key)
 *   X_API_SECRET        - Consumer Secret (API Secret Key)
 *   X_ACCESS_TOKEN      - Access Token
 *   X_ACCESS_TOKEN_SECRET - Access Token Secret
 *
 * Usage:
 *   const { XClient } = require('./x-client');
 *   const client = new XClient();
 *   await client.tweet('Hello World!');
 */

const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

class XClient {
  constructor(credentials = {}) {
    this.apiKey = credentials.apiKey || process.env.X_API_KEY;
    this.apiSecret = credentials.apiSecret || process.env.X_API_SECRET;
    this.accessToken = credentials.accessToken || process.env.X_ACCESS_TOKEN;
    this.accessTokenSecret = credentials.accessTokenSecret || process.env.X_ACCESS_TOKEN_SECRET;

    if (!this.apiKey || !this.apiSecret || !this.accessToken || !this.accessTokenSecret) {
      throw new Error('X API credentials not set. Required: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET');
    }

    this.baseUrl = 'https://api.x.com';
  }

  /**
   * OAuth 1.0a署名を生成
   */
  generateOAuthSignature(method, url, params) {
    const oauthParams = {
      oauth_consumer_key: this.apiKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: this.accessToken,
      oauth_version: '1.0'
    };

    // パラメータを結合してソート
    const allParams = { ...oauthParams, ...params };
    const sortedKeys = Object.keys(allParams).sort();
    const paramString = sortedKeys
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
      .join('&');

    // 署名ベース文字列
    const signatureBase = [
      method.toUpperCase(),
      encodeURIComponent(url),
      encodeURIComponent(paramString)
    ].join('&');

    // 署名キー
    const signingKey = `${encodeURIComponent(this.apiSecret)}&${encodeURIComponent(this.accessTokenSecret)}`;

    // HMAC-SHA1署名
    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBase)
      .digest('base64');

    oauthParams.oauth_signature = signature;

    return oauthParams;
  }

  /**
   * OAuth Authorizationヘッダーを生成
   */
  generateAuthHeader(method, url, params = {}) {
    const oauthParams = this.generateOAuthSignature(method, url, params);

    const headerValue = Object.keys(oauthParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

    return `OAuth ${headerValue}`;
  }

  /**
   * APIリクエストを実行
   */
  async request(method, endpoint, body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const urlObj = new URL(url);

    const authHeader = this.generateAuthHeader(method, url, {});

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'User-Agent': 'MoltBot-XClient/1.0'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(json)}`));
            } else {
              resolve(json);
            }
          } catch {
            if (res.statusCode >= 400) {
              reject(new Error(`API Error ${res.statusCode}: ${data}`));
            } else {
              resolve({ raw: data });
            }
          }
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  /**
   * ツイートを投稿
   * @param {string} text - ツイート内容
   * @param {Object} options - オプション（reply_to, quote_tweet_id等）
   * @returns {Promise<Object>} 投稿結果
   */
  async tweet(text, options = {}) {
    const body = { text };

    if (options.replyTo) {
      body.reply = { in_reply_to_tweet_id: options.replyTo };
    }

    if (options.quoteTweetId) {
      body.quote_tweet_id = options.quoteTweetId;
    }

    if (options.mediaIds && options.mediaIds.length > 0) {
      body.media = { media_ids: options.mediaIds };
    }

    const result = await this.request('POST', '/2/tweets', body);

    if (result.data) {
      return {
        success: true,
        data: result.data,
        url: `https://x.com/i/status/${result.data.id}`
      };
    }

    return { success: false, errors: result.errors || result };
  }

  /**
   * スレッドを投稿
   * @param {Array<string>} tweets - ツイート配列
   * @returns {Promise<Object>} 投稿結果
   */
  async thread(tweets) {
    const results = [];
    let previousId = null;

    for (const text of tweets) {
      const options = previousId ? { replyTo: previousId } : {};
      const result = await this.tweet(text, options);

      if (!result.success) {
        return {
          success: false,
          posted: results,
          failedAt: results.length,
          error: result.errors
        };
      }

      results.push(result);
      previousId = result.data.id;

      // レート制限対策: 投稿間に少し待機
      await new Promise(r => setTimeout(r, 1000));
    }

    return {
      success: true,
      data: results,
      url: results[0]?.url,
      count: results.length
    };
  }

  /**
   * ツイートを削除
   * @param {string} tweetId - ツイートID
   * @returns {Promise<Object>} 削除結果
   */
  async deleteTweet(tweetId) {
    try {
      const result = await this.request('DELETE', `/2/tweets/${tweetId}`);
      return { success: result.data?.deleted === true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * ツイートを取得
   * @param {string} tweetId - ツイートID
   * @returns {Promise<Object>} ツイート情報
   */
  async getTweet(tweetId) {
    return this.request('GET', `/2/tweets/${tweetId}?tweet.fields=created_at,public_metrics`);
  }

  /**
   * 自分の情報を取得
   * @returns {Promise<Object>} ユーザー情報
   */
  async getMe() {
    return this.request('GET', '/2/users/me?user.fields=created_at,description,public_metrics');
  }
}

module.exports = { XClient };

// CLI mode
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const text = args.slice(1).join(' ');

  if (!command) {
    console.log('Usage:');
    console.log('  node x-client.js tweet "Hello World!"');
    console.log('  node x-client.js thread "First tweet" "Second tweet" "Third tweet"');
    console.log('  node x-client.js delete <tweet_id>');
    console.log('  node x-client.js me');
    console.log('');
    console.log('Required env vars: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET');
    process.exit(0);
  }

  (async () => {
    try {
      const client = new XClient();

      switch (command) {
        case 'tweet':
          if (!text) {
            console.error('Error: Tweet text required');
            process.exit(1);
          }
          console.log('Posting tweet...');
          const tweetResult = await client.tweet(text);
          console.log(JSON.stringify(tweetResult, null, 2));
          break;

        case 'thread':
          const tweets = args.slice(1);
          if (tweets.length < 2) {
            console.error('Error: At least 2 tweets required for a thread');
            process.exit(1);
          }
          console.log(`Posting thread (${tweets.length} tweets)...`);
          const threadResult = await client.thread(tweets);
          console.log(JSON.stringify(threadResult, null, 2));
          break;

        case 'delete':
          const tweetId = args[1];
          if (!tweetId) {
            console.error('Error: Tweet ID required');
            process.exit(1);
          }
          console.log(`Deleting tweet ${tweetId}...`);
          const deleteResult = await client.deleteTweet(tweetId);
          console.log(JSON.stringify(deleteResult, null, 2));
          break;

        case 'me':
          console.log('Getting user info...');
          const meResult = await client.getMe();
          console.log(JSON.stringify(meResult, null, 2));
          break;

        default:
          console.error(`Unknown command: ${command}`);
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}
