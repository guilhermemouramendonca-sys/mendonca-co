"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, GitBranch, Target, BarChart3, ChevronDown } from "lucide-react";
import FuncionariosTab, { type Funcionario } from "@/components/rh/funcionarios-tab";
import OrganogramaTab from "@/components/rh/organograma-tab";
import OKRsTab, { type OKR } from "@/components/rh/okrs-tab";
import BSCTab, { type BscIndicador } from "@/components/rh/bsc-tab";

type Cliente = { id: string; nome: string; status: string };
type Aba = "funcionarios" | "organograma" | "okrs" | "bsc";

const ABAS: { key: Aba; label: string; icon: React.ElementType }[] = [
  { key: "funcionarios",  label: "Funcionários", icon: Users },
  { key: "organograma",   label: "Organograma",  icon: GitBranch },
  { key: "okrs",          label: "OKRs",          icon: Target },
  { key: "bsc",           label: "BSC",           icon: BarChart3 },
];

export default function RHPage() {
  const supabase = createClient();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState<string>("");
  const [abaAtiva, setAbaAtiva] = useState<Aba>("funcionarios");
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [bscIndicadores, setBscIndicadores] = useState<BscIndicador[]>([]);
  const [dropdownAberto, setDropdownAberto] = useState(false);

  useEffect(() => {
    async function carregarClientes() {
      const { data } = await supabase.from("clientes").select("id, nome, status").eq("status", "ativo").order("nome");
      if (data) {
        setClientes(data as Cliente[]);
        if (data.length > 0) setClienteId(data[0].id);
      }
    }
    carregarClientes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (clienteId) carregarDados();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  async function carregarDados() {
    const [f, o, b] = await Promise.all([
      supabase.from("funcionarios").select("*").eq("cliente_id", clienteId).order("nome"),
      supabase.from("okrs").select("*").eq("cliente_id", clienteId).order("criado_em", { ascending: false }),
      supabase.from("bsc_indicadores").select("*").eq("cliente_id", clienteId).order("perspectiva"),
    ]);
    if (f.data) setFuncionarios(f.data as Funcionario[]);
    if (o.data) setOkrs(o.data as OKR[]);
    if (b.data) setBscIndicadores(b.data as BscIndicador[]);
  }

  const clienteSelecionado = clientes.find((c) => c.id === clienteId);

  if (clientes.length === 0) {
    return (
      <div>
        <h1 className="font-display text-4xl font-bold text-text-main mb-2">RH do Cliente</h1>
        <p className="text-text-muted text-sm mt-4">Nenhum cliente ativo cadastrado. Cadastre clientes primeiro em <strong>Clientes</strong>.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">RH do Cliente</h1>
          <p className="text-text-muted mt-1">Funcionários · Organograma · OKRs · BSC</p>
        </div>

        {/* Seletor de cliente */}
        <div className="relative">
          <button
            onClick={() => setDropdownAberto(!dropdownAberto)}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-[#E8D5A3]/50 rounded-btn text-sm font-medium text-text-main hover:border-gold/50 transition-colors min-w-52"
          >
            <span className="flex-1 text-left truncate">{clienteSelecionado?.nome ?? "Selecionar cliente"}</span>
            <ChevronDown size={15} className={`text-text-muted transition-transform ${dropdownAberto ? "rotate-180" : ""}`} />
          </button>
          {dropdownAberto && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-surface border border-[#E8D5A3]/50 rounded-card shadow-lg z-20 overflow-hidden">
              {clientes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setClienteId(c.id); setDropdownAberto(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${c.id === clienteId ? "bg-gold/10 text-gold font-medium" : "text-text-main hover:bg-bg"}`}
                >
                  {c.nome}
                </button>
              ))}
            </div>
          )}
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
                abaAtiva === aba.key
                  ? "bg-primary text-gold shadow-sm"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              <Icon size={15} />
              {aba.label}
              {aba.key === "funcionarios" && funcionarios.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${abaAtiva === aba.key ? "bg-gold/20 text-gold" : "bg-[#E8D5A3]/30 text-text-muted"}`}>
                  {funcionarios.length}
                </span>
              )}
              {aba.key === "okrs" && okrs.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${abaAtiva === aba.key ? "bg-gold/20 text-gold" : "bg-[#E8D5A3]/30 text-text-muted"}`}>
                  {okrs.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      {abaAtiva === "funcionarios" && (
        <FuncionariosTab clienteId={clienteId} funcionarios={funcionarios} onRefresh={carregarDados} />
      )}
      {abaAtiva === "organograma" && (
        <OrganogramaTab funcionarios={funcionarios} />
      )}
      {abaAtiva === "okrs" && (
        <OKRsTab clienteId={clienteId} okrs={okrs} onRefresh={carregarDados} />
      )}
      {abaAtiva === "bsc" && (
        <BSCTab clienteId={clienteId} indicadores={bscIndicadores} onRefresh={carregarDados} />
      )}
    </div>
  );
}
