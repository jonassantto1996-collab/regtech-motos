import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    const response = NextResponse.redirect(new URL("/admin/forgot-password?error=invalid_link", requestUrl.origin));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const response = NextResponse.redirect(new URL("/admin/forgot-password?error=invalid_link", requestUrl.origin));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const response = NextResponse.redirect(new URL("/admin/reset-password", requestUrl.origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
