"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, CheckCircle, Circle, Clock, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Item = {
  id: string;
  descricao: string;
  status: string;
  responsavel?: string;
  prazo?: string;
  prioridade?: string;
  observacoes?: string;
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cor: string }> = {
  pendente:     { label: "Pendente",     icon: <Circle size={16} />,        cor: "#6B7280" },
  em_andamento: { label: "Em andamento", icon: <Clock size={16} />,         cor: "#D97706" },
  concluido:    { label: "Concluído",    icon: <CheckCircle size={16} />,   cor: "#16A34A" },
  bloqueado:    { label: "Bloqueado",    icon: <AlertCircle size={16} />,   cor: "#DC2626" },
};

const PRIORIDADE_CONFIG: Record<string, { label: string; cor: string }> = {
  alta:  { label: "Alta",  cor: "#DC2626" },
  media: { label: "Média", cor: "#D97706" },
  baixa: { label: "Baixa", cor: "#16A34A" },
};

export default function PortalPlano() {
  const supabase = createClient();
  const [itens, setItens] = useState<Item[]>([]);
  const [filtro, setFiltro] = useState<"todos" | "pendente" | "em_andamento" | "concluido">("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: vinculo } = await supabase
      .from("usuarios_clientes")
      .select("cliente_id")
      .eq("usuario_id", user.id)
      .single();

    if (!vinculo) { setLoading(false); return; }

    const { data: planos } = await supabase
      .from("planos_acao")
      .select("id")
      .eq("cliente_id", vinculo.cliente_id)
      .limit(1);

    if (!planos || planos.length === 0) { setLoading(false); return; }

    const { data: itensData } = await supabase
      .from("itens_plano_acao")
      .select("id, descricao, status, responsavel, prazo, prioridade, observacoes")
      .eq("plano_id", planos[0].id)
      .order("prioridade", { ascending: true })
      .order("prazo", { ascending: true });

    if (itensData) setItens(itensData as Item[]);
    setLoading(false);
  }

  const filtrados = filtro === "todos" ? itens : itens.filter((i) => i.status === filtro);
  const concluidos = itens.filter((i) => i.status === "concluido").length;
  const progresso = itens.length > 0 ? Math.round((concluidos / itens.length) * 100) : 0;

  const hoje = new Date().toISOString().split("T")[0];
  const vencidos = itens.filter((i) => i.status !== "concluido" && i.prazo && i.prazo < hoje).length;

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <header className="bg-[#0D2B2E] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/portal" className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-[#C9A84C] font-display text-lg font-bold">Mendonça & Co</h1>
            <p className="text-white/50 text-xs">Plano de Ação</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-[#0D2B2E]">Plano de Ação</h2>
          <p className="text-[#6B7280] text-sm mt-1">{itens.length} item{itens.length !== 1 ? "s" : ""} · {concluidos} concluído{concluidos !== 1 ? "s" : ""}</p>
        </div>

        {/* Progresso */}
        {itens.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E8D5A3]/50 p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#0D2B2E]">Progresso geral</span>
              <span className="text-2xl font-bold text-[#C9A84C]">{progresso}%</span>
            </div>
            <div className="w-full bg-[#E8D5A3]/40 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-[#C9A84C] transition-all"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <div className="flex gap-4 mt-3 text-xs text-[#6B7280]">
              <span className="flex items-center gap-1"><CheckCircle size={11} className="text-green-600" /> {concluidos} concluídos</span>
              <span className="flex items-center gap-1"><Clock size={11} className="text-yellow-600" /> {itens.filter((i) => i.status === "em_andamento").length} em andamento</span>
              {vencidos > 0 && (
                <span className="flex items-center gap-1 text-red-500"><AlertCircle size={11} /> {vencidos} vencido{vencidos !== 1 ? "s" : ""}</span>
              )}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex rounded-xl border border-[#E8D5A3] overflow-hidden text-xs w-fit mb-5">
          {(["todos", "pendente", "em_andamento", "concluido"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-2 transition-all ${filtro === f ? "bg-[#0D2B2E] text-[#C9A84C]" : "bg-white text-[#6B7280]"}`}
            >
              {f === "todos" ? "Todos" : STATUS_CONFIG[f]?.label ?? f}
              <span className="ml-1 opacity-60">
                ({f === "todos" ? itens.length : itens.filter((i) => i.status === f).length})
              </span>
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-center text-[#6B7280] text-sm py-12">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-[#6B7280]">
            <CheckCircle size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">{filtro === "concluido" ? "Nenhum item concluído ainda." : "Nenhum item nesta categoria."}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtrados.map((item) => {
              const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pendente;
              const prio = item.prioridade ? PRIORIDADE_CONFIG[item.prioridade] : null;
              const vencido = item.status !== "concluido" && item.prazo && item.prazo < hoje;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-4 ${
                    item.status === "concluido" ? "border-green-100 opacity-70" :
                    vencido ? "border-red-200" : "border-[#E8D5A3]/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div style={{ color: cfg.cor }} className="flex-shrink-0 mt-0.5">
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-snug ${item.status === "concluido" ? "line-through text-[#9CA3AF]" : "text-[#0D2B2E]"}`}>
                        {item.descricao}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: cfg.cor + "15", color: cfg.cor }}
                        >
                          {cfg.label}
                        </span>
                        {prio && (
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: prio.cor + "15", color: prio.cor }}
                          >
                            {prio.label} prioridade
                          </span>
                        )}
                        {item.prazo && (
                          <span className={`text-[10px] flex items-center gap-1 ${vencido ? "text-red-500 font-semibold" : "text-[#9CA3AF]"}`}>
                            {vencido ? <AlertCircle size={10} /> : <Clock size={10} />}
                            {vencido ? "Vencido em " : "Prazo: "}{formatDate(item.prazo)}
                          </span>
                        )}
                        {item.responsavel && (
                          <span className="text-[10px] text-[#9CA3AF]">
                            Resp.: {item.responsavel}
                          </span>
                        )}
                      </div>
                      {item.observacoes && (
                        <p className="text-xs text-[#6B7280] mt-1.5 italic">{item.observacoes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
