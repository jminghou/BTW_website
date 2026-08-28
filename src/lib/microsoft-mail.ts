type GraphRecipient = {
  emailAddress: {
    name?: string;
    address: string;
  };
};

type SendMailInput = {
  subject: string;
  html: string;
  to?: string[];
  replyTo?: string;
};

const DEFAULT_SENDER_EMAIL = 'btw_ops@haohuagroup.com.tw';
const DEFAULT_SENDER_NAME = '官網聯絡表單';
const DEFAULT_NOTIFY_TO = [
  '"Zoe Lee" <zoe.lee@haohuagroup.com.tw>',
  '"Jermaine Hou" <jermaine.hou@haohuagroup.com.tw>',
];

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function requiredEnv(name: string) {
  return process.env[name]?.trim() || '';
}

export function getMicrosoftMailStatus() {
  return {
    MICROSOFT_TENANT_ID: Boolean(requiredEnv('MICROSOFT_TENANT_ID')),
    MICROSOFT_CLIENT_ID: Boolean(requiredEnv('MICROSOFT_CLIENT_ID')),
    MICROSOFT_CLIENT_SECRET: Boolean(requiredEnv('MICROSOFT_CLIENT_SECRET')),
    GRAPH_SENDER_EMAIL: requiredEnv('GRAPH_SENDER_EMAIL') || DEFAULT_SENDER_EMAIL,
  };
}

export function getMissingMicrosoftMailEnv() {
  const missing: string[] = [];
  if (!requiredEnv('MICROSOFT_TENANT_ID')) missing.push('MICROSOFT_TENANT_ID');
  if (!requiredEnv('MICROSOFT_CLIENT_ID')) missing.push('MICROSOFT_CLIENT_ID');
  if (!requiredEnv('MICROSOFT_CLIENT_SECRET')) missing.push('MICROSOFT_CLIENT_SECRET');
  return missing;
}

export function getNotifyRecipients(): GraphRecipient[] {
  const raw = requiredEnv('CONTACT_NOTIFY_EMAILS');
  const items = raw ? parseAddressList(raw) : DEFAULT_NOTIFY_TO;
  return items.map(parseMailbox).filter((item): item is GraphRecipient => Boolean(item));
}

function parseAddressList(raw: string) {
  return raw
    .split(';')
    .flatMap((part) => {
      const trimmed = part.trim();
      if (!trimmed) return [];
      if (trimmed.includes('<') && trimmed.includes('>')) return [trimmed];
      return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
    })
    .filter(Boolean);
}

function parseMailbox(value: string): GraphRecipient | null {
  const named = value.match(/^(?:"?([^"<]+)"?\s*)?<([^>]+)>$/);
  if (named) {
    const address = named[2].trim();
    if (!address) return null;
    const name = named[1]?.trim();
    return {
      emailAddress: name ? { name, address } : { address },
    };
  }

  const address = value.trim();
  if (!address) return null;
  return { emailAddress: { address } };
}

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.accessToken;
  }

  const tenantId = requiredEnv('MICROSOFT_TENANT_ID');
  const clientId = requiredEnv('MICROSOFT_CLIENT_ID');
  const clientSecret = requiredEnv('MICROSOFT_CLIENT_SECRET');

  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    }
  );

  const tokenPayload = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    const detail = tokenPayload.error_description || tokenPayload.error || tokenResponse.statusText;
    throw new Error(`取得 Microsoft 授權失敗：${detail}`);
  }

  cachedToken = {
    accessToken: tokenPayload.access_token,
    expiresAt: now + Number(tokenPayload.expires_in || 3600) * 1000,
  };
  return cachedToken.accessToken;
}

export async function sendMicrosoftMail({ subject, html, to, replyTo }: SendMailInput) {
  const missing = getMissingMicrosoftMailEnv();
  if (missing.length > 0) {
    throw new Error(`未設定 Microsoft Graph：缺少 ${missing.join(', ')}`);
  }

  const senderEmail = requiredEnv('GRAPH_SENDER_EMAIL') || DEFAULT_SENDER_EMAIL;
  const senderName = requiredEnv('GRAPH_SENDER_NAME') || DEFAULT_SENDER_NAME;
  const recipients = to?.map(parseMailbox).filter((item): item is GraphRecipient => Boolean(item))
    || getNotifyRecipients();

  if (recipients.length === 0) {
    throw new Error('沒有可用的通知信收件人');
  }

  const accessToken = await getAccessToken();
  const message: Record<string, unknown> = {
    subject,
    body: {
      contentType: 'HTML',
      content: html,
    },
    toRecipients: recipients,
    from: {
      emailAddress: {
        name: senderName,
        address: senderEmail,
      },
    },
  };

  if (replyTo) {
    message.replyTo = [{ emailAddress: { address: replyTo } }];
  }

  const sendResponse = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderEmail)}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        saveToSentItems: true,
      }),
    }
  );

  if (!sendResponse.ok) {
    let detail = sendResponse.statusText;
    try {
      const payload = await sendResponse.json();
      detail = payload.error?.message || payload.error?.code || JSON.stringify(payload);
    } catch {
      detail = await sendResponse.text();
    }
    throw new Error(`Microsoft Graph 寄信失敗：${detail}`);
  }
}
