"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, Target, Award } from "lucide-react";

type Lead = {
  id: string;
  canal?: string;
  como_encontrou?: string;
  etapa: string;
  valor_estimado?: number;
  criado_em: string;
};

const CANAL_LABELS: Record<string, string> = {
  indicacao: "Indicação",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  organico: "Orgânico",
  evento: "Evento / Palestra",
  google: "Google Ads",
  whatsapp_ativo: "WhatsApp Ativo",
  email_frio: "E-mail Frio",
  outro: "Outro",
};

const CANAL_CORES: Record<string, string> = {
  indicacao: "#0D2B2E",
  linkedin: "#0A66C2",
  instagram: "#E1306C",
  organico: "#2D6A4F",
  evento: "#C9A84C",
  google: "#4285F4",
  whatsapp_ativo: "#25D366",
  email_frio: "#6B7280",
  outro: "#9CA3AF",
};

const ETAPAS_ORDEM = ["novo", "contato", "diagnostico", "proposta", "negociacao", "fechado", "perdido"];
const ETAPAS_LABELS: Record<string, string> = {
  novo: "Novo",
  contato: "Contato",
  diagnostico: "Diagnóstico",
  proposta: "Proposta",
  negociacao: "Negociação",
  fechado: "Fechado",
  perdido: "Perdido",
};

type CanalStats = {
  canal: string;
  label: string;
  cor: string;
  total: number;
  fechados: number;
  perdidos: number;
  em_andamento: number;
  valor_estimado: number;
  valor_fechado: number;
  taxa_conversao: number;
  por_etapa: Record<string, number>;
};

function calcularStats(leads: Lead[]): CanalStats[] {
  const mapa: Record<string, Lead[]> = {};

  for (const lead of leads) {
    const canal = lead.canal || lead.como_encontrou?.toLowerCase().replace(/\s+/g, "_") || "outro";
    const key = CANAL_LABELS[canal] ? canal : "outro";
    if (!mapa[key]) mapa[key] = [];
    mapa[key].push(lead);
  }

  return Object.entries(mapa)
    .map(([canal, ls]) => {
      const fechados = ls.filter((l) => l.etapa === "fechado").length;
      const perdidos = ls.filter((l) => l.etapa === "perdido").length;
      const em_andamento = ls.length - fechados - perdidos;
      const valor_estimado = ls.reduce((s, l) => s + (l.valor_estimado ?? 0), 0);
      const valor_fechado = ls.filter((l) => l.etapa === "fechado").reduce((s, l) => s + (l.valor_estimado ?? 0), 0);
      const por_etapa = Object.fromEntries(
        ETAPAS_ORDEM.map((e) => [e, ls.filter((l) => l.etapa === e).length])
      );
      return {
        canal,
        label: CANAL_LABELS[canal] ?? canal,
        cor: CANAL_CORES[canal] ?? "#9CA3AF",
        total: ls.length,
        fechados,
        perdidos,
        em_andamento,
        valor_estimado,
        valor_fechado,
        taxa_conversao: ls.length > 0 ? Math.round((fechados / ls.length) * 100) : 0,
        por_etapa,
      };
    })
    .sort((a, b) => b.total - a.total);
}

function mesesAnteriores(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (n - 1 - i));
    return d.toISOString().slice(0, 7);
  });
}

export default function OrigensPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [periodo, setPeriodo] = useState<"30" | "90" | "365" | "tudo">("90");

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data } = await supabase
      .from("leads")
      .select("id, canal, como_encontrou, etapa, valor_estimado, criado_em")
      .order("criado_em", { ascending: false });
    if (data) setLeads(data as Lead[]);
  }

  // Filtrar por período
  const leadsFiltrados = leads.filter((l) => {
    if (periodo === "tudo") return true;
    const dias = parseInt(periodo);
    const corte = new Date(Date.now() - dias * 86400000).toISOString();
    return l.criado_em >= corte;
  });

  const stats = calcularStats(leadsFiltrados);
  const totalLeads = leadsFiltrados.length;
  const totalFechados = leadsFiltrados.filter((l) => l.etapa === "fechado").length;
  const taxaGeral = totalLeads > 0 ? Math.round((totalFechados / totalLeads) * 100) : 0;
  const melhorCanal = stats.length > 0 ? stats.reduce((a, b) => (a.taxa_conversao > b.taxa_conversao ? a : b)) : null;
  const maiorVolume = stats.length > 0 ? stats[0] : null;

  // Histórico mensal por canal (últimos 6 meses)
  const meses6 = mesesAnteriores(6);
  const canaisPrincipais = stats.slice(0, 4).map((s) => s.canal);
  const historico = meses6.map((mes) => {
    const leadsDoMes = leads.filter((l) => l.criado_em.startsWith(mes));
    const porCanal = Object.fromEntries(
      canaisPrincipais.map((c) => [
        c,
        leadsDoMes.filter((l) => (l.canal || "outro") === c).length,
      ])
    );
    return {
      mes: new Date(mes + "-01").toLocaleDateString("pt-BR", { month: "short" }),
      total: leadsDoMes.length,
      porCanal,
    };
  });
  const maxHistorico = Math.max(...historico.map((h) => h.total), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">Origens & Canais</h1>
          <p className="text-text-muted mt-1">De onde vêm seus leads e qual canal converte mais</p>
        </div>
        <div className="flex rounded-btn border border-[#E8D5A3]/50 overflow-hidden text-xs">
          {(["30", "90", "365", "tudo"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 transition-all ${periodo === p ? "bg-primary text-gold" : "bg-surface text-text-muted hover:text-text-main"}`}
            >
              {p === "30" ? "30 dias" : p === "90" ? "90 dias" : p === "365" ? "1 ano" : "Tudo"}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-primary/10 flex items-center justify-center">
              <Users size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-main">{totalLeads}</p>
              <p className="text-xs text-text-muted">Total de leads</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-green-50 flex items-center justify-center">
              <Target size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{taxaGeral}%</p>
              <p className="text-xs text-text-muted">Taxa de conversão</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-gold/10 flex items-center justify-center">
              <Award size={18} className="text-gold" />
            </div>
            <div>
              <p className="text-lg font-bold text-text-main leading-tight">{melhorCanal?.label ?? "—"}</p>
              <p className="text-xs text-text-muted">Melhor conversão ({melhorCanal?.taxa_conversao ?? 0}%)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-primary/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-text-main leading-tight">{maiorVolume?.label ?? "—"}</p>
              <p className="text-xs text-text-muted">Maior volume ({maiorVolume?.total ?? 0} leads)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Volume por canal */}
        <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-5">
          <h3 className="font-display text-base font-semibold text-text-main mb-4">Volume por canal</h3>
          {stats.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-8">Nenhum lead no período.</p>
          ) : (
            <div className="space-y-3">
              {stats.map((s) => {
                const pct = totalLeads > 0 ? (s.total / totalLeads) * 100 : 0;
                return (
                  <div key={s.canal}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.cor }} />
                        <span className="text-sm text-text-main">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-text-muted">{s.total} leads</span>
                        <span className="font-semibold" style={{ color: s.taxa_conversao >= 20 ? "#16A34A" : s.taxa_conversao >= 10 ? "#D97706" : "#6B7280" }}>
                          {s.taxa_conversao}% conv.
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-[#E8D5A3]/30 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: s.cor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Histórico mensal */}
        <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-5">
          <h3 className="font-display text-base font-semibold text-text-main mb-4">Leads por mês — últimos 6 meses</h3>
          <div className="flex items-end gap-2 h-36 mb-2">
            {historico.map((h) => {
              const pct = (h.total / maxHistorico) * 100;
              return (
                <div key={h.mes} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-text-muted">{h.total > 0 ? h.total : ""}</span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t bg-gold/70 transition-all"
                      style={{ height: pct > 0 ? `${Math.max(pct, 4)}%` : "2px", minHeight: "2px" }}
                    />
                  </div>
                  <span className="text-[9px] text-text-muted">{h.mes}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabela detalhada por canal */}
      <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-5">
        <h3 className="font-display text-base font-semibold text-text-main mb-4">Funil por canal</h3>
        {stats.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">Cadastre leads com canal de origem para ver o funil.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8D5A3]/50">
                  <th className="text-left py-2 pr-4 text-xs text-text-muted font-medium">Canal</th>
                  <th className="text-center py-2 px-2 text-xs text-text-muted font-medium">Total</th>
                  {ETAPAS_ORDEM.slice(0, 5).map((e) => (
                    <th key={e} className="text-center py-2 px-2 text-xs text-text-muted font-medium">{ETAPAS_LABELS[e]}</th>
                  ))}
                  <th className="text-center py-2 px-2 text-xs text-text-muted font-medium">Fechado</th>
                  <th className="text-center py-2 px-2 text-xs text-text-muted font-medium">Conv.%</th>
                  <th className="text-right py-2 pl-4 text-xs text-text-muted font-medium">Valor fechado</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.canal} className="border-b border-[#E8D5A3]/20 hover:bg-bg/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.cor }} />
                        <span className="font-medium text-text-main whitespace-nowrap">{s.label}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2 font-semibold text-text-main">{s.total}</td>
                    {ETAPAS_ORDEM.slice(0, 5).map((e) => (
                      <td key={e} className="text-center py-3 px-2 text-text-muted">
                        {s.por_etapa[e] || "—"}
                      </td>
                    ))}
                    <td className="text-center py-3 px-2 font-semibold text-green-600">{s.fechados || "—"}</td>
                    <td className="text-center py-3 px-2">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: s.taxa_conversao >= 20 ? "#DCFCE7" : s.taxa_conversao >= 10 ? "#FEF9C3" : "#F3F4F6",
                          color: s.taxa_conversao >= 20 ? "#16A34A" : s.taxa_conversao >= 10 ? "#D97706" : "#6B7280",
                        }}
                      >
                        {s.taxa_conversao}%
                      </span>
                    </td>
                    <td className="text-right py-3 pl-4 font-mono-data text-sm text-text-main">
                      {s.valor_fechado > 0
                        ? s.valor_fechado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#E8D5A3]/50">
                  <td className="py-3 pr-4 font-bold text-text-main text-xs">Total</td>
                  <td className="text-center py-3 px-2 font-bold text-text-main">{totalLeads}</td>
                  {ETAPAS_ORDEM.slice(0, 5).map((e) => (
                    <td key={e} className="text-center py-3 px-2 font-semibold text-text-muted text-xs">
                      {leadsFiltrados.filter((l) => l.etapa === e).length || "—"}
                    </td>
                  ))}
                  <td className="text-center py-3 px-2 font-bold text-green-600">{totalFechados || "—"}</td>
                  <td className="text-center py-3 px-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {taxaGeral}%
                    </span>
                  </td>
                  <td className="text-right py-3 pl-4 font-mono-data text-sm font-bold text-text-main">
                    {leadsFiltrados
                      .filter((l) => l.etapa === "fechado")
                      .reduce((s, l) => s + (l.valor_estimado ?? 0), 0)
                      .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
