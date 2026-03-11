import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/settings?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/settings?error=${encodeURIComponent("No authorization code received")}`
    );
  }

  try {
    await exchangeCodeForTokens(code);
    return NextResponse.redirect(
      `${baseUrl}/settings?success=${encodeURIComponent("Google account connected successfully")}`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.redirect(
      `${baseUrl}/settings?error=${encodeURIComponent(message)}`
    );
  }
}
