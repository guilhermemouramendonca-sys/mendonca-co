"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIMENSOES, PERGUNTAS_RADAR, calcularRadar360, corScore, labelScore } from "@/lib/radar360/dimensoes";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SetorSelects } from "@/components/ui/setor-selects";
import { BenchmarkComparacao } from "@/components/ui/benchmark-comparacao";

type Fase = "identificacao" | "perguntas" | "concluido";

const ESCALA = [1, 2, 3, 4, 5];
const TOTAL = PERGUNTAS_RADAR.length; // 24

export default function Radar360PublicoPage() {
  const { token } = useParams<{ token: string }>();
  const supabase = createClient();
  const [utm, setUtm] = useState<Record<string, string>>({});

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const u: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
      const v = p.get(k); if (v) u[k] = v;
    }
    setUtm(u);
  }, []);

  const [fase, setFase] = useState<Fase>("identificacao");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [faturamento, setFaturamento] = useState("");
  const [categoria, setCategoria] = useState("");
  const [segmento, setSegmento] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [atual, setAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [radar360Id, setRadar360Id] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [scoresAnteriores, setScoresAnteriores] = useState<Record<string, number> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // PDF automático ao concluir
  useEffect(() => {
    if (fase !== "concluido" || !radar360Id) return;
    setGerandoPdf(true);
    fetch("/api/radar360/gerar-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ radar360Id }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.pdfUrl) setPdfUrl(d.pdfUrl); })
      .catch(() => {})
      .finally(() => setGerandoPdf(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, radar360Id]);

  const pergunta = PERGUNTAS_RADAR[atual];
  const dim = DIMENSOES.find((d) => d.id === pergunta.dimensaoId)!;
  const respostaAtual = respostas[pergunta.id];
  const respondidas = Object.keys(respostas).length;
  const progresso = Math.round((respondidas / TOTAL) * 100);

  // Índice dentro do pilar (0, 1 ou 2)
  const idxNoPilar = atual % 3;
  const pilares = Array.from(new Set(PERGUNTAS_RADAR.map((p) => p.dimensaoId)));

  function responder(val: number) {
    setRespostas((prev) => ({ ...prev, [pergunta.id]: val }));
    if (atual < TOTAL - 1) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setAtual((p) => p + 1), 380);
    }
  }

  function avancar() {
    if (atual < TOTAL - 1) setAtual((p) => p + 1);
    else finalizar();
  }

  function voltar() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (atual > 0) setAtual((p) => p - 1);
  }

  async function finalizar() {
    setSalvando(true);
    const resultado = calcularRadar360(respostas);

    const campos = {
      respondente_nome: nome,
      respondente_email: email,
      respondente_empresa: empresa || null,
      respondente_cargo: cargo || null,
      faturamento_faixa: faturamento || null,
      categoria: categoria || null,
      segmento: segmento || null,
      respostas,
      resultado,
    };

    // Buscar resultado anterior (evolução longitudinal)
    if (email) {
      const { data: ant } = await supabase
        .from("radar360")
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

    const { data: existente } = await supabase
      .from("radar360")
      .select("id")
      .eq("token", token)
      .single();

    let r360Id: string | null = existente?.id ?? null;
    if (existente) {
      await supabase.from("radar360").update(campos).eq("token", token);
    } else {
      const { data: novo } = await supabase.from("radar360").insert({ token, ...campos }).select("id").single();
      r360Id = novo?.id ?? null;
    }
    if (r360Id) setRadar360Id(r360Id);

    await fetch("/api/radar360/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, empresa, cargo, faturamento, resultado, whatsapp: whatsapp || null, instagram: instagram || null, ...utm }),
    });

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

  // ── IDENTIFICAÇÃO ──────────────────────────────────────────
  if (fase === "identificacao") {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-gold">Mendonça & Co</h1>
            <p className="text-gold/60 mt-1 text-sm">Radar de Diagnóstico 360</p>
          </div>

          <div className="bg-surface rounded-card p-8 shadow-lg">
            <h2 className="font-display text-2xl font-semibold text-text-main mb-2">Antes de começar</h2>
            <p className="text-text-muted text-sm mb-6">
              <strong>24 perguntas</strong> sobre os 8 pilares do seu negócio (3 perguntas por pilar: estratégico, tático e operacional).
              Leva cerca de <strong>10 minutos</strong>.
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
                <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="CEO, Fundador, Diretor..." />
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
              <Button className="w-full mt-2" onClick={iniciar}>
                Iniciar Diagnóstico →
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CONCLUSÃO ─────────────────────────────────────────────
  if (fase === "concluido") {
    const resultado = calcularRadar360(respostas);
    const geralCor = corScore(Math.round(resultado.geral));

    const ordenadas = [...DIMENSOES].sort((a, b) => resultado.scores[a.id] - resultado.scores[b.id]);
    const [dimPrimaria, dimSecundaria] = ordenadas;

    const PLANOS_RADAR: Record<string, { diagnostico: string; acoes: string[] }> = {
      estrategia: {
        diagnostico: "Sua empresa opera sem um plano estratégico claro. Decisões importantes são tomadas no improviso e o time não tem visibilidade de longo prazo.",
        acoes: [
          "Reserve um dia fora do escritório para definir sua estratégia dos próximos 12 meses.",
          "Documente 3 apostas estratégicas e 3 coisas que a empresa vai parar de fazer.",
          "Comunique a estratégia ao time de forma simples — 1 página, lida em 5 minutos.",
        ],
      },
      lideranca: {
        diagnostico: "A empresa ainda depende muito de você. Seu time não opera com autonomia suficiente, o que limita o crescimento de ambos.",
        acoes: [
          "Mapeie as 5 decisões que você toma toda semana que poderiam ser tomadas por alguém do time.",
          "Instale 1-on-1s semanais de 30 minutos com cada liderança direta.",
          "Defina critérios claros de quando alguém pode decidir sozinho e quando precisa de você.",
        ],
      },
      cultura: {
        diagnostico: "Os valores da empresa não estão sendo vividos no dia a dia. Há um gap entre o que é declarado e o que é tolerado.",
        acoes: [
          "Liste 3 comportamentos que você tolera hoje mas que contradizem os valores da empresa — e pare de tolerá-los.",
          "Celebre publicamente alguém que agiu de acordo com a cultura esta semana.",
          "Inclua cultura no processo de contratação: defina 2 perguntas que revelam fit cultural real.",
        ],
      },
      gestao: {
        diagnostico: "Faltam rituais de gestão instalados. Sem reuniões fixas, métricas claras e accountability, o time opera sem ritmo.",
        acoes: [
          "Instale uma reunião semanal de 45 minutos com o time de gestão: o que foi feito, o que trava, o que entra.",
          "Defina 5 indicadores que você vai olhar toda semana — não mais que isso.",
          "Crie um sistema simples de accountability: quem é dono de quê e até quando.",
        ],
      },
      processos: {
        diagnostico: "Os processos críticos vivem na cabeça das pessoas. Quando alguém sai, o trabalho para — e você volta para dentro da operação.",
        acoes: [
          "Mapeie os 3 processos mais críticos e documente em um fluxo simples (Notion, Google Docs).",
          "Identifique qual processo depende só de você e crie um protocolo para delegá-lo.",
          "Teste: se você sumisse por 2 semanas, o que quebraria? Comece por aí.",
        ],
      },
      marketing: {
        diagnostico: "Seu marketing não gera demanda previsível. Você depende de indicações ou picos de esforço — o que torna o crescimento imprevisível.",
        acoes: [
          "Defina seu posicionamento em 1 frase: para quem, o quê e por que você (não um concorrente).",
          "Escolha 1 canal de aquisição e seja consistente por 90 dias — profundidade antes de amplitude.",
          "Crie um calendário de conteúdo simples: 3 publicações por semana que educam seu cliente ideal.",
        ],
      },
      vendas: {
        diagnostico: "Seu funil de vendas não é previsível. Vendas acontecem, mas você não consegue projetar o próximo mês com confiança.",
        acoes: [
          "Mapeie o funil atual: quantos leads entram, qual a taxa de conversão, qual o tempo médio de fechamento.",
          "Instale uma revisão semanal de pipeline: o que avançou, o que travou, o que precisa de ação.",
          "Defina um processo de follow-up padrão — a maioria das vendas morre na falta de continuidade.",
        ],
      },
      financeiro: {
        diagnostico: "Sua gestão financeira precisa de mais estrutura. Sem clareza sobre margem, fluxo de caixa e projeções, decisões de crescimento são feitas no escuro.",
        acoes: [
          "Implante uma DRE mensal simples — você precisa saber sua margem bruta e líquida todo mês.",
          "Crie uma projeção de caixa para os próximos 90 dias e atualize semanalmente.",
          "Defina seu ponto de equilíbrio: quantas vendas você precisa para cobrir todos os custos.",
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
              <p className="text-text-muted text-sm">Obrigado, <strong>{nome}</strong>. Aqui está seu Radar 360.</p>
              {scoresAnteriores && (
                <p className="text-xs text-gold/60 mt-1">↕ Comparando com seu diagnóstico anterior</p>
              )}
            </div>

            {/* Score geral + benchmark */}
            <div className="bg-surface rounded-card p-6 shadow-lg">
              <p className="text-text-muted text-xs uppercase tracking-wide mb-3 text-center">Score Geral — Radar 360</p>
              <div className="flex items-end justify-center gap-2 mb-2">
                <p className="font-mono-data text-6xl font-bold text-text-main">{resultado.geral.toFixed(1)}</p>
                <p className="text-text-muted text-xl mb-2">/5</p>
              </div>
              <p className="text-center text-sm font-medium mb-5" style={{ color: geralCor }}>
                {labelScore(Math.round(resultado.geral))}
              </p>

              <BenchmarkComparacao
                tipo="radar_360" metrica="score_geral"
                valorAtual={parseFloat(resultado.geral.toFixed(1))}
                categoria={categoria || null} segmento={segmento || null} porte={faturamento || null}
                unidade="/5"
                label="Score Geral"
              />
            </div>

            {/* Todos os pilares */}
            <div className="bg-surface rounded-card p-6 shadow-lg">
              <p className="text-text-muted text-xs uppercase tracking-wide mb-4">Os 8 Pilares</p>
              <div className="space-y-3">
                {DIMENSOES.map((d) => {
                  const score = resultado.scores[d.id];
                  const cor = corScore(score);
                  const isPrimaria = d.id === dimPrimaria.id;
                  const isSecundaria = d.id === dimSecundaria.id;
                  return (
                    <div key={d.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-text-main">{d.titulo}</span>
                          {isPrimaria && (
                            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: cor + "20", color: cor }}>Prioridade 1</span>
                          )}
                          {isSecundaria && (
                            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: cor + "20", color: cor }}>Prioridade 2</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {scoresAnteriores?.[d.id] !== undefined && (() => {
                            const delta = score - scoresAnteriores[d.id];
                            const dcor = delta > 0.1 ? "#27AE60" : delta < -0.1 ? "#C0392B" : "#6B6B6B";
                            return (
                              <span className="text-[11px] font-medium" style={{ color: dcor }}>
                                {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                              </span>
                            );
                          })()}
                          <span className="font-mono-data text-sm font-bold text-text-main">{score.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gold/10 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${(score / 5) * 100}%`, backgroundColor: isPrimaria || isSecundaria ? cor : cor + "80" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Porta de entrada */}
            <div className="bg-surface rounded-card p-4 shadow-lg">
              <p className="text-xs text-text-muted mb-1 uppercase tracking-wide">Porta de entrada identificada</p>
              <p className="font-semibold text-text-main">Entrada {resultado.portaEntrada}</p>
            </div>

            {/* Plano Primário */}
            {PLANOS_RADAR[dimPrimaria.id] && (
              <div className="bg-surface rounded-card p-6 shadow-lg" style={{ borderLeft: `4px solid ${dimPrimaria.corHex}` }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: dimPrimaria.corHex }}>
                  Plano de Ação Primário — {dimPrimaria.titulo}
                </p>
                <p className="text-text-muted text-sm leading-relaxed mb-4">{PLANOS_RADAR[dimPrimaria.id].diagnostico}</p>
                <p className="text-text-main text-xs font-semibold uppercase tracking-wide mb-3">O que fazer agora:</p>
                <div className="space-y-3">
                  {PLANOS_RADAR[dimPrimaria.id].acoes.map((acao, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5" style={{ backgroundColor: dimPrimaria.corHex }}>
                        {i + 1}
                      </div>
                      <p className="text-text-main text-sm leading-relaxed">{acao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plano Secundário */}
            {PLANOS_RADAR[dimSecundaria.id] && (
              <div className="bg-surface rounded-card p-5 shadow-lg" style={{ borderLeft: `4px solid ${dimSecundaria.corHex}80` }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: dimSecundaria.corHex }}>
                  Plano de Ação Secundário — {dimSecundaria.titulo}
                </p>
                <p className="text-text-muted text-sm leading-relaxed mb-3">{PLANOS_RADAR[dimSecundaria.id].diagnostico}</p>
                <div className="space-y-2">
                  {PLANOS_RADAR[dimSecundaria.id].acoes.map((acao, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5" style={{ backgroundColor: dimSecundaria.corHex + "99" }}>
                        {i + 1}
                      </div>
                      <p className="text-text-muted text-sm leading-relaxed">{acao}</p>
                    </div>
                  ))}
                </div>
              </div>
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
                    Baixar PDF do Radar 360
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

  // ── PERGUNTAS ─────────────────────────────────────────────
  const nivelCores: Record<string, string> = {
    "Estratégico": "#C2A878",
    "Tático": "#2980B9",
    "Operacional": "#27AE60",
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Header com progresso */}
      <div className="px-4 py-4 border-b border-gold/10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-lg font-bold text-gold">Radar 360</h1>
            <span className="text-gold/60 text-sm font-mono-data">{atual + 1}/{TOTAL}</span>
          </div>
          {/* Mini progresso por pilar */}
          <div className="flex gap-1 mb-2">
            {pilares.map((pid) => {
              const pergsDopilar = PERGUNTAS_RADAR.filter((p) => p.dimensaoId === pid);
              const respondidas = pergsDopilar.filter((p) => respostas[p.id] !== undefined).length;
              const cor = DIMENSOES.find((d) => d.id === pid)?.corHex ?? "#C2A878";
              return (
                <div key={pid} className="flex-1 flex flex-col gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-1 rounded-full transition-all"
                      style={{ backgroundColor: respondidas > i ? cor : cor + "30" }} />
                  ))}
                </div>
              );
            })}
          </div>
          <div className="w-full bg-gold/10 rounded-full h-1">
            <div className="h-1 rounded-full bg-gold transition-all duration-300" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      </div>

      {/* Pergunta */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Badges: dimensão + nível */}
          <div className="mb-6 flex items-center justify-center gap-2 flex-wrap">
            <span
              className="text-xs font-medium px-3 py-1 rounded-full border"
              style={{ color: dim.corHex, borderColor: dim.corHex + "50", backgroundColor: dim.corHex + "15" }}
            >
              {dim.titulo}
            </span>
            <span
              className="text-xs font-medium px-3 py-1 rounded-full border"
              style={{ color: nivelCores[pergunta.nivel], borderColor: nivelCores[pergunta.nivel] + "50", backgroundColor: nivelCores[pergunta.nivel] + "15" }}
            >
              {pergunta.nivel} · {idxNoPilar + 1}/3
            </span>
          </div>

          {/* Pergunta */}
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-gold text-center mb-10 leading-snug">
            {pergunta.pergunta}
          </h2>

          {/* Escala 1-5 */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {ESCALA.map((val) => (
              <button
                key={val}
                onClick={() => responder(val)}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-btn font-mono-data text-lg font-semibold transition-all ${
                  respostaAtual === val
                    ? "bg-gold text-primary scale-110 shadow-lg"
                    : "bg-gold/10 text-gold/70 hover:bg-gold/20 hover:text-gold"
                }`}
              >
                {val}
              </button>
            ))}
          </div>

          {/* Âncoras */}
          <div className="flex justify-between text-xs text-gold/40 px-2 mb-10">
            <span className="max-w-[45%] text-left">1 — {pergunta.ancora1}</span>
            <span className="max-w-[45%] text-right">5 — {pergunta.ancora5}</span>
          </div>

          {/* Navegação */}
          <div className="flex items-center justify-between gap-4">
            <Button variant="secondary" onClick={voltar} disabled={atual === 0} className="border-gold/30 text-gold/70 hover:text-gold hover:border-gold">
              <ChevronLeft size={16} /> Voltar
            </Button>
            <Button onClick={avancar} disabled={respostaAtual === undefined || salvando} className="min-w-32">
              {salvando ? "Salvando..." : atual === TOTAL - 1 ? "Concluir" : "Próxima"}
              {!salvando && atual < TOTAL - 1 && <ChevronRight size={16} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
