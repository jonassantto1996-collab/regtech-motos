import Link from "next/link";
import type { ReactNode } from "react";

type AdminSection = "dashboard" | "products" | "leads" | "hero";

export function AdminShell({
  active,
  email,
  children,
}: {
  active: AdminSection;
  email?: string;
  children: ReactNode;
}) {
  const initial = (email ?? "A").slice(0, 1).toUpperCase();

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-logo">REGTECH <span>MOTORS</span></div>
        <nav>
          <Link className={active === "dashboard" ? "nav-active" : ""} href="/admin">⌂ <span>Dashboard</span></Link>
          <small>CATÁLOGO</small>
          <Link className={active === "products" ? "nav-active" : ""} href="/admin/products">◈ <span>Motos</span></Link>
          <Link className={active === "hero" ? "nav-active" : ""} href="/admin/hero">▣ <span>Hero da Home</span></Link>
          <small>COMERCIAL</small>
          <Link className={active === "leads" ? "nav-active" : ""} href="/admin/leads">● <span>Leads</span></Link>
          <small>PRÓXIMAS ETAPAS</small>
          <div className="nav-soon"><span>Loja completa</span><b>Em breve</b></div>
          <div className="nav-muted"><span>Atendimentos</span></div>
        </nav>
        <div className="side-message"><strong>Regtech Motors</strong><br />Gestão do catálogo e atendimento.</div>
      </aside>

      <main className="admin-main">
        <header className="admin-top">
          <div className="mobile-brand">REGTECH <span>MOTORS</span></div>
          <div className="admin-context">Painel administrativo</div>
          <div className="admin-user">
            <i>{initial}</i>
            <span><strong>Admin Regtech</strong><small>Administrador</small></span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
