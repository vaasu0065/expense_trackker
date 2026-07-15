const { google } = require('googleapis');
const { parseRawMessage } = require('./regexEngine');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const getOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

/**
 * Generate Google OAuth Consent URL with Gmail Readonly Scope.
 */
function getConsentUrl(userId) {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/gmail.readonly'
    ],
    state: userId.toString()
  });
}

/**
 * Exchange Authorization Code for Tokens and store in User schema.
 */
async function exchangeCodeForTokens(userId, code) {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  
  const user = await User.findById(userId).select('+gmailAccessToken +gmailRefreshToken');
  if (!user) throw new Error('User not found');

  user.gmailAccessToken = tokens.access_token;
  if (tokens.refresh_token) {
    user.gmailRefreshToken = tokens.refresh_token;
  }
  user.gmailSyncEnabled = true;
  await user.save();

  return tokens;
}

/**
 * Helper to get authenticated Gmail client for a user.
 */
async function getAuthenticatedGmailClient(user) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: user.gmailAccessToken,
    refresh_token: user.gmailRefreshToken
  });

  // Automatically refresh access token if expired
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      user.gmailAccessToken = tokens.access_token;
      await user.save();
    }
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Incremental Gmail Transaction Sync
 * Scans emails using `startHistoryId` checkpoint if available, or fallback query scan.
 */
async function syncGmailTransactions(userId) {
  const user = await User.findById(userId).select('+gmailAccessToken +gmailRefreshToken');
  if (!user || !user.gmailSyncEnabled || !user.gmailAccessToken) {
    throw new Error('Gmail sync is not enabled or authenticated for this user');
  }

  const gmail = await getAuthenticatedGmailClient(user);
  const newTransactions = [];
  let latestHistoryId = user.lastGmailSyncHistoryId;

  // 1. Check if we can do Incremental Sync via `users.history.list`
  if (user.lastGmailSyncHistoryId) {
    try {
      const historyRes = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: user.lastGmailSyncHistoryId,
        historyTypes: ['messageAdded']
      });

      latestHistoryId = historyRes.data.historyId || latestHistoryId;
      const history = historyRes.data.history || [];

      for (const record of history) {
        const messagesAdded = record.messagesAdded || [];
        for (const item of messagesAdded) {
          if (item.message && item.message.id) {
            const parsed = await fetchAndParseEmail(gmail, item.message.id, user._id);
            if (parsed) newTransactions.push(parsed);
          }
        }
      }
    } catch (err) {
      console.warn(`History sync expired or failed (${err.message}). Falling back to query search.`);
      user.lastGmailSyncHistoryId = null; // Clear to trigger query search below
    }
  }

  // 2. Fallback / Initial Sync via `users.messages.list` (Recent 50 alerts)
  if (!user.lastGmailSyncHistoryId) {
    const query = `subject:(debited OR credited OR payment OR "UPI transaction" OR spent OR "Bank Card") from:(alerts@sbi.co.in OR alerts@hdfcbank.net OR notify@icicibank.com OR alerts@axisbank.com OR no-reply@phonepe.com OR paytm@paytm.com OR googlepay@google.com OR amazonpay@amazon.com)`;
    
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 30
    });

    const messages = listRes.data.messages || [];
    for (const msg of messages) {
      const parsed = await fetchAndParseEmail(gmail, msg.id, user._id);
      if (parsed) newTransactions.push(parsed);
    }

    // Get current profile historyId for future incremental syncs
    const profileRes = await gmail.users.getProfile({ userId: 'me' });
    latestHistoryId = profileRes.data.historyId;
  }

  // 3. Batch insert new transactions via `upsert` to prevent duplicates
  let importedCount = 0;
  if (newTransactions.length > 0) {
    const bulkOps = newTransactions.map((t) => ({
      updateOne: {
        filter: { userId: t.userId, transactionReference: t.transactionReference },
        update: { $setOnInsert: t },
        upsert: true
      }
    }));

    const result = await Transaction.bulkWrite(bulkOps, { ordered: false });
    importedCount = result.upsertedCount || 0;
  }

  // 4. Update user sync checkpoint
  user.lastGmailSyncHistoryId = latestHistoryId;
  user.lastGmailSyncDate = new Date();
  await user.save();

  return {
    scannedCount: newTransactions.length,
    importedCount,
    latestHistoryId
  };
}

/**
 * Fetch full message details, decode base64 body, and run through Regex Engine.
 */
async function fetchAndParseEmail(gmail, messageId, userId) {
  try {
    const msgRes = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    const payload = msgRes.data.payload;
    if (!payload) return null;

    let snippet = msgRes.data.snippet || '';
    let bodyText = snippet;

    // Try to get plain text body if available
    if (payload.parts && payload.parts.length > 0) {
      const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
      if (textPart && textPart.body && textPart.body.data) {
        bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    } else if (payload.body && payload.body.data) {
      bodyText = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    const parsed = parseRawMessage(bodyText || snippet, 'gmail');
    if (parsed) {
      parsed.userId = userId;
      return parsed;
    }
    return null;
  } catch (err) {
    console.error(`Error parsing email ID ${messageId}:`, err.message);
    return null;
  }
}

module.exports = {
  getConsentUrl,
  exchangeCodeForTokens,
  syncGmailTransactions
};
