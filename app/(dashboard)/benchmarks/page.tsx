"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, Database, Globe } from "lucide-react";
import { labelCategoria, labelSegmento } from "@/lib/benchmarks/categorias";

type Referencia = {
  id: string;
  tipo: string;
  categoria?: string;
  segmento?: string;
  porte?: string;
  metrica: string;
  valor: number;
  fonte: string;
  ano: number;
  notas?: string;
};

type Snapshot = {
  id: string;
  tipo: string;
  categoria?: string;
  segmento?: string;
  porte?: string;
  metrica: string;
  valor: number;
  total_amostras: number;
  calculado_em: string;
};

const TIPO_LABELS: Record<string, string> = {
  q12: "Q12 — Engajamento",
  gptw: "GPTW — Trust Index",
  diagnostico_3d: "Diagnóstico 3D",
  radar_360: "Radar 360",
};

const METRICA_LABELS: Record<string, string> = {
  percentual_geral: "Índice Geral (%)",
  trust_index: "Trust Index (%)",
  score_geral: "Score Geral",
  dimensao_credibilidade: "Credibilidade (%)",
  dimensao_respeito: "Respeito (%)",
  dimensao_imparcialidade: "Imparcialidade (%)",
  dimensao_orgulho: "Orgulho (%)",
  dimensao_camaradagem: "Camaradagem (%)",
};

const COR_VALOR = (v: number, max = 100) => {
  const pct = (v / max) * 100;
  if (pct >= 70) return "#27AE60";
  if (pct >= 50) return "#C9A84C";
  if (pct >= 30) return "#E67E22";
  return "#C0392B";
};

export default function BenchmarksPage() {
  const supabase = createClient();
  const [referencias, setReferencias] = useState<Referencia[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [recalculando, setRecalculando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"interno" | "referencia">("referencia");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [ultimoCalculo, setUltimoCalculo] = useState<string | null>(null);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const [{ data: refs }, { data: snaps }] = await Promise.all([
      supabase.from("benchmark_referencias").select("*").order("tipo").order("categoria"),
      supabase.from("benchmark_snapshots").select("*").order("calculado_em", { ascending: false }),
    ]);
    if (refs) setReferencias(refs);
    if (snaps) {
      setSnapshots(snaps);
      if (snaps[0]) setUltimoCalculo(snaps[0].calculado_em);
    }
  }

  async function recalcular() {
    setRecalculando(true);
    await fetch("/api/benchmarks/recalcular");
    await carregar();
    setRecalculando(false);
  }

  const tiposDisponiveis = ["todos", ...Array.from(new Set([...referencias, ...snapshots].map((r) => r.tipo)))];

  const refsFiltradas = referencias.filter((r) => tipoFiltro === "todos" || r.tipo === tipoFiltro);
  const snapsFiltrados = snapshots.filter((r) => tipoFiltro === "todos" || r.tipo === tipoFiltro);

  const totalAmostrasInternas = snapshots.reduce((a, s) => a + (s.total_amostras ?? 0), 0);

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">Benchmarks</h1>
          <p className="text-text-muted mt-1">Referências de mercado + dados internos dos seus prospectos</p>
        </div>
        <Button onClick={recalcular} disabled={recalculando}>
          <RefreshCw size={15} className={recalculando ? "animate-spin" : ""} />
          {recalculando ? "Calculando..." : "Recalcular agora"}
        </Button>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <Globe size={20} className="text-primary" />
            <div>
              <p className="text-2xl font-bold text-text-main font-mono-data">{referencias.length}</p>
              <p className="text-xs text-text-muted">Referências de mercado</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <Database size={20} className="text-gold" />
            <div>
              <p className="text-2xl font-bold text-text-main font-mono-data">{snapshots.length}</p>
              <p className="text-xs text-text-muted">Snapshots internos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <TrendingUp size={20} className="text-success" />
            <div>
              <p className="text-2xl font-bold text-text-main font-mono-data">{totalAmostrasInternas}</p>
              <p className="text-xs text-text-muted">Respostas na base</p>
              {ultimoCalculo && <p className="text-xs text-text-muted/60">Calc. {new Date(ultimoCalculo).toLocaleDateString("pt-BR")}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-6">
        {(["referencia", "interno"] as const).map((aba) => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            className={`px-4 py-2 rounded-btn text-sm font-medium transition-all ${
              abaAtiva === aba ? "bg-primary text-gold" : "bg-surface text-text-muted border border-[#E8D5A3]/50"
            }`}
          >
            {aba === "referencia" ? "📊 Referências de mercado" : "🏠 Base interna"}
          </button>
        ))}
        {/* Filtro de tipo */}
        <div className="ml-auto flex gap-2">
          {tiposDisponiveis.map((t) => (
            <button
              key={t}
              onClick={() => setTipoFiltro(t)}
              className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-all ${
                tipoFiltro === t ? "bg-gold text-primary" : "bg-bg text-text-muted hover:text-text-main"
              }`}
            >
              {t === "todos" ? "Todos" : TIPO_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      {/* Referências de mercado */}
      {abaAtiva === "referencia" && (
        <div>
          <p className="text-xs text-text-muted mb-4">
            Dados de Gallup, GPTW, Engaja S/A e pesquisas setoriais. Usados como fallback quando a base interna ainda não tem volume suficiente.
          </p>
          <div className="space-y-2">
            {refsFiltradas.map((r) => {
              const cor = COR_VALOR(r.valor);
              return (
                <Card key={r.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-btn flex items-center justify-center font-mono-data font-bold text-sm"
                      style={{ backgroundColor: cor + "15", color: cor }}>
                      {r.valor}%
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold text-text-main">{TIPO_LABELS[r.tipo] ?? r.tipo}</span>
                        <span className="text-xs text-text-muted">·</span>
                        <span className="text-xs text-text-muted">{METRICA_LABELS[r.metrica] ?? r.metrica}</span>
                        {r.categoria && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{labelCategoria(r.categoria)}</span>
                        )}
                        {r.segmento && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold">{labelSegmento(r.segmento)}</span>
                        )}
                        {r.porte && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8D5A3]/40 text-text-muted">{r.porte}</span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">{r.fonte} · {r.ano}{r.notas ? ` · ${r.notas}` : ""}</p>
                    </div>
                    <div className="w-24">
                      <div className="h-2 bg-[#E8D5A3]/30 rounded-full">
                        <div className="h-2 rounded-full" style={{ width: `${r.valor}%`, backgroundColor: cor }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {refsFiltradas.length === 0 && (
            <p className="text-center text-text-muted text-sm py-8">Nenhuma referência para este filtro.</p>
          )}
        </div>
      )}

      {/* Base interna */}
      {abaAtiva === "interno" && (
        <div>
          {snapsFiltrados.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Database size={36} className="mx-auto mb-3 text-text-muted opacity-40" />
                <p className="text-text-muted text-sm mb-2">Ainda sem dados internos suficientes.</p>
                <p className="text-xs text-text-muted/60">Mínimo de 3 respostas por grupo para aparecer aqui. O cálculo roda automaticamente a cada 15 dias.</p>
                <Button className="mt-4" onClick={recalcular} disabled={recalculando} size="sm">
                  <RefreshCw size={13} /> Calcular agora
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {snapsFiltrados.map((s) => {
                const cor = COR_VALOR(s.valor);
                return (
                  <Card key={s.id}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-btn flex items-center justify-center font-mono-data font-bold text-sm"
                        style={{ backgroundColor: cor + "15", color: cor }}>
                        {s.valor}%
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-semibold text-text-main">{TIPO_LABELS[s.tipo] ?? s.tipo}</span>
                          <span className="text-xs text-text-muted">·</span>
                          <span className="text-xs text-text-muted">{METRICA_LABELS[s.metrica] ?? s.metrica}</span>
                          {s.categoria && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{labelCategoria(s.categoria)}</span>
                          )}
                          {s.segmento && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold">{labelSegmento(s.segmento)}</span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted">{s.total_amostras} amostras · calculado {new Date(s.calculado_em).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="w-24">
                        <div className="h-2 bg-[#E8D5A3]/30 rounded-full">
                          <div className="h-2 rounded-full" style={{ width: `${s.valor}%`, backgroundColor: cor }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
