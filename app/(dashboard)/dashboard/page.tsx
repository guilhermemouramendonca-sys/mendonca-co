"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp, Users, DollarSign, AlertCircle, Clock,
  ClipboardList, BarChart2, FileText, ListChecks, ChevronRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

type Etapa = "novo" | "contato" | "diagnostico" | "proposta" | "negociacao" | "fechado" | "perdido";

const ETAPA_LABEL: Record<Etapa, string> = {
  novo: "Novo", contato: "Contato", diagnostico: "Diagnóstico",
  proposta: "Proposta", negociacao: "Negociação", fechado: "Fechado", perdido: "Perdido",
};
const ETAPA_COR: Record<Etapa, string> = {
  novo: "#6B6B6B", contato: "#2980B9", diagnostico: "#8E44AD",
  proposta: "#C9A84C", negociacao: "#E67E22", fechado: "#27AE60", perdido: "#C0392B",
};
const FUNIL_ETAPAS: Etapa[] = ["novo", "contato", "diagnostico", "proposta", "negociacao", "fechado"];

type StatusPlano = "pendente" | "em_andamento" | "concluido";

type Dados = {
  // KPIs
  leadsNovos24h: number;
  totalLeads: number;
  clientesAtivos: number;
  mrr: number;
  cobrancasVencendo7d: { id: string; cliente_nome: string; valor: number; vencimento: string }[];
  cobrancasAtrasadas: number;
  // Ferramentas do mês
  ferramentasMes: { label: string; total: number; cor: string; href: string }[];
  totalDiagnosticosMes: number;
  // Funil de leads
  funnelCounts: Record<Etapa, number>;
  taxaConversao: number; // novo → fechado
  // Plano de ação
  planoTotal: number;
  planoPorStatus: Record<StatusPlano, number>;
  // Atividade recente
  ultimosLeads: { id: string; nome: string; empresa: string; tipo_servico: string; etapa: string; criado_em: string }[];
  cobrancasProximas: { id: string; cliente_nome: string; valor: number; vencimento: string }[];
};

export default function DashboardPage() {
  const supabase = createClient();
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [hora, setHora] = useState("");

  useEffect(() => {
    setHora(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    carregarDados();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarDados() {
    setCarregando(true);
    const agora = new Date();
    const ontemISO = new Date(agora.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const em7dias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const hoje = agora.toISOString().split("T")[0];
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();

    const [
      leadsRes, clientesRes, contratosRes, cobrancasRes,
      pesquisasRes, diagnosticosRes, radar360Res, canvasRes, rodadasRes,
      planosRes,
    ] = await Promise.all([
      supabase.from("leads").select("id, nome, empresa, tipo_servico, etapa, criado_em").order("criado_em", { ascending: false }),
      supabase.from("clientes").select("id, status"),
      supabase.from("contratos").select("tipo, valor_mensal, status"),
      supabase.from("cobrancas").select("id, cliente_id, valor, vencimento, status, clientes(nome)"),
      supabase.from("pesquisas").select("id, tipo, concluido_em").not("concluido_em", "is", null).gte("concluido_em", inicioMes),
      supabase.from("diagnosticos").select("id, criado_em").gte("criado_em", inicioMes),
      supabase.from("radar360").select("id, criado_em").gte("criado_em", inicioMes),
      supabase.from("canvas_estrategico").select("id, concluido_em").not("concluido_em", "is", null).gte("concluido_em", inicioMes),
      supabase.from("rodadas").select("id, tipo, criado_em").gte("criado_em", inicioMes),
      supabase.from("itens_plano_acao").select("id, status"),
    ]);

    const leads = leadsRes.data ?? [];
    const leadsNovos24h = leads.filter((l) => l.criado_em >= ontemISO).length;
    const clientesAtivos = (clientesRes.data ?? []).filter((c) => c.status === "ativo").length;
    const mrr = (contratosRes.data ?? [])
      .filter((c) => c.tipo === "retainer" && c.status === "ativo")
      .reduce((s, c) => s + (c.valor_mensal ?? 0), 0);

    const todasCobrancas = cobrancasRes.data ?? [];
    const cobrancasVencendo7d = todasCobrancas
      .filter((c) => c.status === "pendente" && c.vencimento >= hoje && c.vencimento <= em7dias)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c) => ({ id: c.id, valor: c.valor, vencimento: c.vencimento, cliente_nome: (c.clientes as any)?.nome ?? "—" }))
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
    const cobrancasAtrasadas = todasCobrancas.filter((c) => c.status === "pendente" && c.vencimento < hoje).length;

    // Ferramentas do mês
    const pesquisas = pesquisasRes.data ?? [];
    const q12Mes = pesquisas.filter((p) => p.tipo === "q12").length;
    const gptwMes = pesquisas.filter((p) => p.tipo === "gptw").length;
    const discMes = pesquisas.filter((p) => p.tipo === "disc").length;
    const diag3dMes = (diagnosticosRes.data ?? []).length;
    const radar360Mes = (radar360Res.data ?? []).length;
    const canvasMes = (canvasRes.data ?? []).length;
    const rodadasMes = (rodadasRes.data ?? []).length;
    const totalDiagnosticosMes = diag3dMes + radar360Mes + q12Mes + gptwMes + discMes + canvasMes + rodadasMes;

    const ferramentasMes = [
      { label: "Diagnóstico 3D", total: diag3dMes, cor: "#2980B9", href: "/diagnosticos" },
      { label: "Radar 360", total: radar360Mes, cor: "#8E44AD", href: "/radar360" },
      { label: "Q12", total: q12Mes, cor: "#27AE60", href: "/pesquisas" },
      { label: "GPTW", total: gptwMes, cor: "#C9A84C", href: "/pesquisas" },
      { label: "DISC", total: discMes, cor: "#E67E22", href: "/pesquisas" },
      { label: "Canvas", total: canvasMes, cor: "#0D2B2E", href: "/canvas" },
      { label: "Rodadas", total: rodadasMes, cor: "#C0392B", href: "/rodadas" },
    ].filter((f) => f.total > 0);

    // Funil
    const funnelCounts = {} as Record<Etapa, number>;
    for (const etapa of FUNIL_ETAPAS) {
      funnelCounts[etapa] = leads.filter((l) => l.etapa === etapa).length;
    }
    funnelCounts["perdido"] = leads.filter((l) => l.etapa === "perdido").length;
    const taxaConversao = leads.length > 0
      ? Math.round((funnelCounts["fechado"] / leads.length) * 100)
      : 0;

    // Plano de ação
    const itens = planosRes.data ?? [];
    const planoPorStatus: Record<StatusPlano, number> = {
      pendente: itens.filter((i) => i.status === "pendente").length,
      em_andamento: itens.filter((i) => i.status === "em_andamento").length,
      concluido: itens.filter((i) => i.status === "concluido").length,
    };

    setDados({
      leadsNovos24h, totalLeads: leads.length,
      clientesAtivos, mrr,
      cobrancasVencendo7d, cobrancasAtrasadas,
      ferramentasMes, totalDiagnosticosMes,
      funnelCounts, taxaConversao,
      planoTotal: itens.length,
      planoPorStatus,
      ultimosLeads: leads.slice(0, 5),
      cobrancasProximas: cobrancasVencendo7d,
    });
    setCarregando(false);
  }

  const saudacao = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-muted text-sm">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const d = dados!;
  const mesLabel = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const maxFunil = Math.max(...FUNIL_ETAPAS.map((e) => d.funnelCounts[e]), 1);
  const pctPlano = d.planoTotal > 0
    ? Math.round((d.planoPorStatus.concluido / d.planoTotal) * 100)
    : 0;

  const kpis = [
    {
      label: "Leads novos (24h)", value: d.leadsNovos24h, icon: TrendingUp,
      cor: "#C9A84C", href: "/leads", sub: `${d.totalLeads} no pipeline total`,
    },
    {
      label: "Clientes ativos", value: d.clientesAtivos, icon: Users,
      cor: "#27AE60", href: "/clientes", sub: "com contrato ativo",
    },
    {
      label: "MRR", value: formatCurrency(d.mrr), icon: DollarSign,
      cor: "#0D2B2E", href: "/financeiro",
      sub: `ARR ${formatCurrency(d.mrr * 12)}`, grande: true,
    },
    {
      label: "Diagnósticos no mês", value: d.totalDiagnosticosMes, icon: FileText,
      cor: "#2980B9", href: "/pesquisas", sub: mesLabel,
    },
    {
      label: "Taxa de conversão", value: `${d.taxaConversao}%`, icon: BarChart2,
      cor: d.taxaConversao >= 20 ? "#27AE60" : "#C9A84C", href: "/leads",
      sub: "leads → fechados",
    },
    {
      label: "Cobranças vencendo", value: d.cobrancasVencendo7d.length, icon: AlertCircle,
      cor: d.cobrancasAtrasadas > 0 ? "#C0392B" : "#C9A84C", href: "/financeiro",
      sub: d.cobrancasAtrasadas > 0 ? `${d.cobrancasAtrasadas} em atraso` : "nenhuma em atraso",
      alerta: d.cobrancasAtrasadas > 0,
    },
    {
      label: "Plano de ação", value: `${pctPlano}%`, icon: ListChecks,
      cor: pctPlano >= 70 ? "#27AE60" : pctPlano >= 40 ? "#C9A84C" : "#C0392B",
      href: "/plano-acao", sub: `${d.planoPorStatus.concluido}/${d.planoTotal} ações concluídas`,
    },
    {
      label: "Pesquisas pendentes", value: 0, icon: ClipboardList,
      cor: "#8E44AD", href: "/pesquisas", sub: "aguardando resposta",
      // recalculated below
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-text-main">
          {saudacao()}, Guiga
        </h1>
        <p className="text-text-muted mt-1">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          {hora && ` · ${hora}`}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.slice(0, 7).map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link key={kpi.label} href={kpi.href}>
              <Card className={`hover:border-gold/40 hover:shadow-sm transition-all cursor-pointer h-full ${kpi.alerta ? "border-danger/30" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-btn flex items-center justify-center" style={{ backgroundColor: kpi.cor + "18" }}>
                      <Icon size={18} style={{ color: kpi.cor }} />
                    </div>
                    {kpi.alerta && <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />}
                  </div>
                  <p className={`font-mono-data font-bold text-text-main ${kpi.grande ? "text-xl" : "text-3xl"}`}>{kpi.value}</p>
                  <p className="text-xs text-text-muted mt-1">{kpi.label}</p>
                  <p className="text-[10px] mt-1" style={{ color: kpi.cor }}>{kpi.sub}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Linha 2: Funil + Ferramentas do mês */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Funil de conversão */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Funil de conversão</CardTitle>
            <Link href="/leads" className="text-xs text-gold hover:underline">Ver CRM →</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {FUNIL_ETAPAS.map((etapa) => {
                const count = d.funnelCounts[etapa];
                const pct = Math.round((count / maxFunil) * 100);
                return (
                  <div key={etapa} className="flex items-center gap-3">
                    <span className="text-xs text-text-muted w-24 shrink-0">{ETAPA_LABEL[etapa]}</span>
                    <div className="flex-1 bg-[#E8D5A3]/20 rounded-full h-5 relative overflow-hidden">
                      <div
                        className="h-5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: ETAPA_COR[etapa] + "CC" }}
                      />
                    </div>
                    <span className="font-mono-data text-sm font-bold text-text-main w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-[#E8D5A3]/30 flex items-center justify-between">
              <span className="text-xs text-text-muted">Taxa de conversão geral</span>
              <span className="font-mono-data text-lg font-bold" style={{ color: d.taxaConversao >= 20 ? "#27AE60" : "#C9A84C" }}>
                {d.taxaConversao}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Ferramentas do mês */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ferramentas — {mesLabel}</CardTitle>
            <span className="font-mono-data text-lg font-bold text-text-main">{d.totalDiagnosticosMes}</span>
          </CardHeader>
          <CardContent>
            {d.ferramentasMes.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">Nenhum diagnóstico realizado este mês.</p>
            ) : (
              <div className="space-y-3">
                {d.ferramentasMes.map((f) => {
                  const pct = Math.round((f.total / d.totalDiagnosticosMes) * 100);
                  return (
                    <Link key={f.label} href={f.href} className="flex items-center gap-3 group">
                      <span className="text-xs text-text-muted w-24 shrink-0 group-hover:text-text-main transition-colors">{f.label}</span>
                      <div className="flex-1 bg-[#E8D5A3]/20 rounded-full h-4 relative overflow-hidden">
                        <div
                          className="h-4 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: f.cor + "CC" }}
                        />
                      </div>
                      <span className="font-mono-data text-sm font-bold text-text-main w-6 text-right">{f.total}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linha 3: Plano de ação + Leads recentes + Cobranças */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Plano de ação */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Plano de ação</CardTitle>
            <Link href="/plano-acao" className="text-xs text-gold hover:underline">Ver →</Link>
          </CardHeader>
          <CardContent>
            {d.planoTotal === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">Nenhum plano criado ainda.</p>
            ) : (
              <>
                {/* Progresso geral */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs text-text-muted mb-1.5">
                    <span>Progresso geral</span>
                    <span className="font-mono-data font-bold">{pctPlano}%</span>
                  </div>
                  <div className="h-3 bg-[#E8D5A3]/30 rounded-full overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-700"
                      style={{
                        width: `${pctPlano}%`,
                        backgroundColor: pctPlano >= 70 ? "#27AE60" : pctPlano >= 40 ? "#C9A84C" : "#C0392B",
                      }}
                    />
                  </div>
                </div>

                {/* Por status */}
                {(["pendente", "em_andamento", "concluido"] as StatusPlano[]).map((s) => {
                  const count = d.planoPorStatus[s];
                  const pct2 = Math.round((count / d.planoTotal) * 100);
                  const cor = s === "concluido" ? "#27AE60" : s === "em_andamento" ? "#C9A84C" : "#6B6B6B";
                  const label = s === "concluido" ? "Concluídas" : s === "em_andamento" ? "Em andamento" : "Pendentes";
                  return (
                    <div key={s} className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cor }} />
                      <span className="text-xs text-text-muted flex-1">{label}</span>
                      <span className="font-mono-data text-xs font-bold text-text-main">{count}</span>
                      <span className="text-[10px] text-text-muted/60 w-8 text-right">{pct2}%</span>
                    </div>
                  );
                })}

                <Link href="/plano-acao" className="mt-4 flex items-center gap-1 text-xs text-gold hover:underline">
                  Ver todos os planos <ChevronRight size={12} />
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Leads recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Leads recentes</CardTitle>
            <Link href="/leads" className="text-xs text-gold hover:underline">Ver todos →</Link>
          </CardHeader>
          <CardContent>
            {d.ultimosLeads.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">Nenhum lead ainda.</p>
            ) : (
              <div className="space-y-3">
                {d.ultimosLeads.map((lead) => (
                  <div key={lead.id} className="flex items-start justify-between py-1.5 border-b border-[#E8D5A3]/30 last:border-0">
                    <div className="min-w-0 mr-2">
                      <p className="text-sm font-medium text-text-main truncate">{lead.nome}</p>
                      <p className="text-[10px] text-text-muted truncate">{lead.empresa}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: ETAPA_COR[lead.etapa as Etapa] + "20",
                          color: ETAPA_COR[lead.etapa as Etapa],
                        }}
                      >
                        {ETAPA_LABEL[lead.etapa as Etapa] ?? lead.etapa}
                      </span>
                      <p className="text-[10px] text-text-muted mt-1">{formatDate(lead.criado_em)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cobranças */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Cobranças (7 dias)</CardTitle>
            <Link href="/financeiro" className="text-xs text-gold hover:underline">Ver →</Link>
          </CardHeader>
          <CardContent>
            {d.cobrancasProximas.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">Nenhuma vencendo em breve.</p>
            ) : (
              <div className="space-y-3">
                {d.cobrancasProximas.slice(0, 5).map((c) => {
                  const dias = Math.ceil((new Date(c.vencimento).getTime() - Date.now()) / 86400000);
                  const atrasada = dias < 0;
                  return (
                    <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-[#E8D5A3]/30 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-text-main">{c.cliente_nome}</p>
                        <p className="text-[10px] flex items-center gap-1" style={{ color: atrasada ? "#C0392B" : "#6B6B6B" }}>
                          <Clock size={9} />
                          {atrasada ? `${Math.abs(dias)}d em atraso` : dias === 0 ? "Hoje" : `${dias}d`}
                        </p>
                      </div>
                      <span className="font-mono-data text-sm font-semibold text-text-main">{formatCurrency(c.valor)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
