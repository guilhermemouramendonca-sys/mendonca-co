"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  BookOpen,
  Settings,
  LogOut,
  UserCheck,
  ClipboardList,
  BarChart2,
  Users,
  Radar,
  LayoutTemplate,
  Layers,
  ListChecks,
  LineChart,
  UsersRound,
  Megaphone,
  FileBadge,
  HeartPulse,
  RadioTower,
  GraduationCap,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "CRM / Leads", icon: TrendingUp },
  { href: "/clientes", label: "Clientes", icon: UserCheck },
  { href: "/diagnosticos", label: "Diagnóstico 3D", icon: ClipboardList },
  { href: "/radar360", label: "Radar 360", icon: Radar },
  { href: "/pesquisas", label: "Pesquisas", icon: BarChart2 },
  { href: "/rodadas", label: "Rodadas", icon: Layers },
  { href: "/plano-acao", label: "Plano de Ação", icon: ListChecks },
  { href: "/canvas", label: "Canvas Estratégico", icon: LayoutTemplate },
  { href: "/benchmarks", label: "Benchmarks", icon: LineChart },
  { href: "/sdr", label: "SDR / Prospecção", icon: Megaphone },
  { href: "/propostas", label: "Propostas", icon: FileBadge },
  { href: "/cs", label: "CS / Sucesso", icon: HeartPulse },
  { href: "/marketing", label: "Marketing & Growth", icon: Sprout },
  { href: "/origens", label: "Origens & Canais", icon: RadioTower },
  { href: "/turmas", label: "Turmas & Educação", icon: GraduationCap },
  { href: "/equipe", label: "Equipe", icon: UsersRound },
  { href: "/rh", label: "RH do Cliente", icon: Users },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/conhecimento", label: "Conhecimento", icon: BookOpen },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

const BADGE_HREFS = ["/diagnosticos", "/radar360", "/pesquisas", "/canvas"];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    async function carregarBadges() {
      const sete = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [diag, r360, pesq, canvas] = await Promise.all([
        supabase.from("diagnosticos").select("id", { count: "exact", head: true }).gte("criado_em", sete).not("resultado", "is", null),
        supabase.from("radar360").select("id", { count: "exact", head: true }).gte("criado_em", sete).not("resultado", "is", null),
        supabase.from("pesquisas").select("id", { count: "exact", head: true }).gte("criado_em", sete).not("resultado", "is", null),
        supabase.from("canvas_estrategico").select("id", { count: "exact", head: true }).gte("criado_em", sete).not("resultado", "is", null),
      ]);
      setBadges({
        "/diagnosticos": diag.count ?? 0,
        "/radar360": r360.count ?? 0,
        "/pesquisas": pesq.count ?? 0,
        "/canvas": canvas.count ?? 0,
      });
    }
    carregarBadges();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-primary flex flex-col z-40">
      <div className="px-6 py-8 border-b border-gold/20">
        <h1 className="font-display text-2xl font-bold text-gold leading-tight">
          Mendonça & Co
        </h1>
        <p className="text-gold-light text-xs mt-1 opacity-70">Sistema de Gestão</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const badge = BADGE_HREFS.includes(item.href) ? (badges[item.href] ?? 0) : 0;
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
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="text-[10px] font-bold bg-gold text-primary rounded-full w-5 h-5 flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gold/20">
        <button
          onClick={sair}
          className="flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm text-gold/70 hover:text-gold hover:bg-gold/10 transition-colors w-full"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
