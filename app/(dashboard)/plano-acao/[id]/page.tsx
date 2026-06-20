"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CheckCircle, Circle, Clock } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

type Status = "pendente" | "em_andamento" | "concluido";

type Item = {
  id: string;
  dimensao: string;
  acao: string;
  status: Status;
  nota?: string;
  atualizado_em?: string;
};

type Plano = {
  id: string;
  tipo: string;
  respondente_nome: string;
  respondente_email?: string;
  empresa?: string;
  criado_em: string;
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

const STATUS_CONFIG: Record<Status, { label: string; icon: typeof Circle; cor: string }> = {
  pendente: { label: "Pendente", icon: Circle, cor: "#6B6B6B" },
  em_andamento: { label: "Em andamento", icon: Clock, cor: "#C9A84C" },
  concluido: { label: "Concluído", icon: CheckCircle, cor: "#27AE60" },
};

const PROXIMO_STATUS: Record<Status, Status> = {
  pendente: "em_andamento",
  em_andamento: "concluido",
  concluido: "pendente",
};

export default function PlanoAcaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const [plano, setPlano] = useState<Plano | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [notaAberta, setNotaAberta] = useState<string | null>(null);
  const [notaTexto, setNotaTexto] = useState("");
  const [salvandoNota, setSalvandoNota] = useState(false);

  const carregar = useCallback(async () => {
    const { data: p } = await supabase
      .from("planos_acao")
      .select("*")
      .eq("id", id)
      .single();
    if (p) setPlano(p);

    const { data: is } = await supabase
      .from("plano_acao_itens")
      .select("*")
      .eq("plano_id", id)
      .order("dimensao");
    if (is) setItens(is);
  }, [id, supabase]);

  useEffect(() => { carregar(); }, [carregar]);

  async function toggleStatus(item: Item) {
    const novoStatus = PROXIMO_STATUS[item.status];
    setItens((prev) => prev.map((i) => i.id === item.id ? { ...i, status: novoStatus } : i));
    await fetch("/api/plano-acao/item", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, status: novoStatus }),
    });
  }

  async function salvarNota(itemId: string) {
    setSalvandoNota(true);
    setItens((prev) => prev.map((i) => i.id === itemId ? { ...i, nota: notaTexto } : i));
    await fetch("/api/plano-acao/item", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, nota: notaTexto }),
    });
    setSalvandoNota(false);
    setNotaAberta(null);
  }

  if (!plano) return null;

  const total = itens.length;
  const concluidos = itens.filter((i) => i.status === "concluido").length;
  const emAndamento = itens.filter((i) => i.status === "em_andamento").length;
  const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  // Agrupar por dimensão
  const porDimensao = itens.reduce<Record<string, Item[]>>((acc, item) => {
    if (!acc[item.dimensao]) acc[item.dimensao] = [];
    acc[item.dimensao].push(item);
    return acc;
  }, {});

  return (
    <div>
      {/* Voltar */}
      <Link href="/plano-acao" className="flex items-center gap-2 text-sm text-text-muted hover:text-text-main mb-6 transition-colors">
        <ChevronLeft size={16} /> Todos os planos
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
            {TIPO_LABELS[plano.tipo]}
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold text-text-main">{plano.respondente_nome}</h1>
        <p className="text-text-muted mt-1 text-sm">
          {plano.empresa && `${plano.empresa} · `}
          {plano.respondente_email && `${plano.respondente_email} · `}
          {formatDate(plano.criado_em)}
        </p>
      </div>

      {/* Progresso */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-text-main mb-1">Progresso geral</p>
              <p className="text-xs text-text-muted">{concluidos} de {total} ações concluídas</p>
            </div>
            <span className="font-mono-data text-3xl font-bold text-text-main">{progresso}%</span>
          </div>
          <div className="h-3 bg-[#E8D5A3]/40 rounded-full">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${progresso}%`,
                backgroundColor: progresso === 100 ? "#27AE60" : "#C9A84C",
              }}
            />
          </div>
          <div className="flex gap-6 mt-4">
            {[
              { label: "Pendentes", value: total - concluidos - emAndamento, cor: "#6B6B6B" },
              { label: "Em andamento", value: emAndamento, cor: "#C9A84C" },
              { label: "Concluídas", value: concluidos, cor: "#27AE60" },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.cor }} />
                <span className="text-xs text-text-muted">{m.label}: <strong className="text-text-main">{m.value}</strong></span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Itens por dimensão */}
      <div className="space-y-6">
        {Object.entries(porDimensao).map(([dimensao, items]) => (
          <div key={dimensao}>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">{dimensao}</h2>
            <div className="space-y-3">
              {items.map((item) => {
                const cfg = STATUS_CONFIG[item.status];
                const Icon = cfg.icon;
                const notaEstaAberta = notaAberta === item.id;

                return (
                  <Card key={item.id} className={`transition-all ${item.status === "concluido" ? "opacity-70" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleStatus(item)}
                          className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
                          title={`Clique para marcar como: ${PROXIMO_STATUS[item.status]}`}
                        >
                          <Icon size={20} style={{ color: cfg.cor }} />
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-relaxed ${item.status === "concluido" ? "line-through text-text-muted" : "text-text-main"}`}>
                            {item.acao}
                          </p>

                          {/* Status badge */}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs font-medium" style={{ color: cfg.cor }}>
                              ● {cfg.label}
                            </span>
                            {item.atualizado_em && (
                              <span className="text-xs text-text-muted">
                                Atualizado {formatDate(item.atualizado_em)}
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setNotaAberta(notaEstaAberta ? null : item.id);
                                setNotaTexto(item.nota ?? "");
                              }}
                              className="text-xs text-text-muted hover:text-gold transition-colors ml-auto"
                            >
                              {item.nota ? "✎ Ver nota" : "+ Nota"}
                            </button>
                          </div>

                          {/* Nota existente */}
                          {item.nota && !notaEstaAberta && (
                            <div className="mt-2 p-3 bg-bg rounded-btn border-l-2 border-gold/40">
                              <p className="text-xs text-text-muted italic">{item.nota}</p>
                            </div>
                          )}

                          {/* Editar nota */}
                          {notaEstaAberta && (
                            <div className="mt-3">
                              <textarea
                                className="w-full border border-[#E8D5A3] rounded-btn p-3 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
                                rows={3}
                                placeholder="Adicione uma nota, observação ou próximo passo..."
                                value={notaTexto}
                                onChange={(e) => setNotaTexto(e.target.value)}
                              />
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" onClick={() => salvarNota(item.id)} disabled={salvandoNota}>
                                  {salvandoNota ? "Salvando..." : "Salvar nota"}
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => setNotaAberta(null)}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {progresso === 100 && (
        <div className="mt-8 p-6 bg-success/10 rounded-card border border-success/20 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="font-display text-lg font-bold text-success">Plano de ação concluído!</p>
          <p className="text-sm text-text-muted mt-1">Todas as ações foram implementadas. Hora de evoluir para o próximo diagnóstico.</p>
        </div>
      )}
    </div>
  );
}
