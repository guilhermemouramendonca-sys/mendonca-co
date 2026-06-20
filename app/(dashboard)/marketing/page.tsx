"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp, Users, Target, Link2, BarChart2 } from "lucide-react";
import { GerarUTM } from "@/components/kanban/gerar-utm";
import { Button } from "@/components/ui/button";

type Lead = {
  id: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  canal?: string;
  etapa: string;
  valor_estimado?: number;
  valor_fechado?: number;
  criado_em: string;
};

const FONTE_LABELS: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  substack: "Substack",
  whatsapp: "WhatsApp",
  indicacao: "Indicação",
  google: "Google Ads",
  organico: "Orgânico",
  outro: "Outro",
};

const FONTE_CORES: Record<string, string> = {
  youtube: "#FF0000",
  instagram: "#E1306C",
  linkedin: "#0A66C2",
  substack: "#FF6719",
  whatsapp: "#25D366",
  indicacao: "#0D2B2E",
  google: "#4285F4",
  organico: "#2D6A4F",
  outro: "#9CA3AF",
};

function mesesAnteriores(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (n - 1 - i));
    return d.toISOString().slice(0, 7);
  });
}

export default function MarketingPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showUTM, setShowUTM] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"fontes" | "campanhas" | "conteudo">("fontes");
  const [periodo, setPeriodo] = useState<"30" | "90" | "365" | "tudo">("90");

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from("leads")
      .select("id, utm_source, utm_medium, utm_campaign, utm_content, canal, etapa, valor_estimado, valor_fechado, criado_em")
      .order("criado_em", { ascending: false });
    if (data) setLeads(data as Lead[]);
  }, [supabase]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregar(); }, []);

  const leadsFiltrados = leads.filter((l) => {
    if (periodo === "tudo") return true;
    const corte = new Date(Date.now() - parseInt(periodo) * 86400000).toISOString();
    return l.criado_em >= corte;
  });

  const leadsComUTM = leadsFiltrados.filter((l) => l.utm_source);
  const leadsGanhos = leadsFiltrados.filter((l) => l.etapa === "ganho");

  // Agrupa por utm_source
  function agruparPor(key: keyof Lead) {
    const mapa: Record<string, Lead[]> = {};
    for (const l of leadsFiltrados) {
      const val = (l[key] as string) || "sem_utm";
      if (key === "utm_source" && !l.utm_source) continue;
      if (key === "utm_campaign" && !l.utm_campaign) continue;
      if (key === "utm_content" && !l.utm_content) continue;
      if (!mapa[val]) mapa[val] = [];
      mapa[val].push(l);
    }
    return Object.entries(mapa)
      .map(([val, ls]) => ({
        val,
        label: key === "utm_source" ? (FONTE_LABELS[val] ?? val) : val,
        cor: key === "utm_source" ? (FONTE_CORES[val] ?? "#9CA3AF") : "#C9A84C",
        total: ls.length,
        ganhos: ls.filter((l) => l.etapa === "ganho").length,
        valor: ls.reduce((s, l) => s + (l.valor_estimado ?? 0), 0),
        valorFechado: ls.filter((l) => l.etapa === "ganho").reduce((s, l) => s + (l.valor_fechado ?? l.valor_estimado ?? 0), 0),
        taxa: ls.length > 0 ? Math.round((ls.filter((l) => l.etapa === "ganho").length / ls.length) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }

  const porFonte = agruparPor("utm_source");
  const porCampanha = agruparPor("utm_campaign");
  const porConteudo = agruparPor("utm_content");

  const dados = abaAtiva === "fontes" ? porFonte : abaAtiva === "campanhas" ? porCampanha : porConteudo;
  const maxTotal = Math.max(...dados.map((d) => d.total), 1);

  // Histórico mensal por fonte
  const meses6 = mesesAnteriores(6);
  const fontesPrincipais = porFonte.slice(0, 4).map((f) => f.val);
  const historico = meses6.map((mes) => {
    const doMes = leadsComUTM.filter((l) => l.criado_em.startsWith(mes));
    return {
      mes: new Date(mes + "-01").toLocaleDateString("pt-BR", { month: "short" }),
      total: doMes.length,
      porFonte: Object.fromEntries(fontesPrincipais.map((f) => [f, doMes.filter((l) => l.utm_source === f).length])),
    };
  });
  const maxHist = Math.max(...historico.map((h) => h.total), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">Marketing & Growth</h1>
          <p className="text-text-muted mt-1">Rastreamento UTM, fontes, campanhas e conversões</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-btn border border-[#E8D5A3] overflow-hidden text-xs">
            {(["30", "90", "365", "tudo"] as const).map((p) => (
              <button key={p} onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 transition-all ${periodo === p ? "bg-primary text-gold" : "bg-surface text-text-muted hover:text-text-main"}`}>
                {p === "30" ? "30d" : p === "90" ? "90d" : p === "365" ? "1 ano" : "Tudo"}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowUTM(true)}>
            <Link2 size={16} /> Gerar Link UTM
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users, label: "Leads rastreados", value: leadsComUTM.length, sub: `de ${leadsFiltrados.length} total` },
          { icon: BarChart2, label: "Fontes ativas", value: porFonte.length, sub: "canais com UTM" },
          { icon: Target, label: "Conversão com UTM", value: `${leadsComUTM.length > 0 ? Math.round((leadsGanhos.filter(l => l.utm_source).length / leadsComUTM.length) * 100) : 0}%`, sub: "leads rastreados → ganhos" },
          { icon: TrendingUp, label: "Receita via UTM", value: `R$ ${leadsGanhos.filter(l => l.utm_source).reduce((s, l) => s + (l.valor_fechado ?? l.valor_estimado ?? 0), 0).toLocaleString("pt-BR")}`, sub: "negócios fechados rastreados" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-surface border border-[#E8D5A3]/50 rounded-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-primary/10 flex items-center justify-center flex-shrink-0">
              <kpi.icon size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-text-main font-mono-data">{kpi.value}</p>
              <p className="text-xs text-text-muted">{kpi.label}</p>
              <p className="text-[10px] text-text-muted/70">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Tabela principal */}
        <div className="col-span-2 bg-surface rounded-card border border-[#E8D5A3]/50 p-5">
          {/* Abas */}
          <div className="flex gap-1 mb-5 border-b border-[#E8D5A3]/50">
            {([
              { id: "fontes", label: "Fontes (utm_source)" },
              { id: "campanhas", label: "Campanhas (utm_campaign)" },
              { id: "conteudo", label: "Conteúdo (utm_content)" },
            ] as const).map((aba) => (
              <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
                className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${abaAtiva === aba.id ? "border-gold text-gold" : "border-transparent text-text-muted hover:text-text-main"}`}>
                {aba.label}
              </button>
            ))}
          </div>

          {dados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-muted text-sm">Nenhum lead rastreado com UTM no período.</p>
              <p className="text-text-muted/70 text-xs mt-1">Use o Gerador de Links UTM para criar links rastreados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dados.map((d) => (
                <div key={d.val}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.cor }} />
                      <span className="text-sm font-medium text-text-main">{d.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-text-muted">{d.total} leads</span>
                      <span className="font-semibold text-[#2D6A4F]">{d.ganhos} ganhos</span>
                      <span className={`font-bold ${d.taxa >= 20 ? "text-green-600" : d.taxa >= 10 ? "text-amber-600" : "text-text-muted"}`}>
                        {d.taxa}% conv.
                      </span>
                      {d.valorFechado > 0 && (
                        <span className="font-mono-data text-text-muted">R$ {d.valorFechado.toLocaleString("pt-BR")}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-[#E8D5A3]/30 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${(d.total / maxTotal) * 100}%`, backgroundColor: d.cor }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico mensal */}
        <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-5">
          <h3 className="font-display text-sm font-semibold text-text-main mb-4">Leads rastreados / mês</h3>
          <div className="flex items-end gap-1.5 h-36 mb-2">
            {historico.map((h) => {
              const pct = (h.total / maxHist) * 100;
              return (
                <div key={h.mes} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-text-muted">{h.total > 0 ? h.total : ""}</span>
                  <div className="w-full flex-1 flex flex-col items-center justify-end gap-0">
                    {fontesPrincipais.map((f) => {
                      const fPct = h.total > 0 ? (h.porFonte[f] ?? 0) / maxHist * 100 : 0;
                      return fPct > 0 ? (
                        <div key={f} className="w-full rounded-t transition-all"
                          style={{ height: `${Math.max(fPct, 2)}%`, backgroundColor: FONTE_CORES[f] ?? "#C9A84C", opacity: 0.8 }} />
                      ) : null;
                    })}
                    {pct === 0 && <div className="w-full h-0.5 bg-[#E8D5A3]/50 rounded" />}
                  </div>
                  <span className="text-[9px] text-text-muted">{h.mes}</span>
                </div>
              );
            })}
          </div>
          {/* Legenda */}
          <div className="space-y-1 mt-3">
            {fontesPrincipais.map((f) => (
              <div key={f} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FONTE_CORES[f] ?? "#C9A84C" }} />
                <span className="text-[10px] text-text-muted">{FONTE_LABELS[f] ?? f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aviso sem UTM */}
      {leadsComUTM.length === 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-card p-6 text-center">
          <p className="text-sm font-medium text-primary mb-1">Nenhum lead rastreado ainda</p>
          <p className="text-xs text-text-muted mb-4">
            Gere links UTM para seus formulários e compartilhe no YouTube, Instagram, LinkedIn e outros canais.
            Quando leads chegarem por esses links, a fonte aparecerá aqui automaticamente.
          </p>
          <Button onClick={() => setShowUTM(true)}>
            <Link2 size={16} /> Gerar primeiro link UTM
          </Button>
        </div>
      )}

      {showUTM && <GerarUTM onClose={() => setShowUTM(false)} />}
    </div>
  );
}
