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
  const [atual, setAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const { data: existente } = await supabase
      .from("radar360")
      .select("id")
      .eq("token", token)
      .single();

    if (existente) {
      await supabase.from("radar360").update(campos).eq("token", token);
    } else {
      await supabase.from("radar360").insert({ token, ...campos });
    }

    await fetch("/api/radar360/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, empresa, cargo, faturamento, resultado, ...utm }),
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
            <h2 className="font-display text-3xl font-bold text-text-main mb-2">Diagnóstico concluído!</h2>
            <p className="text-text-muted text-sm mb-8">
              Obrigado, <strong>{nome}</strong>. Seu relatório está sendo preparado e entraremos em contato em breve.
            </p>

            {/* Score geral */}
            <div className="bg-bg rounded-card p-6 mb-6">
              <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Score Geral</p>
              <p className="font-mono-data text-5xl font-bold text-text-main mb-1">
                {resultado.geral.toFixed(1)}
                <span className="text-xl text-text-muted font-normal">/5</span>
              </p>
              <span className="text-sm font-medium" style={{ color: geralCor }}>
                {labelScore(Math.round(resultado.geral))}
              </span>
            </div>

            <BenchmarkComparacao
              tipo="radar_360" metrica="score_geral"
              valorAtual={parseFloat(resultado.geral.toFixed(1))}
              categoria={categoria || null} segmento={segmento || null} porte={faturamento || null}
              unidade="/5"
              label="Score Geral"
            />

            {/* Porta de entrada */}
            <div className="bg-bg rounded-btn p-4 mb-6 text-left">
              <p className="text-xs text-text-muted mb-1 uppercase tracking-wide">Porta de entrada identificada</p>
              <p className="font-semibold text-text-main">Entrada {resultado.portaEntrada}</p>
            </div>

            {/* Scores por dimensão */}
            <div className="grid grid-cols-4 gap-2">
              {DIMENSOES.map((d) => {
                const score = resultado.scores[d.id];
                const cor = corScore(score);
                return (
                  <div key={d.id} className="bg-bg rounded-btn p-2 text-center">
                    <p className="text-[9px] text-text-muted mb-1 leading-tight">{d.titulo}</p>
                    <p className="font-mono-data text-lg font-bold text-text-main">{score.toFixed(1)}</p>
                    <div className="w-full bg-[#E8D5A3]/30 rounded-full h-1 mt-1">
                      <div className="h-1 rounded-full" style={{ width: `${(score / 5) * 100}%`, backgroundColor: cor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PERGUNTAS ─────────────────────────────────────────────
  const nivelCores: Record<string, string> = {
    "Estratégico": "#C9A84C",
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
              const cor = DIMENSOES.find((d) => d.id === pid)?.corHex ?? "#C9A84C";
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
