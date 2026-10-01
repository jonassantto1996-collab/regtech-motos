import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");
  const safeNext =
    requestedNext &&
    requestedNext.startsWith("/admin/") &&
    !requestedNext.startsWith("//")
      ? requestedNext
      : "/admin/reset-password";

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

  const response = NextResponse.redirect(new URL(safeNext, requestUrl.origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
