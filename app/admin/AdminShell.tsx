"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {DashboardIcon,BikeIcon,ImageIcon,UsersIcon,StoreIcon,HeadsetIcon,SettingsIcon} from "./icons";

type AdminSection = "dashboard" | "products" | "leads" | "hero" | "store" | "social-proof";

const NavContent = ({ active, close }: { active: AdminSection; close?: () => void }) => (
  <nav>
    <Link onClick={close} className={active === "dashboard" ? "nav-active" : ""} href="/admin"><span className="nav-icon"><DashboardIcon /></span><span>Dashboard</span></Link>
    <small>CATÁLOGO</small>
    <Link onClick={close} className={active === "products" ? "nav-active" : ""} href="/admin/products"><span className="nav-icon"><BikeIcon /></span><span>Motos</span></Link>
    <Link onClick={close} className={active === "hero" ? "nav-active" : ""} href="/admin/hero"><span className="nav-icon"><ImageIcon /></span><span>Hero da Home</span></Link>
    <Link onClick={close} className={active === "social-proof" ? "nav-active" : ""} href="/admin/social-proof"><span className="nav-icon"><UsersIcon /></span><span>Prova social</span></Link>
    <small>COMERCIAL</small>
    <Link onClick={close} className={active === "leads" ? "nav-active" : ""} href="/admin/leads"><span className="nav-icon"><UsersIcon /></span><span>Leads</span></Link>
    <small>LOJA</small>
    <Link onClick={close} className={active === "store" ? "nav-active" : ""} href="/admin/store"><span className="nav-icon"><StoreIcon /></span><span>Loja completa</span></Link>
    <small>SISTEMA</small>
    <div className="nav-muted"><span className="nav-icon"><HeadsetIcon /></span><span>Atendimentos</span></div>
    <div className="nav-muted"><span className="nav-icon"><SettingsIcon /></span><span>Configurações</span></div>
  </nav>
);

export function AdminShell({ active, email, children }: { active: AdminSection; email?: string; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = (email ?? "A").slice(0, 1).toUpperCase();

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-logo">REGTECH <span>MOTORS</span></div>
        <NavContent active={active} />
        <div className="side-message"><strong>Regtech Motors</strong><br />Gestão do catálogo e atendimento.</div>
      </aside>

      <div className={`mobile-drawer ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <button className="drawer-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />
        <aside className="drawer-panel">
          <div className="drawer-head">
            <div className="admin-logo">REGTECH <span>MOTORS</span></div>
            <button className="drawer-close" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}>×</button>
          </div>
          <NavContent active={active} close={() => setMenuOpen(false)} />
          <div className="side-message"><strong>Regtech Motors</strong><br />Gestão do catálogo e atendimento.</div>
        </aside>
      </div>

      <main className="admin-main">
        <header className="admin-top">
          <button className="mobile-menu-button" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <span></span><span></span><span></span>
          </button>
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
