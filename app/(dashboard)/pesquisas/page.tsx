"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link2, FileText, CheckCircle, Clock, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CORES_DISC, type FatorDISC } from "@/lib/pesquisas/disc";

type TipoPesquisa = "disc" | "q12" | "gptw";

type Pesquisa = {
  id: string;
  tipo: TipoPesquisa;
  token: string;
  respondente_nome?: string;
  respondente_email?: string;
  respondente_cargo?: string;
  respondente_empresa?: string;
  resultado?: Record<string, unknown>;
  pdf_url?: string;
  criado_em: string;
  concluido_em?: string;
};

const TIPO_LABELS: Record<TipoPesquisa, string> = {
  disc: "DISC",
  q12: "Q12",
  gptw: "GPTW",
};

const TIPO_CORES: Record<TipoPesquisa, string> = {
  disc: "#2980B9",
  q12: "#27AE60",
  gptw: "#8E44AD",
};

const TIPO_DESCRICAO: Record<TipoPesquisa, string> = {
  disc: "Perfil comportamental — 28 grupos de palavras",
  q12: "Engajamento Gallup — 12 afirmações",
  gptw: "Trust Index Great Place To Work — 25 afirmações",
};

export default function PesquisasPage() {
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<TipoPesquisa>("disc");
  const [linkCopiado, setLinkCopiado] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState<string | null>(null);
  const supabase = createClient();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data } = await supabase
      .from("pesquisas")
      .select("*")
      .order("criado_em", { ascending: false });
    if (data) setPesquisas(data as Pesquisa[]);
  }

  async function gerarLink(tipo: TipoPesquisa) {
    const token = crypto.randomUUID();
    const { data } = await supabase
      .from("pesquisas")
      .insert({ tipo, token })
      .select("token")
      .single();

    if (data) {
      const url = `${window.location.origin}/pesquisa/${data.token}`;
      await navigator.clipboard.writeText(url);
      setLinkCopiado(data.token);
      setTimeout(() => setLinkCopiado(null), 3000);
      carregar();
    }
  }

  async function gerarPdf(pesquisaId: string) {
    setGerandoPdf(pesquisaId);
    const res = await fetch("/api/pesquisa/gerar-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pesquisaId }),
    });
    const data = await res.json();
    if (data.pdfUrl) window.open(data.pdfUrl, "_blank");
    setGerandoPdf(null);
    carregar();
  }

  async function copiarLink(token: string) {
    const url = `${window.location.origin}/pesquisa/${token}`;
    await navigator.clipboard.writeText(url);
    setLinkCopiado(token);
    setTimeout(() => setLinkCopiado(null), 3000);
  }

  const filtradas = pesquisas.filter((p) => p.tipo === abaAtiva);
  const concluidas = filtradas.filter((p) => p.respondente_nome);
  const pendentes = filtradas.filter((p) => !p.respondente_nome);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">Pesquisas</h1>
          <p className="text-text-muted mt-1">DISC · Q12 · GPTW</p>
        </div>
        <Button onClick={() => gerarLink(abaAtiva)}>
          <Link2 size={15} />
          {linkCopiado ? "Link copiado!" : `Gerar link ${TIPO_LABELS[abaAtiva]}`}
        </Button>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-8">
        {(["disc", "q12", "gptw"] as TipoPesquisa[]).map((tipo) => {
          const total = pesquisas.filter((p) => p.tipo === tipo).length;
          const concl = pesquisas.filter((p) => p.tipo === tipo && p.respondente_nome).length;
          return (
            <button
              key={tipo}
              onClick={() => setAbaAtiva(tipo)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-btn text-sm font-medium transition-all ${
                abaAtiva === tipo
                  ? "text-white shadow-sm"
                  : "bg-surface text-text-muted hover:text-text-main border border-[#E8D5A3]/50"
              }`}
              style={abaAtiva === tipo ? { backgroundColor: TIPO_CORES[tipo] } : {}}
            >
              <span>{TIPO_LABELS[tipo]}</span>
              {total > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${abaAtiva === tipo ? "bg-white/20" : "bg-[#E8D5A3]/30"}`}>
                  {concl}/{total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Descrição */}
      <p className="text-text-muted text-sm mb-6">{TIPO_DESCRICAO[abaAtiva]}</p>

      {/* Concluídas */}
      {concluidas.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold text-text-main mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-success" /> Concluídas ({concluidas.length})
          </h2>
          <div className="space-y-3">
            {concluidas.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-0">
                  <div
                    className="flex items-center justify-between gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-btn flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: TIPO_CORES[p.tipo] }}
                      >
                        {TIPO_LABELS[p.tipo]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text-main truncate">{p.respondente_nome}</p>
                        <p className="text-xs text-text-muted">{p.respondente_cargo && `${p.respondente_cargo} · `}{p.respondente_email} · {formatDate(p.concluido_em ?? p.criado_em)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); copiarLink(p.token); }}>
                        <Link2 size={13} /> {linkCopiado === p.token ? "Copiado!" : "Link"}
                      </Button>
                      {p.pdf_url ? (
                        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); window.open(p.pdf_url!, "_blank"); }}>
                          <ExternalLink size={13} /> PDF
                        </Button>
                      ) : (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); gerarPdf(p.id); }} disabled={gerandoPdf === p.id}>
                          <FileText size={13} /> {gerandoPdf === p.id ? "Gerando..." : "Gerar PDF"}
                        </Button>
                      )}
                      {expandido === p.id ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                    </div>
                  </div>

                  {expandido === p.id && p.resultado && (
                    <div className="border-t border-[#E8D5A3]/30 p-4 bg-bg">
                      {p.tipo === "disc" && <ResultadoDISC resultado={p.resultado} />}
                      {p.tipo === "q12" && <ResultadoQ12 resultado={p.resultado} />}
                      {p.tipo === "gptw" && <ResultadoGPTW resultado={p.resultado} />}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pendentes */}
      {pendentes.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold text-text-main mb-4 flex items-center gap-2">
            <Clock size={18} className="text-text-muted" /> Aguardando resposta ({pendentes.length})
          </h2>
          <div className="space-y-2">
            {pendentes.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-surface rounded-btn border border-[#E8D5A3]/50">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-text-muted" />
                  <div>
                    <p className="text-sm text-text-muted">Link gerado em {formatDate(p.criado_em)}</p>
                    <p className="text-xs text-text-muted font-mono-data truncate max-w-xs">/pesquisa/{p.token}</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => copiarLink(p.token)}>
                  <Link2 size={13} /> {linkCopiado === p.token ? "Copiado!" : "Copiar link"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtradas.length === 0 && (
        <div className="text-center py-20 text-text-muted">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-4">Nenhuma pesquisa {TIPO_LABELS[abaAtiva]} ainda.</p>
          <Button onClick={() => gerarLink(abaAtiva)}>
            <Link2 size={15} /> Gerar primeiro link
          </Button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENTES DE RESULTADO (inline no admin)
// ─────────────────────────────────────────────────────────────

function ResultadoDISC({ resultado }: { resultado: Record<string, unknown> }) {
  const percentual = resultado.percentual as Record<FatorDISC, number>;
  const perfilDominante = resultado.perfilDominante as FatorDISC;
  const descricao = resultado.descricao as string;
  const LABELS: Record<FatorDISC, string> = { D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade" };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold text-text-main">Perfil dominante:</span>
        <span className="text-sm font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: CORES_DISC[perfilDominante] }}>
          {perfilDominante} — {LABELS[perfilDominante]}
        </span>
      </div>
      <div className="space-y-2 mb-3">
        {(["D", "I", "S", "C"] as FatorDISC[]).map((f) => (
          <div key={f} className="flex items-center gap-3">
            <span className="font-mono-data text-sm font-bold w-4" style={{ color: CORES_DISC[f] }}>{f}</span>
            <span className="text-xs text-text-muted w-20">{LABELS[f]}</span>
            <div className="flex-1 bg-[#E8D5A3]/30 rounded-full h-2">
              <div className="h-2 rounded-full" style={{ width: `${percentual?.[f] ?? 0}%`, backgroundColor: CORES_DISC[f] }} />
            </div>
            <span className="text-xs font-mono-data text-text-muted w-8 text-right">{percentual?.[f] ?? 0}%</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted">{descricao}</p>
    </div>
  );
}

function ResultadoQ12({ resultado }: { resultado: Record<string, unknown> }) {
  const percentual = resultado.percentual as number;
  const nivel = resultado.nivel as string;
  const cor = resultado.cor as string;
  const porDimensao = resultado.porDimensao as Record<string, number>;
  const media = resultado.media as number;

  return (
    <div>
      <div className="flex items-center gap-6 mb-4">
        <div>
          <p className="text-xs text-text-muted mb-1">Índice de Engajamento</p>
          <p className="font-mono-data text-3xl font-bold text-text-main">{percentual}%</p>
          <span className="text-xs font-medium" style={{ color: cor }}>{nivel}</span>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">Média (1-5)</p>
          <p className="font-mono-data text-3xl font-bold text-text-main">{media?.toFixed(1)}</p>
        </div>
      </div>
      {porDimensao && (
        <div className="space-y-2">
          {Object.entries(porDimensao).map(([dim, val]) => (
            <div key={dim} className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-36 flex-shrink-0">{dim}</span>
              <div className="flex-1 bg-[#E8D5A3]/30 rounded-full h-2">
                <div className="h-2 rounded-full bg-success" style={{ width: `${((val - 1) / 4) * 100}%` }} />
              </div>
              <span className="text-xs font-mono-data text-text-muted w-8 text-right">{val?.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultadoGPTW({ resultado }: { resultado: Record<string, unknown> }) {
  const trustIndex = resultado.trustIndex as number;
  const nivel = resultado.nivel as string;
  const cor = resultado.cor as string;
  const porDimensao = resultado.porDimensao as Record<string, number>;

  return (
    <div>
      <div className="flex items-center gap-6 mb-4">
        <div>
          <p className="text-xs text-text-muted mb-1">Trust Index</p>
          <p className="font-mono-data text-3xl font-bold text-text-main">{trustIndex}%</p>
          <span className="text-xs font-medium" style={{ color: cor }}>{nivel}</span>
        </div>
      </div>
      {porDimensao && (
        <div className="space-y-2">
          {Object.entries(porDimensao).map(([dim, val]) => (
            <div key={dim} className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-32 flex-shrink-0">{dim}</span>
              <div className="flex-1 bg-[#E8D5A3]/30 rounded-full h-2">
                <div className="h-2 rounded-full" style={{ width: `${val}%`, backgroundColor: cor }} />
              </div>
              <span className="text-xs font-mono-data text-text-muted w-8 text-right">{val}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
