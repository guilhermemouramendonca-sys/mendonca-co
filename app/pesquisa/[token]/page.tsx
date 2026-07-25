"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SetorSelects } from "@/components/ui/setor-selects";
import { BenchmarkComparacao } from "@/components/ui/benchmark-comparacao";

// DISC
import { GRUPOS_DISC, calcularDISC, CORES_DISC, type FatorDISC, type RespostasDISC } from "@/lib/pesquisas/disc";
// Q12
import { PERGUNTAS_Q12, calcularQ12, ESCALA_Q12, type RespostasQ12 } from "@/lib/pesquisas/q12";
// GPTW
import { AFIRMACOES_GPTW, calcularGPTW, ESCALA_GPTW, type RespostasGPTW } from "@/lib/pesquisas/gptw";

type Fase = "identificacao" | "perguntas" | "concluido" | "erro";
type TipoPesquisa = "disc" | "q12" | "gptw";

const TITULOS: Record<TipoPesquisa, string> = {
  disc: "Perfil DISC",
  q12: "Pesquisa de Engajamento Q12",
  gptw: "Great Place To Work — Trust Index",
};

const SUBTITULOS: Record<TipoPesquisa, string> = {
  disc: "28 grupos de palavras · ~10 minutos",
  q12: "12 afirmações · ~5 minutos",
  gptw: "25 afirmações · ~8 minutos",
};

export default function PesquisaPublicaPage() {
  const { token } = useParams<{ token: string }>();
  const supabase = createClient();

  const [fase, setFase] = useState<Fase>("identificacao");
  const [tipo, setTipo] = useState<TipoPesquisa | null>(null);
  const [pesquisaId, setPesquisaId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [categoria, setCategoria] = useState("");
  const [segmento, setSegmento] = useState("");
  const [faturamento, setFaturamento] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [erro, setErro] = useState("");
  const [atual, setAtual] = useState(0);
  const [salvando, setSalvando] = useState(false);

  // Respostas por tipo
  const [respostasDisc, setRespostasDisc] = useState<RespostasDISC>({});
  const [respostasQ12, setRespostasQ12] = useState<RespostasQ12>({});
  const [respostasGptw, setRespostasGptw] = useState<RespostasGPTW>({});
  const [resultado, setResultado] = useState<Record<string, unknown> | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  useEffect(() => {
    async function carregarPesquisa() {
      const { data } = await supabase
        .from("pesquisas")
        .select("id, tipo, respondente_nome")
        .eq("token", token)
        .single();

      if (!data) { setFase("erro"); return; }
      if (data.respondente_nome) { setFase("concluido"); return; }
      setTipo(data.tipo as TipoPesquisa);
      setPesquisaId(data.id);
    }
    carregarPesquisa();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PDF automático ao concluir
  useEffect(() => {
    if (fase !== "concluido" || !pesquisaId) return;
    setGerandoPdf(true);
    fetch("/api/pesquisa/gerar-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pesquisaId }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.pdfUrl) setPdfUrl(d.pdfUrl); })
      .catch(() => {})
      .finally(() => setGerandoPdf(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, pesquisaId]);

  function iniciar() {
    if (!nome.trim() || !email.trim()) { setErro("Nome e e-mail são obrigatórios."); return; }
    setErro("");
    setFase("perguntas");
  }

  async function finalizar() {
    if (!tipo || !pesquisaId) return;
    setSalvando(true);

    let res: Record<string, unknown> = {};
    let respostasPayload: unknown = {};

    if (tipo === "disc") {
      const r = calcularDISC(respostasDisc);
      res = r as unknown as Record<string, unknown>;
      respostasPayload = respostasDisc;
    } else if (tipo === "q12") {
      const r = calcularQ12(respostasQ12);
      res = r as unknown as Record<string, unknown>;
      respostasPayload = respostasQ12;
    } else {
      const r = calcularGPTW(respostasGptw);
      res = r as unknown as Record<string, unknown>;
      respostasPayload = respostasGptw;
    }

    await supabase.from("pesquisas").update({
      respondente_nome: nome,
      respondente_email: email,
      respondente_cargo: cargo,
      respondente_empresa: empresa || null,
      categoria: categoria || null,
      segmento: segmento || null,
      faturamento_faixa: faturamento || null,
      respostas: respostasPayload,
      resultado: res,
      concluido_em: new Date().toISOString(),
    }).eq("id", pesquisaId);

    // CRM lead capture
    fetch("/api/pesquisa/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome, email,
        empresa: empresa || null,
        cargo: cargo || null,
        tipo,
        observacoes: `Pesquisa ${tipo?.toUpperCase()} concluída. Score: ${
          tipo === "disc"
            ? `Perfil ${(res as Record<string, unknown>).perfilDominante}`
            : tipo === "q12"
            ? `${(res as Record<string, unknown>).percentual}%`
            : `Trust Index ${(res as Record<string, unknown>).trustIndex}%`
        }`,
        whatsapp: whatsapp || null,
        instagram: instagram || null,
      }),
    }).catch(() => {});

    setResultado(res);
    setSalvando(false);
    setFase("concluido");
  }

  // ── TELAS FIXAS ───────────────────────────────────────────

  if (fase === "erro") {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-gold mb-2">Link inválido</h1>
          <p className="text-gold/60">Este link de pesquisa não existe ou já expirou.</p>
        </div>
      </div>
    );
  }

  if (fase === "identificacao") {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-gold">Mendonça & Co</h1>
            {tipo && <p className="text-gold/60 mt-1 text-sm">{TITULOS[tipo]}</p>}
          </div>
          <div className="bg-surface rounded-card p-8 shadow-lg">
            <h2 className="font-display text-2xl font-semibold text-text-main mb-2">Antes de começar</h2>
            {tipo && (
              <p className="text-text-muted text-sm mb-6">{SUBTITULOS[tipo]}. Responda com honestidade — não há respostas certas ou erradas.</p>
            )}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome completo *</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Empresa</Label>
                <Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nome da empresa" />
              </div>
              <div className="space-y-1.5">
                <Label>Cargo</Label>
                <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="CEO, Gerente..." />
              </div>
              <SetorSelects
                categoria={categoria} segmento={segmento} faturamento={faturamento}
                onCategoria={setCategoria} onSegmento={setSegmento} onFaturamento={setFaturamento}
              />
              <div className="space-y-1.5">
                <Label>WhatsApp</Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+55 (11) 99999-9999" />
              </div>
              <div className="space-y-1.5">
                <Label>Instagram</Label>
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@seuperfil" />
              </div>
              {erro && <p className="text-sm text-danger">{erro}</p>}
              <Button className="w-full mt-2" onClick={iniciar} disabled={!tipo}>
                Iniciar Pesquisa →
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (fase === "concluido") {
    return (
      <div className="min-h-screen bg-primary py-8 px-4">
        <div className="w-full max-w-xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-gold">Mendonça & Co</h1>
          </div>

          <div className="space-y-5">
            {/* Header */}
            <div className="bg-surface rounded-card p-6 text-center shadow-lg">
              <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-bold text-text-main mb-1">
                {tipo === "disc" ? "Perfil DISC concluído!" : tipo === "q12" ? "Q12 concluído!" : "GPTW concluído!"}
              </h2>
              <p className="text-text-muted text-sm">
                {nome ? <>Obrigado, <strong>{nome}</strong>. Aqui está seu resultado.</> : "Suas respostas foram registradas."}
              </p>
            </div>

            {/* Cards de resultado por tipo */}
            {resultado && tipo === "disc" && <ResultadoDISCCard resultado={resultado} />}
            {resultado && tipo === "q12" && (
              <>
                <ResultadoQ12Card resultado={resultado} />
                <BenchmarkComparacao
                  tipo="q12" metrica="percentual_geral"
                  valorAtual={resultado.percentual as number}
                  categoria={categoria || null} segmento={segmento || null} porte={faturamento || null}
                  label="Índice de Engajamento"
                />
              </>
            )}
            {resultado && tipo === "gptw" && (
              <>
                <ResultadoGPTWCard resultado={resultado} />
                <BenchmarkComparacao
                  tipo="gptw" metrica="trust_index"
                  valorAtual={resultado.trustIndex as number}
                  categoria={categoria || null} segmento={segmento || null} porte={faturamento || null}
                  label="Trust Index"
                />
              </>
            )}

            {/* PDF */}
            {(gerandoPdf || pdfUrl) && (
              <div className="bg-surface rounded-card p-4 shadow-lg text-center">
                {gerandoPdf ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    <p className="text-gold/60 text-sm">Gerando seu PDF...</p>
                  </div>
                ) : pdfUrl ? (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 rounded-btn bg-gold/10 text-gold text-sm font-medium hover:bg-gold/20 transition-all">
                    Baixar PDF da Pesquisa
                  </a>
                ) : null}
              </div>
            )}

            {/* CTA */}
            <div className="bg-surface rounded-card p-5 shadow-lg text-center">
              <p className="text-text-muted text-sm leading-relaxed">
                Nossa equipe vai entrar em contato com uma análise detalhada e recomendações personalizadas para o seu contexto.
              </p>
              <p className="text-gold text-xs font-medium mt-2">guilherme@mendonca.co</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── STEPPER ───────────────────────────────────────────────

  if (tipo === "disc") return <StepperDISC atual={atual} setAtual={setAtual} respostas={respostasDisc} setRespostas={setRespostasDisc} onFinalizar={finalizar} salvando={salvando} />;
  if (tipo === "q12") return <StepperQ12 atual={atual} setAtual={setAtual} respostas={respostasQ12} setRespostas={setRespostasQ12} onFinalizar={finalizar} salvando={salvando} />;
  if (tipo === "gptw") return <StepperGPTW atual={atual} setAtual={setAtual} respostas={respostasGptw} setRespostas={setRespostasGptw} onFinalizar={finalizar} salvando={salvando} />;
  return null;
}

// ─────────────────────────────────────────────────────────────
// DISC STEPPER
// ─────────────────────────────────────────────────────────────

function StepperDISC({ atual, setAtual, respostas, setRespostas, onFinalizar, salvando }: {
  atual: number; setAtual: (n: number) => void;
  respostas: RespostasDISC; setRespostas: (r: RespostasDISC) => void;
  onFinalizar: () => void; salvando: boolean;
}) {
  const grupo = GRUPOS_DISC[atual];
  const total = GRUPOS_DISC.length;
  const resp = respostas[grupo.id];

  function selecionarMais(fator: FatorDISC) {
    const atual_resp = respostas[grupo.id];
    if (atual_resp?.menos === fator) return; // não pode ser o mesmo
    setRespostas({ ...respostas, [grupo.id]: { ...atual_resp, mais: fator } });
  }

  function selecionarMenos(fator: FatorDISC) {
    const atual_resp = respostas[grupo.id];
    if (atual_resp?.mais === fator) return; // não pode ser o mesmo
    setRespostas({ ...respostas, [grupo.id]: { ...atual_resp, menos: fator } });
  }

  const podeAvancar = resp?.mais !== undefined && resp?.menos !== undefined && resp.mais !== resp.menos;

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <div className="px-4 py-4 border-b border-gold/10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="font-display text-lg font-bold text-gold">Perfil DISC</h1>
          <span className="text-gold/60 text-sm font-mono-data">{atual + 1}/{total}</span>
        </div>
        <div className="max-w-2xl mx-auto mt-3">
          <div className="w-full bg-gold/10 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-gold transition-all duration-300" style={{ width: `${((atual + 1) / total) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <p className="text-gold/60 text-center text-sm mb-8">
            Grupo {atual + 1} de {total} — escolha <strong className="text-gold">uma</strong> palavra que mais descreve você e <strong className="text-gold">uma</strong> que menos descreve.
          </p>

          <div className="grid grid-cols-2 gap-6 mb-10">
            {/* Mais */}
            <div>
              <p className="text-gold text-xs font-medium uppercase tracking-wider text-center mb-3">Mais me descreve</p>
              <div className="space-y-2">
                {grupo.opcoes.map((op) => (
                  <button
                    key={op.fator + "mais"}
                    onClick={() => selecionarMais(op.fator)}
                    disabled={resp?.menos === op.fator}
                    className={`w-full py-3 px-4 rounded-btn text-sm font-medium transition-all text-left ${
                      resp?.mais === op.fator
                        ? "text-primary font-semibold scale-105 shadow-lg"
                        : resp?.menos === op.fator
                        ? "bg-gold/5 text-gold/20 cursor-not-allowed"
                        : "bg-gold/10 text-gold/80 hover:bg-gold/20 hover:text-gold"
                    }`}
                    style={resp?.mais === op.fator ? { backgroundColor: CORES_DISC[op.fator] } : {}}
                  >
                    {op.texto}
                  </button>
                ))}
              </div>
            </div>
            {/* Menos */}
            <div>
              <p className="text-gold text-xs font-medium uppercase tracking-wider text-center mb-3">Menos me descreve</p>
              <div className="space-y-2">
                {grupo.opcoes.map((op) => (
                  <button
                    key={op.fator + "menos"}
                    onClick={() => selecionarMenos(op.fator)}
                    disabled={resp?.mais === op.fator}
                    className={`w-full py-3 px-4 rounded-btn text-sm font-medium transition-all text-left ${
                      resp?.menos === op.fator
                        ? "bg-gold/20 text-gold border border-gold"
                        : resp?.mais === op.fator
                        ? "bg-gold/5 text-gold/20 cursor-not-allowed"
                        : "bg-gold/10 text-gold/80 hover:bg-gold/20 hover:text-gold"
                    }`}
                  >
                    {op.texto}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Button variant="secondary" onClick={() => setAtual(atual - 1)} disabled={atual === 0} className="border-gold/30 text-gold/70 hover:text-gold hover:border-gold">
              <ChevronLeft size={16} /> Voltar
            </Button>
            <Button onClick={atual === total - 1 ? onFinalizar : () => setAtual(atual + 1)} disabled={!podeAvancar || salvando} className="min-w-32">
              {salvando ? "Salvando..." : atual === total - 1 ? "Concluir" : "Próximo"}
              {!salvando && atual < total - 1 && <ChevronRight size={16} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Q12 STEPPER
// ─────────────────────────────────────────────────────────────

const Q12_DIMS = [
  { dim: "Necessidades Básicas", cor: "#C0392B" },
  { dim: "Suporte Individual", cor: "#C9A84C" },
  { dim: "Trabalho em Equipe", cor: "#2980B9" },
  { dim: "Crescimento", cor: "#27AE60" },
] as const;

function StepperQ12({ atual, setAtual, respostas, setRespostas, onFinalizar, salvando }: {
  atual: number; setAtual: (n: number) => void;
  respostas: RespostasQ12; setRespostas: (r: RespostasQ12) => void;
  onFinalizar: () => void; salvando: boolean;
}) {
  const pergunta = PERGUNTAS_Q12[atual];
  const total = PERGUNTAS_Q12.length;
  const resp = respostas[pergunta.id];
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dimAtual = pergunta.dimensao;

  function selecionar(valor: number) {
    setRespostas({ ...respostas, [pergunta.id]: valor });
    if (atual < total - 1) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setAtual(atual + 1), 380);
    }
  }

  function voltar() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setAtual(atual - 1);
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <div className="px-4 py-4 border-b border-gold/10">
        <div className="max-w-2xl mx-auto flex items-center justify-between mb-3">
          <h1 className="font-display text-lg font-bold text-gold">Pesquisa Q12</h1>
          <span className="text-gold/60 text-sm font-mono-data">{atual + 1}/{total}</span>
        </div>
        <div className="max-w-2xl mx-auto flex gap-2">
          {Q12_DIMS.map(({ dim, cor }) => {
            const pergs = PERGUNTAS_Q12.filter((p) => p.dimensao === dim);
            const isAtivo = dimAtual === dim;
            return (
              <div key={dim} className="flex-1">
                <p className={`text-[9px] mb-1 truncate ${isAtivo ? "text-gold" : "text-gold/30"}`}>{dim.split(" ")[0]}</p>
                <div className="flex flex-col gap-0.5">
                  {pergs.map((p) => (
                    <div key={p.id} className="h-1.5 rounded-full transition-all"
                      style={{ backgroundColor: respostas[p.id] !== undefined ? cor : cor + "25" }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <p className="text-gold/50 text-xs uppercase tracking-wider text-center mb-4">{pergunta.dimensao}</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-gold text-center mb-10 leading-snug">
            {pergunta.texto}
          </h2>

          <div className="flex flex-col gap-2 mb-10">
            {ESCALA_Q12.map((e) => (
              <button
                key={e.valor}
                onClick={() => selecionar(e.valor)}
                className={`w-full py-3 px-6 rounded-btn text-sm font-medium transition-all flex items-center gap-4 ${
                  resp === e.valor
                    ? "bg-gold text-primary font-semibold"
                    : "bg-gold/10 text-gold/70 hover:bg-gold/20 hover:text-gold"
                }`}
              >
                <span className="font-mono-data w-4 text-center">{e.valor}</span>
                <span>{e.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4">
            <Button variant="secondary" onClick={voltar} disabled={atual === 0} className="border-gold/30 text-gold/70 hover:text-gold hover:border-gold">
              <ChevronLeft size={16} /> Voltar
            </Button>
            <Button onClick={atual === total - 1 ? onFinalizar : () => setAtual(atual + 1)} disabled={resp === undefined || salvando} className="min-w-32">
              {salvando ? "Salvando..." : atual === total - 1 ? "Concluir" : "Próxima"}
              {!salvando && atual < total - 1 && <ChevronRight size={16} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GPTW STEPPER
// ─────────────────────────────────────────────────────────────

const GPTW_DIMS_CORES: Record<string, string> = {
  "Credibilidade": "#0D2B2E",
  "Respeito": "#2980B9",
  "Imparcialidade": "#8E44AD",
  "Orgulho": "#C9A84C",
  "Camaradagem": "#27AE60",
};

function StepperGPTW({ atual, setAtual, respostas, setRespostas, onFinalizar, salvando }: {
  atual: number; setAtual: (n: number) => void;
  respostas: RespostasGPTW; setRespostas: (r: RespostasGPTW) => void;
  onFinalizar: () => void; salvando: boolean;
}) {
  const afirmacao = AFIRMACOES_GPTW[atual];
  const total = AFIRMACOES_GPTW.length;
  const resp = respostas[afirmacao.id];
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dimAtual = afirmacao.dimensao;
  const gptwDims = Object.keys(GPTW_DIMS_CORES);

  function selecionar(valor: number) {
    setRespostas({ ...respostas, [afirmacao.id]: valor });
    if (atual < total - 1) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setAtual(atual + 1), 380);
    }
  }

  function voltar() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setAtual(atual - 1);
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <div className="px-4 py-4 border-b border-gold/10">
        <div className="max-w-2xl mx-auto flex items-center justify-between mb-3">
          <h1 className="font-display text-lg font-bold text-gold">Trust Index — GPTW</h1>
          <span className="text-gold/60 text-sm font-mono-data">{atual + 1}/{total}</span>
        </div>
        <div className="max-w-2xl mx-auto flex gap-2">
          {gptwDims.map((dim) => {
            const cor = GPTW_DIMS_CORES[dim];
            const pergs = AFIRMACOES_GPTW.filter((a) => a.dimensao === dim);
            const isAtivo = dimAtual === dim;
            return (
              <div key={dim} className="flex-1">
                <p className={`text-[9px] mb-1 truncate ${isAtivo ? "text-gold" : "text-gold/30"}`}>{dim}</p>
                <div className="flex flex-col gap-0.5">
                  {pergs.map((a) => (
                    <div key={a.id} className="h-1 rounded-full transition-all"
                      style={{ backgroundColor: respostas[a.id] !== undefined ? cor : cor + "25" }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <p className="text-gold/50 text-xs uppercase tracking-wider text-center mb-4">{afirmacao.dimensao}</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-gold text-center mb-10 leading-snug">
            {afirmacao.texto}
          </h2>

          <div className="flex flex-col gap-2 mb-10">
            {ESCALA_GPTW.map((e) => (
              <button
                key={e.valor}
                onClick={() => selecionar(e.valor)}
                className={`w-full py-3 px-6 rounded-btn text-sm font-medium transition-all flex items-center gap-4 ${
                  resp === e.valor
                    ? "bg-gold text-primary font-semibold"
                    : "bg-gold/10 text-gold/70 hover:bg-gold/20 hover:text-gold"
                }`}
              >
                <span className="font-mono-data w-4 text-center">{e.valor}</span>
                <span>{e.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4">
            <Button variant="secondary" onClick={voltar} disabled={atual === 0} className="border-gold/30 text-gold/70 hover:text-gold hover:border-gold">
              <ChevronLeft size={16} /> Voltar
            </Button>
            <Button onClick={atual === total - 1 ? onFinalizar : () => setAtual(atual + 1)} disabled={resp === undefined || salvando} className="min-w-32">
              {salvando ? "Salvando..." : atual === total - 1 ? "Concluir" : "Próxima"}
              {!salvando && atual < total - 1 && <ChevronRight size={16} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CARDS DE RESULTADO
// ─────────────────────────────────────────────────────────────

const DISC_INFO: Record<FatorDISC, { label: string; descricao: string; forcas: string[]; atencao: string; lideranca: string }> = {
  D: {
    label: "Dominância",
    descricao: "Orientado a resultados, direto e decisivo. Age com rapidez, gosta de desafios e assume o controle. Não tem medo de tomar decisões difíceis.",
    forcas: ["Foco em resultados", "Tomada de decisão rápida", "Alta energia para superar obstáculos"],
    atencao: "Pode parecer impaciente ou pouco empático. Lembre-se de ouvir antes de decidir.",
    lideranca: "Você lidera pelo resultado. Seu time precisa entender o porquê das metas — não só o o quê.",
  },
  I: {
    label: "Influência",
    descricao: "Comunicativo, otimista e entusiasta. Inspira pessoas com facilidade, cria conexões rápidas e motiva equipes com energia genuína.",
    forcas: ["Comunicação e persuasão", "Criação de engajamento", "Ambiente positivo e colaborativo"],
    atencao: "Pode prometer demais ou evitar conflitos necessários. Disciplina na execução é seu ponto de atenção.",
    lideranca: "Você lidera pela inspiração. Seu time precisa ver consistência entre o que você prega e o que você faz.",
  },
  S: {
    label: "Estabilidade",
    descricao: "Paciente, leal e confiável. Cria ambientes harmoniosos, é consistente na entrega e constrói relacionamentos duradouros.",
    forcas: ["Confiabilidade e constância", "Escuta ativa e empatia", "Estabilidade em momentos de crise"],
    atencao: "Pode resistir a mudanças necessárias. Desenvolver assertividade é essencial para liderar crescimento.",
    lideranca: "Você lidera pelo exemplo silencioso. Seu time precisa que você tome posição quando necessário.",
  },
  C: {
    label: "Conformidade",
    descricao: "Analítico, preciso e sistemático. Toma decisões baseadas em dados, garante qualidade e cria processos que sustentam o crescimento.",
    forcas: ["Análise e precisão", "Planejamento detalhado", "Controle de qualidade rigoroso"],
    atencao: "Pode paralisar por excesso de análise. Decisões boas tomadas rápido valem mais que decisões perfeitas tomadas tarde.",
    lideranca: "Você lidera pela competência. Seu time precisa de clareza e previsibilidade — e você entrega isso naturalmente.",
  },
};

function ResultadoDISCCard({ resultado }: { resultado: Record<string, unknown> }) {
  const percentual = resultado.percentual as Record<FatorDISC, number>;
  const perfilDominante = resultado.perfilDominante as FatorDISC;
  const info = DISC_INFO[perfilDominante];

  return (
    <div className="space-y-4">
      {/* Perfil dominante */}
      <div className="bg-surface rounded-card p-6 shadow-lg" style={{ borderLeft: `4px solid ${CORES_DISC[perfilDominante]}` }}>
        <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Perfil Dominante</p>
        <p className="font-display text-2xl font-bold mb-2" style={{ color: CORES_DISC[perfilDominante] }}>
          {perfilDominante} — {info.label}
        </p>
        <p className="text-text-main text-sm leading-relaxed">{info.descricao}</p>
      </div>

      {/* Gráfico de barras */}
      <div className="bg-surface rounded-card p-5 shadow-lg">
        <p className="text-text-muted text-xs uppercase tracking-wide mb-4">Distribuição DISC</p>
        <div className="space-y-3">
          {(["D", "I", "S", "C"] as FatorDISC[]).map((f) => (
            <div key={f}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono-data text-sm font-bold" style={{ color: CORES_DISC[f] }}>{f}</span>
                  <span className="text-xs text-text-muted">{DISC_INFO[f].label}</span>
                  {f === perfilDominante && <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: CORES_DISC[f] + "20", color: CORES_DISC[f] }}>Dominante</span>}
                </div>
                <span className="font-mono-data text-sm font-bold text-text-main">{percentual?.[f] ?? 0}%</span>
              </div>
              <div className="w-full bg-gold/10 rounded-full h-2.5">
                <div className="h-2.5 rounded-full transition-all" style={{ width: `${percentual?.[f] ?? 0}%`, backgroundColor: CORES_DISC[f] }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forças e liderança */}
      <div className="bg-surface rounded-card p-5 shadow-lg">
        <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Seus pontos fortes como líder</p>
        <div className="space-y-2 mb-4">
          {info.forcas.map((f, i) => (
            <div key={i} className="flex gap-2">
              <span style={{ color: CORES_DISC[perfilDominante] }} className="text-sm font-bold">▸</span>
              <span className="text-text-main text-sm">{f}</span>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-btn" style={{ backgroundColor: CORES_DISC[perfilDominante] + "12", border: `1px solid ${CORES_DISC[perfilDominante]}30` }}>
          <p className="text-xs font-semibold mb-1" style={{ color: CORES_DISC[perfilDominante] }}>Ponto de atenção</p>
          <p className="text-text-muted text-sm">{info.atencao}</p>
        </div>
      </div>

      {/* Liderança */}
      <div className="bg-surface rounded-card p-5 shadow-lg">
        <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Como você lidera</p>
        <p className="text-text-main text-sm leading-relaxed">{info.lideranca}</p>
      </div>
    </div>
  );
}

const PIRAMIDE_Q12 = [
  { dim: "Crescimento",        cor: "#2D6A4F", nivel: 4, desc: "Aprendizado e desenvolvimento" },
  { dim: "Trabalho em Equipe", cor: "#2980B9", nivel: 3, desc: "Pertencimento e propósito" },
  { dim: "Suporte Individual", cor: "#C9A84C", nivel: 2, desc: "Reconhecimento e suporte" },
  { dim: "Necessidades Básicas", cor: "#C0392B", nivel: 1, desc: "Clareza e recursos" },
];

// Layers ordered bottom→top for SVG rendering (bottom = widest = nivel 1)
const PIRAMIDE_LAYERS = [
  {
    dim: "Necessidades Básicas", cor: "#C0392B", nivel: 1,
    desc: "Clareza e recursos",
    alerta: "Esta é a base de tudo — sem clareza de papel e recursos adequados, nenhum outro esforço de engajamento funciona. O que cada pessoa do seu time sabe exatamente que precisa entregar? Elas têm o que precisam para fazer isso bem feito?",
  },
  {
    dim: "Suporte Individual", cor: "#C9A84C", nivel: 2,
    desc: "Reconhecimento e suporte",
    alerta: "Seu time sente que alguém se importa com eles como pessoas — não só como entregadores de resultado. Fortalecer esse nível sustenta todos os andares acima. Com que frequência você tem conversas individuais estruturadas com cada pessoa? Quando foi a última vez que reconheceu alguém pelo que ele fez, não pelo que entregou?",
  },
  {
    dim: "Trabalho em Equipe", cor: "#2980B9", nivel: 3,
    desc: "Pertencimento e propósito",
    alerta: "O time ainda não sente que tem um melhor amigo no trabalho ou que sua opinião conta de verdade. Isso corrói o senso de pertencimento silenciosamente. O que você pode mudar na dinâmica das reuniões para que mais vozes sejam ouvidas? Existe espaço seguro para discordar?",
  },
  {
    dim: "Crescimento", cor: "#2D6A4F", nivel: 4,
    desc: "Aprendizado e desenvolvimento",
    alerta: "As pessoas do seu time não enxergam com clareza para onde estão crescendo — e isso acelera a saída dos melhores talentos. Você tem conversas regulares sobre desenvolvimento individual, não apenas sobre metas? Cada pessoa sabe qual é o próximo passo da sua carreira dentro da empresa?",
  },
];

function PiramideQ12SVG({ porDimensao }: { porDimensao: Record<string, number> }) {
  // SVG dimensions
  const W = 320, H = 260;
  const tipX = W / 2, tipY = 12;
  const baseY = H - 8;
  const baseLeft = 10, baseRight = W - 10;
  const nLayers = 4;
  const layerH = (baseY - tipY) / nLayers;

  // Y boundaries: y0=tip, y4=base
  const ys = Array.from({ length: nLayers + 1 }, (_, i) => tipY + i * layerH);

  // X boundaries at each y: interpolate from tip to base
  function xAt(y: number): { left: number; right: number } {
    const t = (y - tipY) / (baseY - tipY);
    return {
      left:  tipX + (baseLeft  - tipX) * t,
      right: tipX + (baseRight - tipX) * t,
    };
  }

  // Weakest layer (lowest score, 1-5 scale)
  const scores = PIRAMIDE_LAYERS.map(l => ({ ...l, score: porDimensao[l.dim] ?? 1 }));
  const weakest = scores.reduce((a, b) => a.score < b.score ? a : b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="max-w-sm mx-auto">
      {scores.map((layer, i) => {
        // i=0 is bottom (Necessidades Básicas), i=3 is top (Crescimento)
        const svgI = nLayers - 1 - i; // flip: bottom layer → last svgIndex
        const y1 = ys[svgI];
        const y2 = ys[svgI + 1];
        const top1 = xAt(y1);
        const top2 = xAt(y2);
        const points =
          svgI === 0
            ? `${tipX},${y1} ${top2.left},${y2} ${top2.right},${y2}` // triangle at top
            : `${top1.left},${y1} ${top1.right},${y1} ${top2.right},${y2} ${top2.left},${y2}`;
        const Tag = svgI === 0 ? "polygon" : "polygon";
        const pct = Math.round(((layer.score - 1) / 4) * 100);
        const isWeakest = layer.dim === weakest.dim;
        const cY = (y1 + y2) / 2;
        const cX = W / 2;
        const fillOpacity = 0.25 + (pct / 100) * 0.55; // 0.25 (empty) → 0.80 (full)

        return (
          <g key={layer.dim}>
            {/* Layer fill */}
            <Tag
              points={points}
              fill={layer.cor}
              fillOpacity={fillOpacity}
              stroke="white"
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />
            {/* Weakest layer highlight */}
            {isWeakest && (
              <Tag
                points={points}
                fill="none"
                stroke={layer.cor}
                strokeWidth="2.5"
                strokeDasharray="5 3"
                strokeOpacity="0.9"
              />
            )}
            {/* Label */}
            <text x={cX} y={cY - (svgI === 0 ? 6 : 8)} textAnchor="middle" fill="white" fontSize={svgI === 0 ? 9 : 11} fontWeight="600" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
              {layer.dim}
            </text>
            {/* Score */}
            <text x={cX} y={cY + (svgI === 0 ? 6 : 8)} textAnchor="middle" fill="white" fontSize={svgI === 0 ? 9 : 12} fontWeight="700" opacity="0.9">
              {pct}%
            </text>
            {/* Weakest badge */}
            {isWeakest && svgI > 0 && (
              <text x={cX + 48} y={cY + 5} textAnchor="middle" fill={layer.cor} fontSize="10" fontWeight="700">⚠</text>
            )}
          </g>
        );
      })}
      {/* Side labels */}
      {scores.map((layer, i) => {
        const svgI = nLayers - 1 - i;
        const y1 = ys[svgI], y2 = ys[svgI + 1];
        const cY = (y1 + y2) / 2;
        const edge = xAt(cY);
        return (
          <text key={`desc-${layer.dim}`} x={edge.left - 4} y={cY + 3} textAnchor="end" fill={layer.cor} fontSize="8" opacity="0.8">
            {layer.desc}
          </text>
        );
      })}
    </svg>
  );
}

function ResultadoQ12Card({ resultado }: { resultado: Record<string, unknown> }) {
  const percentual = resultado.percentual as number;
  const nivel = resultado.nivel as string;
  const cor = resultado.cor as string;
  const porDimensao = resultado.porDimensao as Record<string, number> | undefined;

  const scores = porDimensao
    ? PIRAMIDE_LAYERS.map(l => ({ ...l, score: porDimensao[l.dim] ?? 1 }))
    : [];
  const weakest = scores.length ? scores.reduce((a, b) => a.score < b.score ? a : b) : null;

  return (
    <div className="space-y-4">
      {/* Score geral */}
      <div className="bg-bg rounded-card p-6 text-center">
        <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Índice de Engajamento</p>
        <p className="font-mono-data text-5xl font-bold text-text-main mb-1">{percentual}<span className="text-xl text-text-muted font-normal">%</span></p>
        <span className="text-sm font-medium" style={{ color: cor }}>{nivel}</span>
      </div>

      {/* Pirâmide SVG */}
      {porDimensao && (
        <div className="bg-bg rounded-card p-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1 text-center">Pirâmide de Engajamento Gallup Q12</p>
          <p className="text-text-muted/60 text-[10px] text-center mb-4">Do topo (Crescimento) à base (Necessidades Básicas)</p>
          <PiramideQ12SVG porDimensao={porDimensao} />
          {weakest && (
            <div className="mt-4 p-4 rounded-btn text-left" style={{ backgroundColor: weakest.cor + "12", border: `1px solid ${weakest.cor}40` }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: weakest.cor }}>
                ⚠ Prioridade: {weakest.dim}
              </p>
              <p className="text-[12px] text-text-main leading-relaxed">{weakest.alerta}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const GPTW_PLANOS: Record<string, { diagnostico: string; acoes: string[] }> = {
  Credibilidade: {
    diagnostico: "Seu time não sente que os líderes comunicam com clareza, cumprem promessas ou têm competência para conduzir o negócio.",
    acoes: [
      "Compartilhe semanalmente com o time o que está acontecendo na empresa — boas e más notícias.",
      "Liste 3 compromissos que você assumiu e ainda não cumpriu — resolva-os esta semana.",
      "Peça feedback direto: 'O que eu poderia fazer diferente como líder?'",
    ],
  },
  Respeito: {
    diagnostico: "O time sente falta de reconhecimento, suporte e interesse genuíno dos líderes nas pessoas.",
    acoes: [
      "Reconheça publicamente 1 pessoa por semana — pelo esforço, não só pelo resultado.",
      "Pergunte a cada liderado: 'O que você precisa que não está tendo para fazer seu trabalho melhor?'",
      "Revise se todos têm os recursos necessários (ferramentas, tempo, clareza) para entregar bem.",
    ],
  },
  Imparcialidade: {
    diagnostico: "Há percepção de favoritismo, promoções injustas ou falta de equidade na empresa.",
    acoes: [
      "Documente os critérios de promoção e reconhecimento — e comunique ao time.",
      "Crie um canal seguro para reportar tratamento injusto (pode ser anônimo).",
      "Revise os salários e benefícios: há discrepâncias injustificadas para funções equivalentes?",
    ],
  },
  Orgulho: {
    diagnostico: "As pessoas não sentem que fazem diferença ou que o trabalho tem um significado maior.",
    acoes: [
      "Conecte o trabalho do time ao impacto real: mostre exemplos de clientes ou resultados gerados.",
      "Celebre conquistas — mesmo as pequenas — em reunião de equipe.",
      "Compartilhe a visão da empresa com mais frequência: para onde estamos indo e por quê importa.",
    ],
  },
  Camaradagem: {
    diagnostico: "O time não sente um clima de colaboração, confiança ou senso de comunidade.",
    acoes: [
      "Crie 1 momento de conexão não-profissional por mês (almoço, happy hour, dinâmica simples).",
      "Quebre silos: promova projetos ou reuniões entre áreas diferentes.",
      "Incentive que pessoas se ajudem: reconheça publicamente quem coopera além do esperado.",
    ],
  },
};

function ResultadoGPTWCard({ resultado }: { resultado: Record<string, unknown> }) {
  const trustIndex = resultado.trustIndex as number;
  const nivel = resultado.nivel as string;
  const cor = resultado.cor as string;
  const porDimensao = resultado.porDimensao as Record<string, number> | undefined;

  const dims = ["Credibilidade", "Respeito", "Imparcialidade", "Orgulho", "Camaradagem"];
  const CORES_GPTW: Record<string, string> = {
    Credibilidade: "#0D2B2E", Respeito: "#2980B9", Imparcialidade: "#8E44AD",
    Orgulho: "#C9A84C", Camaradagem: "#27AE60",
  };

  const ordenadas = porDimensao
    ? [...dims].sort((a, b) => (porDimensao[a] ?? 0) - (porDimensao[b] ?? 0))
    : [];
  const [primaria, secundaria] = ordenadas;

  return (
    <div className="space-y-4">
      {/* Trust Index */}
      <div className="bg-surface rounded-card p-6 shadow-lg text-center">
        <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Trust Index — GPTW</p>
        <div className="flex items-end justify-center gap-2 mb-2">
          <p className="font-mono-data text-6xl font-bold text-text-main">{trustIndex}</p>
          <p className="text-text-muted text-xl mb-2">%</p>
        </div>
        <p className="text-sm font-medium" style={{ color: cor }}>{nivel}</p>
      </div>

      {/* Barras por dimensão */}
      {porDimensao && (
        <div className="bg-surface rounded-card p-5 shadow-lg">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-4">As 5 Dimensões GPTW</p>
          <div className="space-y-3">
            {dims.map((dim) => {
              const score = porDimensao[dim] ?? 0;
              const cor = CORES_GPTW[dim];
              const isPrimaria = dim === primaria;
              const isSecundaria = dim === secundaria;
              return (
                <div key={dim}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-text-main">{dim}</span>
                      {isPrimaria && <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: cor + "20", color: cor }}>Prioridade 1</span>}
                      {isSecundaria && <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: cor + "20", color: cor }}>Prioridade 2</span>}
                    </div>
                    <span className="font-mono-data text-sm font-bold text-text-main">{score}%</span>
                  </div>
                  <div className="w-full bg-gold/10 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: isPrimaria || isSecundaria ? cor : cor + "80" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plano Primário */}
      {primaria && GPTW_PLANOS[primaria] && (
        <div className="bg-surface rounded-card p-6 shadow-lg" style={{ borderLeft: `4px solid ${CORES_GPTW[primaria]}` }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: CORES_GPTW[primaria] }}>
            Plano de Ação Primário — {primaria}
          </p>
          <p className="text-text-muted text-sm leading-relaxed mb-4">{GPTW_PLANOS[primaria].diagnostico}</p>
          <p className="text-text-main text-xs font-semibold uppercase tracking-wide mb-3">O que fazer agora:</p>
          <div className="space-y-3">
            {GPTW_PLANOS[primaria].acoes.map((acao, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5" style={{ backgroundColor: CORES_GPTW[primaria] }}>
                  {i + 1}
                </div>
                <p className="text-text-main text-sm leading-relaxed">{acao}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plano Secundário */}
      {secundaria && GPTW_PLANOS[secundaria] && (
        <div className="bg-surface rounded-card p-5 shadow-lg" style={{ borderLeft: `4px solid ${CORES_GPTW[secundaria]}80` }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: CORES_GPTW[secundaria] }}>
            Plano de Ação Secundário — {secundaria}
          </p>
          <p className="text-text-muted text-sm leading-relaxed mb-3">{GPTW_PLANOS[secundaria].diagnostico}</p>
          <div className="space-y-2">
            {GPTW_PLANOS[secundaria].acoes.map((acao, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5" style={{ backgroundColor: CORES_GPTW[secundaria] + "99" }}>
                  {i + 1}
                </div>
                <p className="text-text-muted text-sm leading-relaxed">{acao}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
