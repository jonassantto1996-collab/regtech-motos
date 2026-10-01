"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import "../../admin.css";

function getSafeNext(search: URLSearchParams): string {
  const requestedNext = search.get("next");
  if (
    requestedNext &&
    requestedNext.startsWith("/admin/") &&
    !requestedNext.startsWith("//")
  ) {
    return requestedNext;
  }
  return "/admin/reset-password";
}

export default function AdminAuthCallbackPage() {
  const [message, setMessage] = useState("Validando seu acesso...");

  useEffect(() => {
    let cancelled = false;

    async function completeAuth() {
      const currentUrl = new URL(window.location.href);
      const search = currentUrl.searchParams;
      const hash = new URLSearchParams(currentUrl.hash.replace(/^#/, ""));
      const next = getSafeNext(search);
      const supabase = createClient();

      const authError =
        search.get("error_description") ||
        hash.get("error_description") ||
        search.get("error") ||
        hash.get("error");

      if (authError) {
        window.location.replace("/admin/forgot-password?error=invalid_link");
        return;
      }

      const code = search.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          window.location.replace("/admin/forgot-password?error=invalid_link");
          return;
        }
        window.location.replace(next);
        return;
      }

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          window.location.replace("/admin/forgot-password?error=invalid_link");
          return;
        }

        window.history.replaceState(
          {},
          document.title,
          currentUrl.pathname + currentUrl.search
        );
        window.location.replace(next);
        return;
      }

      if (!cancelled) {
        setMessage("O link não contém uma sessão válida.");
        window.setTimeout(() => {
          window.location.replace("/admin/forgot-password?error=invalid_link");
        }, 900);
      }
    }

    void completeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="auth-simple-page">
      <section className="auth-simple-card">
        <div className="login-logo dark">
          REGTECH <span>MOTORS</span>
        </div>
        <span className="login-kicker">VALIDAÇÃO DE ACESSO</span>
        <h1>Preparando sua conta</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}
