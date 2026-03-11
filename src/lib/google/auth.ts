import { prisma } from "@/lib/db";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

function getRedirectUri() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/api/auth/google/callback`;
}

/**
 * Generate the Google OAuth authorization URL.
 */
export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeCodeForTokens(code: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();

  // Get user email
  const userInfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${data.access_token}` },
    }
  );
  const userInfo = await userInfoResponse.json();
  const email = userInfo.email || "unknown";

  // Store connection (upsert — only one connection needed)
  const connection = await prisma.googleConnection.upsert({
    where: { id: "agency-connection" },
    update: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || undefined,
      tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
      email,
    },
    create: {
      id: "agency-connection",
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
      email,
    },
  });

  return connection;
}

/**
 * Get a valid access token, refreshing if expired.
 */
export async function getValidAccessToken(): Promise<string> {
  const connection = await prisma.googleConnection.findUnique({
    where: { id: "agency-connection" },
  });

  if (!connection) {
    throw new Error("No Google account connected. Please connect in Settings.");
  }

  // Check if token is still valid (with 5 minute buffer)
  if (connection.tokenExpiry > new Date(Date.now() + 5 * 60 * 1000)) {
    return connection.accessToken;
  }

  // Refresh the token
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: connection.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Google access token. Please reconnect in Settings.");
  }

  const data = await response.json();

  await prisma.googleConnection.update({
    where: { id: "agency-connection" },
    data: {
      accessToken: data.access_token,
      tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return data.access_token;
}

/**
 * Get the current Google connection status.
 */
export async function getGoogleConnectionStatus() {
  const connection = await prisma.googleConnection.findUnique({
    where: { id: "agency-connection" },
  });

  if (!connection) {
    return { connected: false as const };
  }

  return {
    connected: true as const,
    email: connection.email,
    tokenExpiry: connection.tokenExpiry,
  };
}

/**
 * Disconnect Google account.
 */
export async function disconnectGoogle() {
  await prisma.googleConnection.deleteMany();
}
