"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";


import { PERGUNTAS_Q12, calcularQ12, ESCALA_Q12, type RespostasQ12 } from "@/lib/pesquisas/q12";
import { AFIRMACOES_GPTW, calcularGPTW, ESCALA_GPTW, type RespostasGPTW } from "@/lib/pesquisas/gptw";

type Fase = "identificacao" | "perguntas" | "concluido" | "erro";
type TipoRodada = "q12" | "gptw";

const TITULOS: Record<TipoRodada, string> = {
  q12: "Pesquisa de Engajamento Q12",
  gptw: "Great Place To Work — Trust Index",
};

export default function RodadaPublicaPage() {
  const { token } = useParams<{ token: string }>();
  const supabase = createClient();

  const [fase, setFase] = useState<Fase>("identificacao");
  const [tipo, setTipo] = useState<TipoRodada | null>(null);
  const [rodadaId, setRodadaId] = useState<string | null>(null);
  const [nomeRodada, setNomeRodada] = useState("");
  const [rodadaCategoria, setRodadaCategoria] = useState<string | null>(null);
  const [rodadaSegmento, setRodadaSegmento] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState("");
  const [erro, setErro] = useState("");
  const [atual, setAtual] = useState(0);
  const [salvando, setSalvando] = useState(false);

  const [respostasQ12, setRespostasQ12] = useState<RespostasQ12>({});
  const [respostasGptw, setRespostasGptw] = useState<RespostasGPTW>({});

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from("rodadas")
        .select("id, tipo, nome, status, categoria, segmento")
        .eq("token", token)
        .single();

      if (!data) { setFase("erro"); return; }
      if (data.status === "encerrada") { setFase("erro"); return; }
      setTipo(data.tipo as TipoRodada);
      setRodadaId(data.id);
      setNomeRodada(data.nome);
      setRodadaCategoria(data.categoria ?? null);
      setRodadaSegmento(data.segmento ?? null);
    }
    carregar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function iniciar() {
    if (!nome.trim() || !email.trim()) { setErro("Nome e e-mail são obrigatórios."); return; }
    setErro("");
    setFase("perguntas");
  }

  const perguntas = tipo === "q12" ? PERGUNTAS_Q12 : AFIRMACOES_GPTW;
  const escala = tipo === "q12" ? ESCALA_Q12 : ESCALA_GPTW;
  const totalPerguntas = perguntas.length;
  const respostas = tipo === "q12" ? respostasQ12 : respostasGptw;
  const totalRespondidas = Object.keys(respostas).length;

  function setResposta(id: number, val: number) {
    if (tipo === "q12") setRespostasQ12((prev) => ({ ...prev, [id]: val }));
    else setRespostasGptw((prev) => ({ ...prev, [id]: val }));
  }

  async function finalizar() {
    if (!tipo || !rodadaId) return;
    setSalvando(true);

    let resultado: Record<string, unknown> = {};
    let respostasPayload: unknown = {};

    if (tipo === "q12") {
      resultado = calcularQ12(respostasQ12) as unknown as Record<string, unknown>;
      respostasPayload = respostasQ12;
    } else {
      resultado = calcularGPTW(respostasGptw) as unknown as Record<string, unknown>;
      respostasPayload = respostasGptw;
    }

    await supabase.from("pesquisas").insert({
      tipo,
      token: crypto.randomUUID(),
      rodada_id: rodadaId,
      respondente_nome: nome,
      respondente_email: email,
      respondente_cargo: cargo || null,
      categoria: rodadaCategoria,
      segmento: rodadaSegmento,
      respostas: respostasPayload,
      resultado,
      concluido_em: new Date().toISOString(),
    });

    setSalvando(false);
    setFase("concluido");
  }

  if (fase === "erro") {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-gold mb-2">Link inválido</h1>
          <p className="text-gold/60">Esta pesquisa não existe, foi encerrada ou o link é inválido.</p>
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
            {nomeRodada && <p className="text-gold/40 mt-1 text-xs">{nomeRodada}</p>}
          </div>
          <div className="bg-surface rounded-card p-8 shadow-lg">
            <h2 className="font-display text-2xl font-semibold text-text-main mb-2">Antes de começar</h2>
            <p className="text-text-muted text-sm mb-6">
              {tipo === "q12" ? "12 afirmações · ~5 minutos" : "25 afirmações · ~8 minutos"}. Responda com honestidade — suas respostas são confidenciais.
            </p>
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
                <Label>Cargo</Label>
                <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="CEO, Gerente..." />
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
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold text-gold">Mendonça & Co</h1>
          </div>
          <div className="bg-surface rounded-card p-10 shadow-lg">
            <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
            <h2 className="font-display text-2xl font-bold text-text-main mb-3">Obrigado, {nome.split(" ")[0]}!</h2>
            <p className="text-text-muted text-sm leading-relaxed">
              Sua resposta foi registrada. O resultado consolidado da equipe será compartilhado em breve.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // PERGUNTAS
  const perguntaAtual = perguntas[atual];
  const respostaAtual = respostas[perguntaAtual.id as keyof typeof respostas];
  const progresso = Math.round((totalRespondidas / totalPerguntas) * 100);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-gold">Mendonça & Co</h1>
          {nomeRodada && <p className="text-gold/50 text-xs mt-1">{nomeRodada}</p>}
        </div>

        {/* Progresso */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gold/60 mb-2">
            <span>{atual + 1} de {totalPerguntas}</span>
            <span>{progresso}% concluído</span>
          </div>
          <div className="h-1.5 bg-gold/20 rounded-full">
            <div className="h-1.5 bg-gold rounded-full transition-all" style={{ width: `${((atual + 1) / totalPerguntas) * 100}%` }} />
          </div>
        </div>

        {/* Card da pergunta */}
        <div className="bg-surface rounded-card p-8 shadow-lg mb-4">
          {"dimensao" in perguntaAtual && (
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">{perguntaAtual.dimensao}</p>
          )}
          <p className="font-display text-xl font-semibold text-text-main mb-8 leading-relaxed">
            {tipo === "q12"
              ? (perguntaAtual as typeof PERGUNTAS_Q12[0]).texto
              : (perguntaAtual as typeof AFIRMACOES_GPTW[0]).texto}
          </p>
          <div className="space-y-2">
            {escala.map((op) => (
              <button
                key={op.valor}
                onClick={() => setResposta(perguntaAtual.id, op.valor)}
                className={`w-full text-left px-4 py-3 rounded-btn border-2 transition-all text-sm font-medium ${
                  respostaAtual === op.valor
                    ? "border-gold bg-gold/10 text-text-main"
                    : "border-[#E8D5A3]/30 text-text-muted hover:border-gold/50 hover:text-text-main"
                }`}
              >
                <span className="font-mono-data mr-3 text-gold">{op.valor}</span>
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navegação */}
        <div className="flex gap-3">
          {atual > 0 && (
            <Button variant="secondary" className="flex-1" onClick={() => setAtual(atual - 1)}>
              <ChevronLeft size={16} /> Anterior
            </Button>
          )}
          {atual < totalPerguntas - 1 ? (
            <Button
              className="flex-1"
              onClick={() => setAtual(atual + 1)}
              disabled={respostaAtual === undefined}
            >
              Próxima <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={finalizar}
              disabled={salvando || totalRespondidas < totalPerguntas}
            >
              {salvando ? "Salvando..." : "Concluir →"}
            </Button>
          )}
        </div>

        {totalRespondidas < totalPerguntas && atual === totalPerguntas - 1 && (
          <p className="text-center text-xs text-gold/50 mt-3">
            {totalPerguntas - totalRespondidas} pergunta{totalPerguntas - totalRespondidas !== 1 ? "s" : ""} sem resposta
          </p>
        )}
      </div>
    </div>
  );
}
