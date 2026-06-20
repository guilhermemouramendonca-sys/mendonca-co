"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link2, FileText, ExternalLink, ChevronDown, ChevronUp, Users, BarChart2, CheckCircle, Lock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CATEGORIAS, SEGMENTOS } from "@/lib/benchmarks/categorias";

type TipoRodada = "q12" | "gptw";
type StatusRodada = "aberta" | "consolidada" | "encerrada";

type Rodada = {
  id: string;
  token: string;
  tipo: TipoRodada;
  nome: string;
  empresa?: string;
  status: StatusRodada;
  resultado_consolidado?: Record<string, unknown>;
  pdf_url?: string;
  criado_em: string;
  total_respostas?: number;
};

const TIPO_COR: Record<TipoRodada, string> = { q12: "#27AE60", gptw: "#8E44AD" };
const TIPO_LABEL: Record<TipoRodada, string> = { q12: "Q12", gptw: "GPTW" };
const STATUS_LABEL: Record<StatusRodada, string> = { aberta: "Aberta", consolidada: "Consolidada", encerrada: "Encerrada" };
const STATUS_COR: Record<StatusRodada, string> = { aberta: "#27AE60", consolidada: "#C9A84C", encerrada: "#6B6B6B" };

export default function RodadasPage() {
  const supabase = createClient();
  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [novoTipo, setNovoTipo] = useState<TipoRodada>("q12");
  const [novoNome, setNovoNome] = useState("");
  const [novaEmpresa, setNovaEmpresa] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novoSegmento, setNovoSegmento] = useState("");
  const [consolidando, setConsolidando] = useState<string | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState<string | null>(null);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data } = await supabase
      .from("rodadas")
      .select("*, pesquisas(count)")
      .order("criado_em", { ascending: false });

    if (data) {
      setRodadas(data.map((r) => ({
        ...r,
        total_respostas: (r.pesquisas as unknown as { count: number }[])?.[0]?.count ?? 0,
      })));
    }
  }

  async function criarRodada() {
    if (!novoNome.trim()) return;
    const token = crypto.randomUUID();
    const { error } = await supabase.from("rodadas").insert({
      token,
      tipo: novoTipo,
      nome: novoNome.trim(),
      empresa: novaEmpresa.trim() || null,
      categoria: novaCategoria || null,
      segmento: novoSegmento || null,
      status: "aberta",
    });
    if (!error) {
      const url = `${window.location.origin}/forms/rodada/${token}`;
      await navigator.clipboard.writeText(url);
      alert(`Rodada criada! Link copiado:\n${url}`);
      setNovoNome("");
      setNovaEmpresa("");
      setNovaCategoria("");
      setNovoSegmento("");
      setCriando(false);
      carregar();
    }
  }

  async function copiarLink(token: string) {
    const url = `${window.location.origin}/forms/rodada/${token}`;
    await navigator.clipboard.writeText(url);
    alert("Link copiado!");
  }

  async function encerrar(id: string) {
    if (!confirm("Encerrar a rodada? O link público será desativado.")) return;
    await supabase.from("rodadas").update({ status: "encerrada" }).eq("id", id);
    carregar();
  }

  async function consolidar(id: string) {
    setConsolidando(id);
    const res = await fetch("/api/rodada/consolidar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rodadaId: id }),
    });
    const data = await res.json();
    if (data.error) alert("Erro: " + data.error);
    setConsolidando(null);
    carregar();
  }

  async function gerarPdf(id: string) {
    setGerandoPdf(id);
    const res = await fetch("/api/rodada/gerar-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rodadaId: id }),
    });
    const data = await res.json();
    if (data.pdfUrl) window.open(data.pdfUrl, "_blank");
    setGerandoPdf(null);
    carregar();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">Rodadas</h1>
          <p className="text-text-muted mt-1">Q12 e GPTW coletivos — múltiplas respostas, resultado consolidado</p>
        </div>
        <Button onClick={() => setCriando(!criando)}>
          <Users size={16} /> Nova rodada
        </Button>
      </div>

      {/* Form criar */}
      {criando && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold text-text-main mb-4">Nova Rodada</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-2">Tipo</label>
                <div className="flex gap-2">
                  {(["q12", "gptw"] as TipoRodada[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNovoTipo(t)}
                      className={`px-4 py-2 rounded-btn text-sm font-bold transition-all ${
                        novoTipo === t ? "text-white" : "bg-bg text-text-muted"
                      }`}
                      style={novoTipo === t ? { backgroundColor: TIPO_COR[t] } : {}}
                    >
                      {TIPO_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-2">Empresa (opcional)</label>
                <input
                  className="w-full border border-[#E8D5A3] rounded-btn px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-gold/30"
                  value={novaEmpresa}
                  onChange={(e) => setNovaEmpresa(e.target.value)}
                  placeholder="Nome da empresa"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-2">Nome da rodada *</label>
              <input
                className="w-full border border-[#E8D5A3] rounded-btn px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-gold/30"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder={`Ex: ${TIPO_LABEL[novoTipo]} — Time Comercial — Jun/2025`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-2">Setor</label>
                <select
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                  className="w-full h-9 px-3 rounded-btn border border-[#E8D5A3] bg-surface text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold/30"
                >
                  <option value="">Selecionar (opcional)</option>
                  {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-2">Segmento</label>
                <select
                  value={novoSegmento}
                  onChange={(e) => setNovoSegmento(e.target.value)}
                  className="w-full h-9 px-3 rounded-btn border border-[#E8D5A3] bg-surface text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold/30"
                >
                  <option value="">Selecionar (opcional)</option>
                  {SEGMENTOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={criarRodada} disabled={!novoNome.trim()}>Criar e copiar link</Button>
              <Button variant="secondary" onClick={() => setCriando(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {rodadas.map((r) => {
          const aberto = expandido === r.id;
          const cor = TIPO_COR[r.tipo];
          const statusCor = STATUS_COR[r.status];
          const consolidado = r.resultado_consolidado;

          return (
            <Card key={r.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg/50 transition-colors"
                  onClick={() => setExpandido(aberto ? null : r.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-btn flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: cor }}>
                      {TIPO_LABEL[r.tipo]}
                    </div>
                    <div>
                      <p className="font-semibold text-text-main">{r.nome}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs" style={{ color: statusCor }}>● {STATUS_LABEL[r.status]}</span>
                        <span className="text-xs text-text-muted">{r.total_respostas ?? 0} resposta{r.total_respostas !== 1 ? "s" : ""}</span>
                        {r.empresa && <span className="text-xs text-text-muted">{r.empresa}</span>}
                        <span className="text-xs text-text-muted">{formatDate(r.criado_em)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status === "aberta" && (
                      <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); copiarLink(r.token); }}>
                        <Link2 size={13} /> Link
                      </Button>
                    )}
                    {aberto ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                  </div>
                </div>

                {aberto && (
                  <div className="border-t border-[#E8D5A3]/30 p-4 bg-bg/30">
                    {/* Score consolidado se tiver */}
                    {consolidado && (
                      <div className="mb-4 p-4 bg-surface rounded-btn border border-[#E8D5A3]/50">
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Resultado Consolidado</p>
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-xs text-text-muted mb-1">
                              {r.tipo === "q12" ? "Índice de Engajamento" : "Trust Index"}
                            </p>
                            <p className="font-mono-data text-3xl font-bold text-text-main">
                              {r.tipo === "q12"
                                ? `${(consolidado as Record<string, number>).percentualGeral}%`
                                : `${(consolidado as Record<string, number>).trustIndexMedio}%`}
                            </p>
                            <p className="text-xs mt-1" style={{ color: (consolidado as Record<string, string>).cor }}>
                              {(consolidado as Record<string, string>).nivel}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-text-muted mb-1">Respondentes</p>
                            <p className="font-mono-data text-3xl font-bold text-text-main">
                              {(consolidado as Record<string, number>).totalRespondentes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2 flex-wrap">
                      {r.status === "aberta" && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => copiarLink(r.token)}>
                            <Link2 size={13} /> Copiar link
                          </Button>
                          <Button size="sm" onClick={() => consolidar(r.id)} disabled={consolidando === r.id || (r.total_respostas ?? 0) === 0}>
                            <BarChart2 size={13} /> {consolidando === r.id ? "Consolidando..." : "Consolidar"}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => encerrar(r.id)}>
                            <Lock size={13} /> Encerrar
                          </Button>
                        </>
                      )}
                      {(r.status === "consolidada" || r.resultado_consolidado) && (
                        <>
                          {r.pdf_url ? (
                            <Button size="sm" variant="secondary" onClick={() => window.open(r.pdf_url!, "_blank")}>
                              <ExternalLink size={13} /> Abrir PDF
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => gerarPdf(r.id)} disabled={gerandoPdf === r.id}>
                              <FileText size={13} /> {gerandoPdf === r.id ? "Gerando..." : "Gerar PDF"}
                            </Button>
                          )}
                          {r.pdf_url && (
                            <Button size="sm" variant="secondary" onClick={() => gerarPdf(r.id)} disabled={gerandoPdf === r.id}>
                              {gerandoPdf === r.id ? "Gerando..." : "Regerar"}
                            </Button>
                          )}
                          {r.status !== "encerrada" && (
                            <Button size="sm" onClick={() => consolidar(r.id)} disabled={consolidando === r.id}>
                              <CheckCircle size={13} /> {consolidando === r.id ? "..." : "Reconsolidar"}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {rodadas.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-text-muted text-sm mb-4">Nenhuma rodada ainda.</p>
            <Button onClick={() => setCriando(true)}>
              <Users size={15} /> Criar primeira rodada
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
