"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PERGUNTAS_CANVAS, gerarAnaliseCanvas, type CanvasId, type RespostasCanvas } from "@/lib/canvas/perguntas";
import { SetorSelects } from "@/components/ui/setor-selects";

type Fase = "identificacao" | "perguntas" | "concluido" | "erro";

export default function CanvasPublicoPage() {
  const { token } = useParams<{ token: string }>();
  const supabase = createClient();

  const [fase, setFase] = useState<Fase>("identificacao");
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [segmento, setSegmento] = useState("");
  const [faturamento, setFaturamento] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [respostas, setRespostas] = useState<RespostasCanvas>({});

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from("canvas_estrategico")
        .select("id, respondente_nome")
        .eq("token", token)
        .single();

      if (!data) { setFase("erro"); return; }
      if (data.respondente_nome) { setFase("concluido"); return; }
      setCanvasId(data.id);
    }
    carregar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function iniciar() {
    if (!nome.trim() || !email.trim()) { setErro("Nome e e-mail são obrigatórios."); return; }
    setErro("");
    setFase("perguntas");
  }

  const totalPreenchido = PERGUNTAS_CANVAS.filter((q) => (respostas[q.id] ?? "").trim().length > 0).length;

  async function finalizar() {
    if (!canvasId) return;
    setSalvando(true);

    const respostasCompletas = Object.fromEntries(
      PERGUNTAS_CANVAS.map((q) => [q.id, respostas[q.id] ?? ""])
    ) as Record<CanvasId, string>;

    const analise = gerarAnaliseCanvas(respostasCompletas);
    const resultado = { respostas: respostasCompletas, analise };

    await supabase.from("canvas_estrategico").update({
      respondente_nome: nome,
      respondente_email: email,
      respondente_empresa: empresa || null,
      respondente_cargo: cargo || null,
      categoria: categoria || null,
      segmento: segmento || null,
      faturamento_faixa: faturamento || null,
      respostas: respostasCompletas,
      resultado,
      concluido_em: new Date().toISOString(),
    }).eq("id", canvasId);

    // CRM lead
    fetch("/api/canvas/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, empresa: empresa || null, cargo: cargo || null }),
    }).catch(() => {});

    setSalvando(false);
    setFase("concluido");
  }

  if (fase === "erro") {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-gold mb-2">Link inválido</h1>
          <p className="text-gold/60">Este link de Canvas Estratégico não existe ou já foi utilizado.</p>
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
            <p className="text-gold/60 mt-1 text-sm">Canvas Estratégico</p>
          </div>
          <div className="bg-white rounded-card p-8 shadow-lg">
            <h2 className="font-display text-2xl font-semibold text-[#0D2B2E] mb-2">Antes de começar</h2>
            <p className="text-[#6B6B6B] text-sm mb-6">
              6 perguntas · ~10 minutos. Responda com honestidade — quanto mais específico, mais útil será o Canvas.
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
                <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="CEO, Fundador..." />
              </div>
              <SetorSelects
                categoria={categoria} segmento={segmento} faturamento={faturamento}
                onCategoria={setCategoria} onSegmento={setSegmento} onFaturamento={setFaturamento}
              />
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <Button className="w-full mt-2" onClick={iniciar}>
                Iniciar Canvas →
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
          <div className="bg-white rounded-card p-10 shadow-lg">
            <div className="w-16 h-16 rounded-full bg-[#C9A84C]/20 flex items-center justify-center mx-auto mb-6 text-3xl">
              🎯
            </div>
            <h2 className="font-display text-2xl font-bold text-[#0D2B2E] mb-3">Canvas concluído!</h2>
            <p className="text-[#6B6B6B] text-sm leading-relaxed mb-6">
              Sua resposta foi registrada. Em breve entraremos em contato com o Canvas completo e uma análise estratégica personalizada.
            </p>
            <p className="text-xs text-[#6B6B6B]">guilherme@mendonca.co</p>
          </div>
        </div>
      </div>
    );
  }

  // FASE: perguntas
  return (
    <div className="min-h-screen bg-[#F5F0E8] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[#0D2B2E]/60 text-sm font-medium mb-1">Mendonça & Co</p>
          <h1 className="font-display text-3xl font-bold text-[#0D2B2E]">Canvas Estratégico</h1>
          <p className="text-[#6B6B6B] text-sm mt-2">{nome} · {totalPreenchido} de {PERGUNTAS_CANVAS.length} respondidas</p>
        </div>

        {/* Perguntas */}
        <div className="space-y-6">
          {PERGUNTAS_CANVAS.map((q, i) => {
            const valor = respostas[q.id] ?? "";
            const preenchida = valor.trim().length > 0;
            return (
              <div key={q.id} className="bg-white rounded-card p-6 shadow-sm border border-transparent"
                style={{ borderLeftColor: q.cor, borderLeftWidth: 4 }}>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">{q.icone}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">{i + 1} / {PERGUNTAS_CANVAS.length}</span>
                      {preenchida && <span className="text-xs text-green-600 font-medium">✓ preenchida</span>}
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#0D2B2E] mt-1">{q.titulo}</h3>
                    <p className="text-[#6B6B6B] text-sm mt-1">{q.pergunta}</p>
                  </div>
                </div>
                <textarea
                  className="w-full rounded-lg border border-[#E8D5A3] bg-[#F5F0E8] p-4 text-sm text-[#1A1A1A] placeholder:text-[#6B6B6B]/60 focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                  style={{ minHeight: 120 }}
                  placeholder={q.placeholder}
                  value={valor}
                  onChange={(e) => setRespostas({ ...respostas, [q.id]: e.target.value })}
                />
              </div>
            );
          })}
        </div>

        {/* Finalizar */}
        <div className="mt-8 text-center">
          <p className="text-[#6B6B6B] text-xs mb-4">{totalPreenchido} de {PERGUNTAS_CANVAS.length} perguntas respondidas</p>
          <Button
            className="w-full max-w-sm h-12 text-base"
            onClick={finalizar}
            disabled={salvando || totalPreenchido < 3}
          >
            {salvando ? "Salvando..." : "Concluir Canvas →"}
          </Button>
          {totalPreenchido < 3 && (
            <p className="text-xs text-[#6B6B6B] mt-2">Responda pelo menos 3 perguntas para concluir</p>
          )}
        </div>
      </div>
    </div>
  );
}
