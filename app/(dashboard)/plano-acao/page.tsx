"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

type Plano = {
  id: string;
  tipo: string;
  respondente_nome: string;
  respondente_email?: string;
  empresa?: string;
  criado_em: string;
  total: number;
  concluidos: number;
  em_andamento: number;
};

const TIPO_LABELS: Record<string, string> = {
  diagnostico_3d: "Diagnóstico 3D",
  radar_360: "Radar 360",
  disc: "DISC",
  q12: "Q12",
  gptw: "GPTW",
  canvas_estrategico: "Canvas Estratégico",
  rodada_q12: "Rodada Q12",
  rodada_gptw: "Rodada GPTW",
};

const TIPO_COR: Record<string, string> = {
  diagnostico_3d: "#0D2B2E",
  radar_360: "#2980B9",
  disc: "#E67E22",
  q12: "#27AE60",
  gptw: "#8E44AD",
  canvas_estrategico: "#C9A84C",
  rodada_q12: "#27AE60",
  rodada_gptw: "#8E44AD",
};

export default function PlanoAcaoPage() {
  const supabase = createClient();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [filtro, setFiltro] = useState<"todos" | "em_andamento" | "concluidos">("todos");

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data } = await supabase
      .from("planos_acao")
      .select(`
        id, tipo, respondente_nome, respondente_email, empresa, criado_em,
        plano_acao_itens(status)
      `)
      .order("criado_em", { ascending: false });

    if (data) {
      setPlanos(data.map((p) => {
        const itens = p.plano_acao_itens as { status: string }[] ?? [];
        return {
          id: p.id,
          tipo: p.tipo,
          respondente_nome: p.respondente_nome,
          respondente_email: p.respondente_email,
          empresa: p.empresa,
          criado_em: p.criado_em,
          total: itens.length,
          concluidos: itens.filter((i) => i.status === "concluido").length,
          em_andamento: itens.filter((i) => i.status === "em_andamento").length,
        };
      }));
    }
  }

  const filtrados = planos.filter((p) => {
    if (filtro === "concluidos") return p.concluidos === p.total && p.total > 0;
    if (filtro === "em_andamento") return p.concluidos < p.total;
    return true;
  });

  const totalPlanos = planos.length;
  const totalConcluidos = planos.filter((p) => p.concluidos === p.total && p.total > 0).length;
  const totalEmAndamento = planos.filter((p) => p.em_andamento > 0).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-text-main">Planos de Ação</h1>
        <p className="text-text-muted mt-1">Acompanhamento de ações por diagnóstico</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total de planos", value: totalPlanos, icon: CheckSquare, cor: "#0D2B2E" },
          { label: "Em andamento", value: totalEmAndamento, icon: Clock, cor: "#C9A84C" },
          { label: "Concluídos", value: totalConcluidos, icon: CheckSquare, cor: "#27AE60" },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-btn flex items-center justify-center" style={{ backgroundColor: m.cor + "15" }}>
                <m.icon size={18} style={{ color: m.cor }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-main font-mono-data">{m.value}</p>
                <p className="text-xs text-text-muted">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {(["todos", "em_andamento", "concluidos"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-btn text-sm font-medium transition-all ${
              filtro === f
                ? "bg-primary text-gold"
                : "bg-surface text-text-muted border border-[#E8D5A3]/50 hover:text-text-main"
            }`}
          >
            {f === "todos" ? "Todos" : f === "em_andamento" ? "Em andamento" : "Concluídos"}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtrados.map((p) => {
          const progresso = p.total > 0 ? Math.round((p.concluidos / p.total) * 100) : 0;
          const cor = TIPO_COR[p.tipo] ?? "#0D2B2E";
          const concluido = p.concluidos === p.total && p.total > 0;

          return (
            <Link key={p.id} href={`/plano-acao/${p.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-btn flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: cor }}>
                      {TIPO_LABELS[p.tipo]?.slice(0, 3) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-text-main">{p.respondente_nome}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: cor }}>
                          {TIPO_LABELS[p.tipo]}
                        </span>
                        {concluido && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
                            ✓ Concluído
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">
                        {p.empresa && `${p.empresa} · `}{formatDate(p.criado_em)}
                      </p>
                      {/* Barra de progresso */}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[#E8D5A3]/40 rounded-full">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${progresso}%`, backgroundColor: concluido ? "#27AE60" : cor }}
                          />
                        </div>
                        <span className="text-xs text-text-muted font-mono-data whitespace-nowrap">
                          {p.concluidos}/{p.total} ações
                        </span>
                      </div>
                    </div>
                    <ExternalLink size={15} className="text-text-muted flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {filtrados.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle size={36} className="mx-auto mb-3 text-text-muted opacity-40" />
            <p className="text-text-muted text-sm">
              {filtro === "todos"
                ? "Nenhum plano de ação ainda. Gere um PDF de qualquer diagnóstico para criar o plano automaticamente."
                : "Nenhum plano nesta categoria."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
