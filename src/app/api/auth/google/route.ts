import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google/auth";

export async function GET() {
  const authUrl = getGoogleAuthUrl();
  return NextResponse.redirect(authUrl);
}
