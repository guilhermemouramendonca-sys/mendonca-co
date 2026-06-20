"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  BookOpen,
  Settings,
  LogOut,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "CRM / Leads", icon: TrendingUp },
  { href: "/clientes", label: "Clientes", icon: UserCheck },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/conhecimento", label: "Conhecimento", icon: BookOpen },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-primary flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-gold/20">
        <h1 className="font-display text-2xl font-bold text-gold leading-tight">
          Mendonça & Co
        </h1>
        <p className="text-gold-light text-xs mt-1 opacity-70">Sistema de Gestão</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors",
                isActive
                  ? "bg-gold text-primary"
                  : "text-gold/70 hover:text-gold hover:bg-gold/10"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="px-4 py-4 border-t border-gold/20">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm text-gold/70 hover:text-gold hover:bg-gold/10 transition-colors w-full">
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
