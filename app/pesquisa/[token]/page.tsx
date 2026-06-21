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
  const [erro, setErro] = useState("");
  const [atual, setAtual] = useState(0);
  const [salvando, setSalvando] = useState(false);

  // Respostas por tipo
  const [respostasDisc, setRespostasDisc] = useState<RespostasDISC>({});
  const [respostasQ12, setRespostasQ12] = useState<RespostasQ12>({});
  const [respostasGptw, setRespostasGptw] = useState<RespostasGPTW>({});
  const [resultado, setResultado] = useState<Record<string, unknown> | null>(null);

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
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-gold">Mendonça & Co</h1>
          </div>
          <div className="bg-surface rounded-card p-8 shadow-lg text-center">
            <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="font-display text-3xl font-bold text-text-main mb-2">Pesquisa concluída!</h2>
            <p className="text-text-muted text-sm mb-8">
              {nome ? <>Obrigado, <strong>{nome}</strong>. </> : ""}
              Suas respostas foram registradas com sucesso.
            </p>

            {/* Resultado resumido por tipo */}
            {resultado && tipo === "disc" && (
              <ResultadoDISCCard resultado={resultado} />
            )}
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

            <p className="text-text-muted text-sm mt-6">Em breve entraremos em contato com uma análise detalhada.</p>
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

function StepperQ12({ atual, setAtual, respostas, setRespostas, onFinalizar, salvando }: {
  atual: number; setAtual: (n: number) => void;
  respostas: RespostasQ12; setRespostas: (r: RespostasQ12) => void;
  onFinalizar: () => void; salvando: boolean;
}) {
  const pergunta = PERGUNTAS_Q12[atual];
  const total = PERGUNTAS_Q12.length;
  const resp = respostas[pergunta.id];
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        <div className="max-w-2xl mx-auto">
          <div className="w-full bg-gold/10 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-gold transition-all duration-300" style={{ width: `${((atual + 1) / total) * 100}%` }} />
          </div>
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

function StepperGPTW({ atual, setAtual, respostas, setRespostas, onFinalizar, salvando }: {
  atual: number; setAtual: (n: number) => void;
  respostas: RespostasGPTW; setRespostas: (r: RespostasGPTW) => void;
  onFinalizar: () => void; salvando: boolean;
}) {
  const afirmacao = AFIRMACOES_GPTW[atual];
  const total = AFIRMACOES_GPTW.length;
  const resp = respostas[afirmacao.id];
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        <div className="max-w-2xl mx-auto">
          <div className="w-full bg-gold/10 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-gold transition-all duration-300" style={{ width: `${((atual + 1) / total) * 100}%` }} />
          </div>
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

function ResultadoDISCCard({ resultado }: { resultado: Record<string, unknown> }) {
  const percentual = resultado.percentual as Record<FatorDISC, number>;
  const perfilDominante = resultado.perfilDominante as FatorDISC;
  const LABELS: Record<FatorDISC, string> = { D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade" };
  return (
    <div className="bg-bg rounded-card p-6 text-left">
      <p className="text-text-muted text-xs uppercase tracking-wide mb-4 text-center">Seu Perfil DISC</p>
      <div className="space-y-3">
        {(["D", "I", "S", "C"] as FatorDISC[]).map((f) => (
          <div key={f} className="flex items-center gap-3">
            <span className="font-mono-data text-sm font-bold w-4" style={{ color: CORES_DISC[f] }}>{f}</span>
            <div className="flex-1 bg-[#E8D5A3]/30 rounded-full h-2">
              <div className="h-2 rounded-full transition-all" style={{ width: `${percentual?.[f] ?? 0}%`, backgroundColor: CORES_DISC[f] }} />
            </div>
            <span className="text-xs text-text-muted w-10 text-right">{percentual?.[f] ?? 0}%</span>
            {f === perfilDominante && <span className="text-[10px] text-gold font-medium">{LABELS[f]}</span>}
          </div>
        ))}
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

function ResultadoQ12Card({ resultado }: { resultado: Record<string, unknown> }) {
  const percentual = resultado.percentual as number;
  const nivel = resultado.nivel as string;
  const cor = resultado.cor as string;
  const porDimensao = resultado.porDimensao as Record<string, number> | undefined;

  return (
    <div className="space-y-4">
      {/* Score geral */}
      <div className="bg-bg rounded-card p-6 text-center">
        <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Índice de Engajamento</p>
        <p className="font-mono-data text-5xl font-bold text-text-main mb-1">{percentual}<span className="text-xl text-text-muted font-normal">%</span></p>
        <span className="text-sm font-medium" style={{ color: cor }}>{nivel}</span>
      </div>

      {/* Pirâmide Q12 */}
      {porDimensao && (
        <div className="bg-bg rounded-card p-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-4 text-center">Pirâmide de Engajamento</p>
          <div className="space-y-2">
            {PIRAMIDE_Q12.map((camada, i) => {
              const score = porDimensao[camada.dim];
              const pct = score !== undefined ? Math.round(((score - 1) / 4) * 100) : 0;
              const largura = [50, 65, 80, 100][i]; // topo menor, base maior
              return (
                <div key={camada.dim} className="flex flex-col items-center gap-1">
                  <div style={{ width: `${largura}%` }}>
                    <div className="flex items-center justify-between mb-0.5 px-1">
                      <span className="text-[10px] font-medium" style={{ color: camada.cor }}>{camada.dim}</span>
                      {score !== undefined && (
                        <span className="text-[10px] font-mono-data text-text-muted">{pct}%</span>
                      )}
                    </div>
                    <div className="h-7 rounded-btn flex items-center px-2" style={{ backgroundColor: camada.cor + "20", border: `1px solid ${camada.cor}40` }}>
                      <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: camada.cor }} />
                    </div>
                    <p className="text-[9px] text-text-muted text-center mt-0.5">{camada.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-text-muted/60 text-center mt-3">
            Nível {PIRAMIDE_Q12.find(c => (porDimensao[c.dim] ?? 0) < 3)?.nivel ?? 4} — base a fortalecer primeiro
          </p>
        </div>
      )}
    </div>
  );
}

function ResultadoGPTWCard({ resultado }: { resultado: Record<string, unknown> }) {
  const trustIndex = resultado.trustIndex as number;
  const nivel = resultado.nivel as string;
  const cor = resultado.cor as string;
  return (
    <div className="bg-bg rounded-card p-6 text-center">
      <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Trust Index</p>
      <p className="font-mono-data text-5xl font-bold text-text-main mb-1">{trustIndex}<span className="text-xl text-text-muted font-normal">%</span></p>
      <span className="text-sm font-medium" style={{ color: cor }}>{nivel}</span>
    </div>
  );
}
