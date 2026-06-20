"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Target, MessageCircle, Mail, Phone, Linkedin,
  CheckCircle2, Clock, AlertCircle, Plus, ChevronRight,
  Flame, TrendingUp, X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

type Lead = {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  whatsapp?: string;
  etapa: string;
  canal?: string;
  proxima_acao?: string;
  data_proxima_acao?: string;
  criado_em: string;
  cadencia?: CadenciaItem[];
};

type CadenciaItem = {
  id: string;
  lead_id: string;
  dia: number;
  canal: string;
  status: string;
  feito_em?: string;
  nota?: string;
};

const CANAL_CONFIG: Record<string, { label: string; icon: React.ReactNode; cor: string }> = {
  linkedin:      { label: "LinkedIn",      icon: <Linkedin size={13} />,      cor: "#0A66C2" },
  whatsapp:      { label: "WhatsApp",      icon: <MessageCircle size={13} />, cor: "#25D366" },
  email:         { label: "E-mail",        icon: <Mail size={13} />,          cor: "#C9A84C" },
  ligacao:       { label: "Ligação",       icon: <Phone size={13} />,         cor: "#8E44AD" },
  whatsapp_ativo:{ label: "WhatsApp Ativo",icon: <MessageCircle size={13} />, cor: "#25D366" },
  email_frio:    { label: "E-mail Frio",   icon: <Mail size={13} />,          cor: "#E67E22" },
  indicacao:     { label: "Indicação",     icon: <TrendingUp size={13} />,    cor: "#27AE60" },
  evento:        { label: "Evento",        icon: <Target size={13} />,        cor: "#2980B9" },
  organico:      { label: "Orgânico",      icon: <TrendingUp size={13} />,    cor: "#27AE60" },
  instagram:     { label: "Instagram",     icon: <Flame size={13} />,         cor: "#E1306C" },
  google:        { label: "Google",        icon: <TrendingUp size={13} />,    cor: "#4285F4" },
  outro:         { label: "Outro",         icon: <ChevronRight size={13} />,  cor: "#6B6B6B" },
};

const DIAS_CADENCIA = [0, 3, 7];
const CANAIS_CADENCIA = ["whatsapp", "email", "ligacao", "linkedin"];

function semanaISO(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function diasDesde(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function proximoDiaCadencia(criado_em: string, cadencia: CadenciaItem[]): number | null {
  const feitos = new Set(cadencia.filter((c) => c.status === "feito").map((c) => c.dia));
  for (const dia of DIAS_CADENCIA) {
    if (!feitos.has(dia)) {
      const diaAlvo = new Date(criado_em);
      diaAlvo.setDate(diaAlvo.getDate() + dia);
      return dia;
    }
  }
  return null; // cadência completa
}

export default function SDRPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cadencias, setCadencias] = useState<Record<string, CadenciaItem[]>>({});
  const [meta, setMeta] = useState(10);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [novaMeta, setNovaMeta] = useState("10");
  const [acao, setAcao] = useState<{ leadId: string; dia: number } | null>(null);
  const [notaAcao, setNotaAcao] = useState("");
  const [canalAcao, setCanalAcao] = useState("whatsapp");

  const hoje = new Date().toISOString().split("T")[0];
  const semana = semanaISO();

  const carregar = useCallback(async () => {
    const inicioSemana = (() => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay() + 1);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    })();

    const [{ data: leadsData }, { data: cadData }, { data: metaData }] = await Promise.all([
      supabase.from("leads")
        .select("*")
        .in("etapa", ["novo", "contato", "diagnostico"])
        .order("criado_em", { ascending: false }),
      supabase.from("lead_cadencia").select("*"),
      supabase.from("sdr_metas").select("*").eq("semana_iso", semana).maybeSingle(),
    ]);

    if (leadsData) setLeads(leadsData as Lead[]);
    if (cadData) {
      const map: Record<string, CadenciaItem[]> = {};
      for (const c of cadData) {
        if (!map[c.lead_id]) map[c.lead_id] = [];
        map[c.lead_id].push(c as CadenciaItem);
      }
      setCadencias(map);
    }
    if (metaData) setMeta(metaData.meta_leads);
  }, [supabase, semana]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvarMeta() {
    await supabase.from("sdr_metas").upsert({ semana_iso: semana, meta_leads: parseInt(novaMeta) || 10 }, { onConflict: "semana_iso" });
    setMeta(parseInt(novaMeta) || 10);
    setEditandoMeta(false);
  }

  async function registrarAcao(leadId: string, dia: number, status: "feito" | "sem_resposta" | "pulado") {
    await supabase.from("lead_cadencia").upsert({
      lead_id: leadId,
      dia,
      canal: canalAcao,
      status,
      feito_em: status === "feito" ? new Date().toISOString() : null,
      nota: notaAcao || null,
    }, { onConflict: "lead_id,dia" });

    // Se feito, avançar etapa para "contato"
    if (status === "feito") {
      const lead = leads.find((l) => l.id === leadId);
      if (lead?.etapa === "novo") {
        await supabase.from("leads").update({ etapa: "contato", atualizado_em: new Date().toISOString() }).eq("id", leadId);
      }
      // Registrar interação no lead
      await supabase.from("interacoes").insert({
        lead_id: leadId,
        tipo: canalAcao,
        descricao: notaAcao || `Cadência D${dia} realizada`,
        data: new Date().toISOString().split("T")[0],
      });
    }

    setAcao(null);
    setNotaAcao("");
    setCanalAcao("whatsapp");
    await carregar();
  }

  // Métricas
  const inicioSemana = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  })();

  const leadsNaSemana = leads.filter((l) => l.criado_em >= inicioSemana).length;
  const pctMeta = Math.min(Math.round((leadsNaSemana / meta) * 100), 100);

  // Fila do dia: leads que precisam de ação hoje
  const filaDoDia = leads.filter((lead) => {
    const cad = cadencias[lead.id] ?? [];
    const proximoDia = proximoDiaCadencia(lead.criado_em, cad);
    if (proximoDia === null) return false;
    const diasLead = diasDesde(lead.criado_em);
    return diasLead >= proximoDia;
  }).sort((a, b) => diasDesde(b.criado_em) - diasDesde(a.criado_em)); // mais antigos primeiro

  // Agrupados por status de cadência
  const semContato = leads.filter((l) => !(cadencias[l.id]?.length > 0));
  const emCadencia = leads.filter((l) => {
    const cad = cadencias[l.id] ?? [];
    return cad.length > 0 && proximoDiaCadencia(l.criado_em, cad) !== null;
  });
  const cadenciaCompleta = leads.filter((l) => proximoDiaCadencia(l.criado_em, cadencias[l.id] ?? []) === null);

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">SDR — Prospecção</h1>
          <p className="text-text-muted mt-1">Fila de contatos do dia, cadência e meta semanal</p>
        </div>
        <Link href="/leads">
          <Button variant="secondary">Ver Kanban completo →</Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Meta semanal */}
        <Card className="col-span-2">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Meta semanal de prospecção</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono-data text-4xl font-bold text-text-main">{leadsNaSemana}</span>
                  <span className="text-text-muted text-sm">/ {meta} leads</span>
                </div>
              </div>
              {editandoMeta ? (
                <div className="flex gap-2 items-center">
                  <Input value={novaMeta} onChange={(e) => setNovaMeta(e.target.value)} className="w-16 text-center h-8" type="number" min={1} />
                  <Button size="sm" onClick={salvarMeta}>OK</Button>
                  <button onClick={() => setEditandoMeta(false)} className="text-text-muted hover:text-text-main"><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => { setEditandoMeta(true); setNovaMeta(String(meta)); }} className="text-xs text-gold hover:underline">
                  Editar meta
                </button>
              )}
            </div>
            <div className="h-3 bg-[#E8D5A3]/30 rounded-full overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{
                  width: `${pctMeta}%`,
                  backgroundColor: pctMeta >= 100 ? "#27AE60" : pctMeta >= 60 ? "#C9A84C" : "#C0392B",
                }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: pctMeta >= 100 ? "#27AE60" : "#6B6B6B" }}>
              {pctMeta >= 100 ? "Meta atingida! 🎉" : `${pctMeta}% da meta — faltam ${meta - leadsNaSemana} leads`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-danger" />
              <span className="text-xs text-text-muted uppercase tracking-wide">Fila do dia</span>
            </div>
            <p className="font-mono-data text-4xl font-bold text-text-main">{filaDoDia.length}</p>
            <p className="text-xs text-text-muted mt-1">leads aguardando contato</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-success" />
              <span className="text-xs text-text-muted uppercase tracking-wide">Cadência completa</span>
            </div>
            <p className="font-mono-data text-4xl font-bold text-text-main">{cadenciaCompleta.length}</p>
            <p className="text-xs text-text-muted mt-1">leads com D0/D3/D7 feitos</p>
          </CardContent>
        </Card>
      </div>

      {/* Fila do dia */}
      {filaDoDia.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-5 bg-danger rounded-full" />
            <h2 className="font-display text-lg font-semibold text-text-main">Fila do dia ({filaDoDia.length})</h2>
            <span className="text-xs text-text-muted">— contate esses leads hoje</span>
          </div>
          <div className="space-y-2">
            {filaDoDia.map((lead) => {
              const cad = cadencias[lead.id] ?? [];
              const proximoDia = proximoDiaCadencia(lead.criado_em, cad)!;
              const dias = diasDesde(lead.criado_em);
              const atrasado = dias > proximoDia + 1;
              const canalInfo = CANAL_CONFIG[lead.canal ?? "outro"];

              return (
                <Card key={lead.id} className={atrasado ? "border-danger/30" : "border-gold/20"}>
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Badge D0/D3/D7 */}
                    <div
                      className="w-12 h-12 rounded-btn flex flex-col items-center justify-center shrink-0 font-bold"
                      style={{
                        backgroundColor: atrasado ? "#C0392B18" : "#C9A84C18",
                        color: atrasado ? "#C0392B" : "#C9A84C",
                      }}
                    >
                      <span className="text-xs">D</span>
                      <span className="text-lg leading-none">{proximoDia}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-text-main text-sm">{lead.nome}</span>
                        {lead.canal && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: canalInfo.cor + "18", color: canalInfo.cor }}>
                            {canalInfo.icon} {canalInfo.label}
                          </span>
                        )}
                        {atrasado && (
                          <span className="text-[10px] text-danger font-medium">⚠ {dias - proximoDia}d atrasado</span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">{lead.empresa}</p>
                      <div className="flex gap-1 mt-1.5">
                        {DIAS_CADENCIA.map((dia) => {
                          const item = cad.find((c) => c.dia === dia);
                          return (
                            <span
                              key={dia}
                              className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                              style={{
                                backgroundColor: item?.status === "feito" ? "#27AE6018" : item?.status === "sem_resposta" ? "#C0392B18" : "#E8D5A3/40",
                                color: item?.status === "feito" ? "#27AE60" : item?.status === "sem_resposta" ? "#C0392B" : "#6B6B6B",
                              }}
                            >
                              D{dia} {item?.status === "feito" ? "✓" : item?.status === "sem_resposta" ? "✗" : "·"}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick actions */}
                    {acao?.leadId === lead.id && acao?.dia === proximoDia ? (
                      <div className="flex flex-col gap-2 min-w-56">
                        <div className="flex gap-1">
                          {CANAIS_CADENCIA.map((c) => {
                            const ci = CANAL_CONFIG[c];
                            return (
                              <button
                                key={c}
                                onClick={() => setCanalAcao(c)}
                                className="p-2 rounded-btn transition-all"
                                style={{
                                  backgroundColor: canalAcao === c ? ci.cor + "20" : "transparent",
                                  color: canalAcao === c ? ci.cor : "#6B6B6B",
                                  border: `1.5px solid ${canalAcao === c ? ci.cor : "#E8D5A3"}`,
                                }}
                                title={ci.label}
                              >
                                {ci.icon}
                              </button>
                            );
                          })}
                        </div>
                        <Input
                          value={notaAcao}
                          onChange={(e) => setNotaAcao(e.target.value)}
                          placeholder="Nota (opcional)"
                          className="h-8 text-xs"
                        />
                        <div className="flex gap-1">
                          <Button size="sm" className="flex-1 text-xs h-8" onClick={() => registrarAcao(lead.id, proximoDia, "feito")}>
                            <CheckCircle2 size={11} /> Feito
                          </Button>
                          <Button size="sm" variant="secondary" className="flex-1 text-xs h-8 text-text-muted" onClick={() => registrarAcao(lead.id, proximoDia, "sem_resposta")}>
                            Sem resp.
                          </Button>
                          <button onClick={() => setAcao(null)} className="text-text-muted hover:text-text-main p-1">
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 shrink-0">
                        {lead.whatsapp && (
                          <a
                            href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-btn border border-[#E8D5A3]/50 text-[#25D366] hover:bg-[#25D366]/10 transition-all"
                            title="Abrir WhatsApp"
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}
                        <Button
                          size="sm"
                          onClick={() => { setAcao({ leadId: lead.id, dia: proximoDia }); setNotaAcao(""); }}
                        >
                          Registrar D{proximoDia}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Todos os leads em prospecção */}
      <div className="grid grid-cols-3 gap-6">
        {/* Sem contato */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-text-muted" />
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Sem contato ({semContato.length})</h3>
          </div>
          <div className="space-y-2">
            {semContato.slice(0, 8).map((lead) => (
              <LeadMiniCard key={lead.id} lead={lead} onAcao={() => setAcao({ leadId: lead.id, dia: 0 })} />
            ))}
            {semContato.length === 0 && <p className="text-xs text-text-muted py-4 text-center">Nenhum pendente</p>}
          </div>
        </div>

        {/* Em cadência */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flame size={14} className="text-gold" />
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Em cadência ({emCadencia.length})</h3>
          </div>
          <div className="space-y-2">
            {emCadencia.slice(0, 8).map((lead) => {
              const cad = cadencias[lead.id] ?? [];
              const prox = proximoDiaCadencia(lead.criado_em, cad);
              return <LeadMiniCard key={lead.id} lead={lead} proximoDia={prox} cadencia={cad} onAcao={() => prox !== null && setAcao({ leadId: lead.id, dia: prox })} />;
            })}
            {emCadencia.length === 0 && <p className="text-xs text-text-muted py-4 text-center">Nenhum em andamento</p>}
          </div>
        </div>

        {/* Cadência completa */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} className="text-success" />
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Completos ({cadenciaCompleta.length})</h3>
          </div>
          <div className="space-y-2">
            {cadenciaCompleta.slice(0, 8).map((lead) => (
              <LeadMiniCard key={lead.id} lead={lead} cadencia={cadencias[lead.id] ?? []} completo />
            ))}
            {cadenciaCompleta.length === 0 && <p className="text-xs text-text-muted py-4 text-center">Nenhum ainda</p>}
          </div>
        </div>
      </div>

      {/* Origens da semana */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-text-main mb-4">Leads por canal — esta semana</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(
            leads
              .filter((l) => l.criado_em >= inicioSemana)
              .reduce((acc, l) => {
                const canal = l.canal ?? "outro";
                acc[canal] = (acc[canal] ?? 0) + 1;
                return acc;
              }, {} as Record<string, number>)
          ).sort(([, a], [, b]) => b - a).map(([canal, count]) => {
            const cfg = CANAL_CONFIG[canal] ?? CANAL_CONFIG.outro;
            return (
              <div
                key={canal}
                className="flex items-center gap-2 px-3 py-2 rounded-btn"
                style={{ backgroundColor: cfg.cor + "15", border: `1px solid ${cfg.cor}30` }}
              >
                <span style={{ color: cfg.cor }}>{cfg.icon}</span>
                <span className="text-xs font-medium text-text-main">{cfg.label}</span>
                <span className="font-mono-data text-sm font-bold" style={{ color: cfg.cor }}>{count}</span>
              </div>
            );
          })}
          {leads.filter((l) => l.criado_em >= inicioSemana).length === 0 && (
            <p className="text-xs text-text-muted">Nenhum lead criado esta semana ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mini card de lead ────────────────────────────────────────────────────────
function LeadMiniCard({
  lead, proximoDia, cadencia, onAcao, completo,
}: {
  lead: Lead;
  proximoDia?: number | null;
  cadencia?: CadenciaItem[];
  onAcao?: () => void;
  completo?: boolean;
}) {
  const dias = diasDesde(lead.criado_em);
  const canalCfg = CANAL_CONFIG[lead.canal ?? "outro"];

  return (
    <Card className="hover:border-gold/30 transition-all">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-text-main truncate">{lead.nome}</p>
            <p className="text-[10px] text-text-muted truncate">{lead.empresa}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {lead.canal && (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1"
                  style={{ backgroundColor: canalCfg.cor + "15", color: canalCfg.cor }}>
                  {canalCfg.icon} {canalCfg.label}
                </span>
              )}
              <span className="text-[9px] text-text-muted">{dias}d atrás</span>
              {cadencia && DIAS_CADENCIA.map((dia) => {
                const item = cadencia.find((c) => c.dia === dia);
                return (
                  <span key={dia} className="text-[9px] font-bold"
                    style={{ color: item?.status === "feito" ? "#27AE60" : item?.status === "sem_resposta" ? "#C0392B" : "#C9A84C60" }}>
                    D{dia}{item?.status === "feito" ? "✓" : item?.status === "sem_resposta" ? "✗" : ""}
                  </span>
                );
              })}
            </div>
          </div>
          {!completo && onAcao && (
            <button
              onClick={onAcao}
              className="shrink-0 p-1.5 rounded-btn bg-gold/10 text-gold hover:bg-gold/20 transition-all"
              title={`Registrar D${proximoDia ?? 0}`}
            >
              <Plus size={12} />
            </button>
          )}
          {completo && (
            <CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
