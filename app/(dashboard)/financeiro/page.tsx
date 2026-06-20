"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp, FileText, Receipt } from "lucide-react";
import MRRTab from "@/components/financeiro/mrr-tab";
import ContratosTab, { type Contrato } from "@/components/financeiro/contratos-tab";
import CobrancasTab, { type Cobranca } from "@/components/financeiro/cobrancas-tab";
import { formatCurrency } from "@/lib/utils";

type Aba = "mrr" | "contratos" | "cobrancas";
type Cliente = { id: string; nome: string };

const ABAS: { key: Aba; label: string; icon: React.ElementType }[] = [
  { key: "mrr",       label: "Dashboard MRR", icon: TrendingUp },
  { key: "contratos", label: "Contratos",      icon: FileText },
  { key: "cobrancas", label: "Cobranças",      icon: Receipt },
];

export default function FinanceiroPage() {
  const supabase = createClient();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("mrr");
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const [c, cb, cl] = await Promise.all([
      supabase.from("contratos").select("*, clientes(nome)").order("criado_em", { ascending: false }),
      supabase.from("cobrancas").select("*, clientes(nome)").order("vencimento"),
      supabase.from("clientes").select("id, nome").eq("status", "ativo").order("nome"),
    ]);

    if (c.data) setContratos(c.data.map((x: Contrato & { clientes: { nome: string } | null }) => ({ ...x, cliente_nome: x.clientes?.nome ?? "—" })));
    if (cb.data) setCobrancas(cb.data.map((x: Cobranca & { clientes: { nome: string } | null }) => ({ ...x, cliente_nome: x.clientes?.nome ?? "—" })));
    if (cl.data) setClientes(cl.data as Cliente[]);
  }

  // KPIs para o header
  const mrr = contratos.filter((c) => c.tipo === "retainer" && c.status === "ativo").reduce((s, c) => s + c.valor_mensal, 0);
  const hoje = new Date().toISOString().split("T")[0];
  const atrasadas = cobrancas.filter((c) => c.status === "pendente" && c.vencimento < hoje).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">Financeiro</h1>
          <p className="text-text-muted mt-1">
            MRR <span className="font-mono-data font-semibold text-text-main">{formatCurrency(mrr)}</span>
            {atrasadas > 0 && (
              <span className="ml-3 text-danger">· {atrasadas} cobrança{atrasadas > 1 ? "s" : ""} em atraso</span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-surface rounded-btn p-1 w-fit border border-[#E8D5A3]/50">
        {ABAS.map((aba) => {
          const Icon = aba.icon;
          return (
            <button
              key={aba.key}
              onClick={() => setAbaAtiva(aba.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all ${
                abaAtiva === aba.key ? "bg-primary text-gold shadow-sm" : "text-text-muted hover:text-text-main"
              }`}
            >
              <Icon size={15} />
              {aba.label}
              {aba.key === "contratos" && contratos.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${abaAtiva === aba.key ? "bg-gold/20 text-gold" : "bg-[#E8D5A3]/30 text-text-muted"}`}>
                  {contratos.filter((c) => c.status === "ativo").length}
                </span>
              )}
              {aba.key === "cobrancas" && atrasadas > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-danger/20 text-danger">{atrasadas}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      {abaAtiva === "mrr" && <MRRTab contratos={contratos} cobrancas={cobrancas} />}
      {abaAtiva === "contratos" && <ContratosTab contratos={contratos} clientes={clientes} onRefresh={carregarDados} />}
      {abaAtiva === "cobrancas" && <CobrancasTab cobrancas={cobrancas} clientes={clientes} contratos={contratos} onRefresh={carregarDados} />}
    </div>
  );
}
