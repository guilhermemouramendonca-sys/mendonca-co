"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { PERGUNTAS, calcularResultado, faixaScore } from "@/lib/diagnostico/perguntas";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Fase = "identificacao" | "perguntas" | "concluido";

const DIMENSAO_LABELS: Record<string, string> = {
  disciplina: "Disciplina",
  direcao: "Direção",
  dominio: "Domínio",
};

const DIMENSAO_CORES: Record<string, string> = {
  disciplina: "#C9A84C",
  direcao: "#0D2B2E",
  dominio: "#2D6A4F",
};

const ESCALA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function DiagnosticoPublicoPage() {
  const { token } = useParams<{ token: string }>();
  const supabase = createClient();

  const [fase, setFase] = useState<Fase>("identificacao");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [faturamento, setFaturamento] = useState("");
  const [atual, setAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pergunta = PERGUNTAS[atual];
  const total = PERGUNTAS.length;

  // Agrupar por dimensão para barra de progresso por seção
  const porDimensao = {
    disciplina: PERGUNTAS.filter((p) => p.dimensao === "disciplina"),
    direcao: PERGUNTAS.filter((p) => p.dimensao === "direcao"),
    dominio: PERGUNTAS.filter((p) => p.dimensao === "dominio"),
  };

  function responderAtual(valor: number) {
    setRespostas((prev) => ({ ...prev, [pergunta.id]: valor }));
    if (atual < total - 1) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setAtual((p) => p + 1), 380);
    }
  }

  function avancar() {
    if (atual < total - 1) {
      setAtual((p) => p + 1);
    } else {
      finalizar();
    }
  }

  function voltar() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (atual > 0) setAtual((p) => p - 1);
  }

  async function finalizar() {
    setSalvando(true);
    const resultado = calcularResultado(respostas);

    const camposRespondente = {
      respondente_nome: nome,
      respondente_email: email,
      respondente_empresa: empresa || null,
      respondente_cargo: cargo || null,
      faturamento_faixa: faturamento || null,
    };

    const payload = {
      tipo: "captacao" as const,
      token,
      ...camposRespondente,
      respostas,
      resultado,
    };

    // Verificar se já existe pelo token (diagnóstico criado via link)
    const { data: existente } = await supabase
      .from("diagnosticos")
      .select("id")
      .eq("token", token)
      .single();

    if (existente) {
      await supabase
        .from("diagnosticos")
        .update({ respostas, resultado, ...camposRespondente })
        .eq("token", token);
    } else {
      await supabase.from("diagnosticos").insert(payload);
    }

    // CRM lead
    await fetch("/api/pesquisa/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome, email,
        empresa: empresa || null,
        cargo: cargo || null,
        tipo: "diagnostico_3d",
        observacoes: `Diagnóstico 3D concluído. Score geral: ${resultado.geral.toFixed(1)}/10`,
      }),
    }).catch(() => {});

    setSalvando(false);
    setFase("concluido");
  }

  function iniciar() {
    if (!nome.trim() || !email.trim()) {
      setErro("Nome e e-mail são obrigatórios.");
      return;
    }
    setErro("");
    setFase("perguntas");
  }

  // ── TELA DE IDENTIFICAÇÃO ──────────────────────────────────
  if (fase === "identificacao") {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-gold">Mendonça & Co</h1>
            <p className="text-gold/60 mt-1 text-sm">Diagnóstico 3D de Liderança</p>
          </div>

          <div className="bg-surface rounded-card p-8 shadow-lg">
            <h2 className="font-display text-2xl font-semibold text-text-main mb-2">Antes de começar</h2>
            <p className="text-text-muted text-sm mb-6">
              Este diagnóstico tem <strong>36 perguntas</strong> e leva cerca de <strong>10 minutos</strong>.
              Responda com honestidade — não há respostas certas ou erradas.
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
                <Label>Empresa</Label>
                <Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nome da empresa" />
              </div>
              <div className="space-y-1.5">
                <Label>Cargo</Label>
                <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="CEO, Diretor..." />
              </div>
              <div className="space-y-1.5">
                <Label>Faturamento anual da empresa</Label>
                <select
                  value={faturamento}
                  onChange={(e) => setFaturamento(e.target.value)}
                  className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3]/50 bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                >
                  <option value="">Selecionar (opcional)</option>
                  <option value="ate_7m">Até R$7M/ano</option>
                  <option value="7m_30m">R$7M a R$30M/ano</option>
                  <option value="30m_100m">R$30M a R$100M/ano</option>
                  <option value="acima_100m">Acima de R$100M/ano</option>
                </select>
              </div>

              {erro && <p className="text-sm text-danger">{erro}</p>}

              <Button className="w-full mt-2" onClick={iniciar}>
                Iniciar Diagnóstico →
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── TELA DE CONCLUSÃO ─────────────────────────────────────
  if (fase === "concluido") {
    const resultado = calcularResultado(respostas);
    const faixaGeral = faixaScore(resultado.geral);

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

            <h2 className="font-display text-3xl font-bold text-text-main mb-2">
              Diagnóstico concluído!
            </h2>
            <p className="text-text-muted text-sm mb-8">
              Obrigado, <strong>{nome}</strong>. Seu resultado foi registrado com sucesso.
            </p>

            {/* Score geral */}
            <div className="bg-bg rounded-card p-6 mb-6">
              <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Score Geral</p>
              <p className="font-mono-data text-5xl font-bold text-text-main mb-1">
                {resultado.geral.toFixed(1)}
                <span className="text-xl text-text-muted font-normal">/10</span>
              </p>
              <span className="text-sm font-medium" style={{ color: faixaGeral.cor }}>
                {faixaGeral.label} — {faixaGeral.descricao}
              </span>
            </div>

            {/* Scores por dimensão */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {(["disciplina", "direcao", "dominio"] as const).map((dim) => {
                const score = resultado.scores[dim];
                const faixa = faixaScore(score);
                return (
                  <div key={dim} className="bg-bg rounded-btn p-3 text-center">
                    <p className="text-xs text-text-muted mb-1">{DIMENSAO_LABELS[dim]}</p>
                    <p className="font-mono-data text-2xl font-bold text-text-main">
                      {score.toFixed(1)}
                    </p>
                    <div className="w-full bg-[#E8D5A3]/30 rounded-full h-1.5 mt-2">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${(score / 10) * 100}%`, backgroundColor: faixa.cor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-text-muted text-sm leading-relaxed">
              Em breve entraremos em contato com uma análise detalhada e recomendações personalizadas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── STEPPER DE PERGUNTAS ──────────────────────────────────
  const respostaAtual = respostas[pergunta.id];
  const dimAtual = pergunta.dimensao;

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gold/10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-lg font-bold text-gold">Diagnóstico 3D</h1>
            <span className="text-gold/60 text-sm font-mono-data">{atual + 1}/{total}</span>
          </div>

          {/* Barras de dimensão */}
          <div className="flex gap-2">
            {(["disciplina", "direcao", "dominio"] as const).map((dim) => {
              const pergs = porDimensao[dim];
              const respondidas = pergs.filter((p) => respostas[p.id] !== undefined).length;
              const pct = (respondidas / pergs.length) * 100;
              const ativa = dimAtual === dim;
              return (
                <div key={dim} className="flex-1">
                  <p className={`text-[10px] mb-1 ${ativa ? "text-gold" : "text-gold/40"}`}>
                    {DIMENSAO_LABELS[dim]}
                  </p>
                  <div className="w-full bg-gold/10 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: ativa ? "#C9A84C" : "#C9A84C60",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pergunta */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Badge de subdimensão */}
          <div className="mb-6 text-center">
            <span
              className="text-xs font-medium px-3 py-1 rounded-full border"
              style={{ color: DIMENSAO_CORES[dimAtual], borderColor: DIMENSAO_CORES[dimAtual] + "40", backgroundColor: DIMENSAO_CORES[dimAtual] + "10" }}
            >
              {DIMENSAO_LABELS[dimAtual]} · {pergunta.subdimensao}
            </span>
          </div>

          {/* Texto da pergunta */}
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-gold text-center mb-10 leading-snug">
            {pergunta.texto}
          </h2>

          {/* Escala 1-10 */}
          <div className="flex items-center justify-center gap-1 md:gap-2 mb-4 flex-wrap">
            {ESCALA.map((val) => (
              <button
                key={val}
                onClick={() => responderAtual(val)}
                className={`w-11 h-11 md:w-12 md:h-12 rounded-btn font-mono-data text-sm font-semibold transition-all ${
                  respostaAtual === val
                    ? "bg-gold text-primary scale-110 shadow-lg"
                    : "bg-gold/10 text-gold/70 hover:bg-gold/20 hover:text-gold"
                }`}
              >
                {val}
              </button>
            ))}
          </div>

          {/* Legenda */}
          <div className="flex justify-between text-xs text-gold/40 px-2 mb-10">
            <span>1 — Discordo totalmente</span>
            <span>10 — Concordo totalmente</span>
          </div>

          {/* Navegação */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="secondary"
              onClick={voltar}
              disabled={atual === 0}
              className="border-gold/30 text-gold/70 hover:text-gold hover:border-gold"
            >
              <ChevronLeft size={16} /> Voltar
            </Button>

            <Button
              onClick={avancar}
              disabled={respostaAtual === undefined || salvando}
              className="min-w-32"
            >
              {salvando ? "Salvando..." : atual === total - 1 ? "Concluir" : "Próxima"}
              {!salvando && atual < total - 1 && <ChevronRight size={16} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
