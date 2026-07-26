"use client";

import { useState, useRef, useEffect } from "react";
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
  disciplina: "#C2A878",
  direcao: "#1A2E3A",
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
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [atual, setAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [diagnosticoId, setDiagnosticoId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [scoresAnteriores, setScoresAnteriores] = useState<Record<string, number> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // PDF automático ao concluir
  useEffect(() => {
    if (fase !== "concluido" || !diagnosticoId) return;
    setGerandoPdf(true);
    fetch("/api/diagnostico/gerar-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diagnosticoId }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.pdfUrl) setPdfUrl(d.pdfUrl); })
      .catch(() => {})
      .finally(() => setGerandoPdf(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, diagnosticoId]);

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

    // Buscar resultado anterior (evolução longitudinal)
    if (email) {
      const { data: ant } = await supabase
        .from("diagnosticos")
        .select("resultado")
        .eq("respondente_email", email)
        .neq("token", token)
        .not("resultado", "is", null)
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (ant?.resultado) {
        const r = ant.resultado as { scores?: Record<string, number> };
        if (r.scores) setScoresAnteriores(r.scores);
      }
    }

    // Verificar se já existe pelo token (diagnóstico criado via link)
    const { data: existente } = await supabase
      .from("diagnosticos")
      .select("id")
      .eq("token", token)
      .single();

    let diagId: string | null = existente?.id ?? null;
    if (existente) {
      await supabase
        .from("diagnosticos")
        .update({ respostas, resultado, ...camposRespondente })
        .eq("token", token);
    } else {
      const { data: novo } = await supabase.from("diagnosticos").insert(payload).select("id").single();
      diagId = novo?.id ?? null;
    }
    if (diagId) setDiagnosticoId(diagId);

    // CRM lead
    fetch("/api/diagnostico/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome, email,
        empresa: empresa || null,
        cargo: cargo || null,
        faturamento: faturamento || null,
        score: resultado.geral,
        whatsapp: whatsapp || null,
        instagram: instagram || null,
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
                  className="w-full h-10 px-3 rounded-btn border border-[#E0D0B4]/50 bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                >
                  <option value="">Selecionar (opcional)</option>
                  <option value="ate_7m">Até R$7M/ano</option>
                  <option value="7m_30m">R$7M a R$30M/ano</option>
                  <option value="30m_100m">R$30M a R$100M/ano</option>
                  <option value="acima_100m">Acima de R$100M/ano</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp</Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+55 (11) 99999-9999" />
              </div>
              <div className="space-y-1.5">
                <Label>Instagram</Label>
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@seuperfil" />
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

    const DIMS_3D = ["disciplina", "direcao", "dominio"] as const;
    const ordenadas = [...DIMS_3D].sort((a, b) => resultado.scores[a] - resultado.scores[b]);
    const [primaria, secundaria] = ordenadas;

    const PLANOS_3D: Record<string, { cor: string; diagnostico: string; acoes: string[] }> = {
      disciplina: {
        cor: "#C2A878",
        diagnostico: "Sua execução está inconsistente. Você sabe o que precisa ser feito, mas o dia a dia consome sua agenda antes que você chegue no que realmente importa.",
        acoes: [
          "Bloqueie na agenda as 3 tarefas mais importantes do dia — toda manhã, antes de abrir e-mail ou WhatsApp.",
          "Instale uma revisão semanal de 30 minutos (toda segunda-feira) para checar o que ficou pendente e o que entra na semana.",
          "Identifique 1 hábito que está sabotando sua performance e elimine-o esta semana — só um.",
        ],
      },
      direcao: {
        cor: "#1A2E3A",
        diagnostico: "Sua empresa opera sem uma bússola clara. Decisões são tomadas no improviso e o time não sabe para onde está indo — o que gera retrabalho, desalinhamento e saída de talentos.",
        acoes: [
          "Escreva em 1 parágrafo onde a empresa estará em 3 anos — seja específico: faturamento, mercado, posicionamento.",
          "Defina 3 metas trimestrais não-negociáveis e comunique ao time esta semana.",
          "Agende uma reunião de alinhamento de cultura: o que você tolera e o que não aceita mais.",
        ],
      },
      dominio: {
        cor: "#2D6A4F",
        diagnostico: "Há gaps importantes no seu conhecimento técnico, de liderança ou financeiro que estão limitando o crescimento da empresa. O que você não sabe está custando caro.",
        acoes: [
          "Identifique o maior gap hoje — técnico, liderança ou financeiro — e contrate ou estude para fechar em 90 dias.",
          "Implante uma revisão financeira mensal (DRE, fluxo de caixa, margem) — mesmo que simples.",
          "Mapeie quem no time tem potencial de liderança e inicie um processo de desenvolvimento, mesmo que informal.",
        ],
      },
    };

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
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C2A878" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-bold text-text-main mb-1">Diagnóstico concluído!</h2>
              <p className="text-text-muted text-sm">Obrigado, <strong>{nome}</strong>. Aqui está seu resultado.</p>
              {scoresAnteriores && (
                <p className="text-xs text-gold/60 mt-1">↕ Comparando com seu diagnóstico anterior</p>
              )}
            </div>

            {/* Score geral */}
            <div className="bg-surface rounded-card p-6 shadow-lg">
              <p className="text-text-muted text-xs uppercase tracking-wide mb-3 text-center">Score Geral — Diagnóstico 3D</p>
              <div className="flex items-end justify-center gap-2 mb-2">
                <p className="font-mono-data text-6xl font-bold text-text-main">{resultado.geral.toFixed(1)}</p>
                <p className="text-text-muted text-xl mb-2">/10</p>
              </div>
              <p className="text-center text-sm font-medium mb-5" style={{ color: faixaGeral.cor }}>
                {faixaGeral.label} — {faixaGeral.descricao}
              </p>

              {/* Barras por dimensão */}
              <div className="space-y-3">
                {DIMS_3D.map((dim) => {
                  const score = resultado.scores[dim];
                  const faixa = faixaScore(score);
                  const isPrimaria = dim === primaria;
                  return (
                    <div key={dim}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-text-main">{DIMENSAO_LABELS[dim]}</span>
                          {isPrimaria && (
                            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: faixa.cor + "20", color: faixa.cor }}>
                              Prioridade
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {scoresAnteriores?.[dim] !== undefined && (() => {
                            const delta = score - scoresAnteriores[dim];
                            const cor = delta > 0.1 ? "#27AE60" : delta < -0.1 ? "#C0392B" : "#6B6B6B";
                            return (
                              <span className="text-[11px] font-medium" style={{ color: cor }}>
                                {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                              </span>
                            );
                          })()}
                          <span className="font-mono-data text-sm font-bold text-text-main">{score.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gold/10 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full transition-all"
                          style={{ width: `${(score / 10) * 100}%`, backgroundColor: faixa.cor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plano Primário */}
            <div className="bg-surface rounded-card p-6 shadow-lg" style={{ borderLeft: `4px solid ${PLANOS_3D[primaria].cor}` }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: PLANOS_3D[primaria].cor }}>
                Plano de Ação Primário — {DIMENSAO_LABELS[primaria]}
              </p>
              <p className="text-text-muted text-sm leading-relaxed mb-4">{PLANOS_3D[primaria].diagnostico}</p>
              <p className="text-text-main text-xs font-semibold uppercase tracking-wide mb-3">O que fazer agora:</p>
              <div className="space-y-3">
                {PLANOS_3D[primaria].acoes.map((acao, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5" style={{ backgroundColor: PLANOS_3D[primaria].cor }}>
                      {i + 1}
                    </div>
                    <p className="text-text-main text-sm leading-relaxed">{acao}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Plano Secundário */}
            <div className="bg-surface rounded-card p-5 shadow-lg" style={{ borderLeft: `4px solid ${PLANOS_3D[secundaria].cor}80` }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: PLANOS_3D[secundaria].cor }}>
                Plano de Ação Secundário — {DIMENSAO_LABELS[secundaria]}
              </p>
              <p className="text-text-muted text-sm leading-relaxed mb-3">{PLANOS_3D[secundaria].diagnostico}</p>
              <div className="space-y-2">
                {PLANOS_3D[secundaria].acoes.map((acao, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5" style={{ backgroundColor: PLANOS_3D[secundaria].cor + "99" }}>
                      {i + 1}
                    </div>
                    <p className="text-text-muted text-sm leading-relaxed">{acao}</p>
                  </div>
                ))}
              </div>
            </div>

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
                    Baixar PDF do Diagnóstico
                  </a>
                ) : null}
              </div>
            )}

            {/* CTA */}
            <div className="bg-surface rounded-card p-5 shadow-lg text-center">
              <p className="text-text-muted text-sm leading-relaxed">
                Nossa equipe vai entrar em contato em breve com uma análise aprofundada e um plano de aceleração personalizado para o seu negócio.
              </p>
              <p className="text-gold text-xs font-medium mt-2">guilherme@mendonca.co</p>
            </div>
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
                        backgroundColor: ativa ? "#C2A878" : "#C2A87860",
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
