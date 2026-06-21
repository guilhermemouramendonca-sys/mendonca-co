"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Cliente } from "@/app/(dashboard)/clientes/page";

type Props = {
  cliente: Cliente | null;
  onClose: () => void;
  onSave: () => void;
};

const SETORES = ["Tecnologia", "Saúde", "Educação", "Varejo", "Indústria", "Agronegócio", "Serviços", "Construção", "Financeiro", "Outro"];
const PORTES = [{ value: "micro", label: "Micro" }, { value: "pequena", label: "Pequena" }, { value: "media", label: "Média" }, { value: "grande", label: "Grande" }];
const MODELOS = [{ value: "presencial", label: "Presencial" }, { value: "remoto", label: "Remoto" }, { value: "hibrido", label: "Híbrido" }];

export function ClienteModal({ cliente, onClose, onSave }: Props) {
  const supabase = createClient();
  const isNovo = !cliente;

  const [form, setForm] = useState({
    nome: cliente?.nome ?? "",
    razao_social: cliente?.razao_social ?? "",
    cnpj: cliente?.cnpj ?? "",
    setor: cliente?.setor ?? "",
    porte: cliente?.porte ?? "",
    num_funcionarios: cliente?.num_funcionarios?.toString() ?? "",
    faturamento_estimado: cliente?.faturamento_estimado ? String(cliente.faturamento_estimado).replace(/\D/g, "") : "",
    modelo_trabalho: cliente?.modelo_trabalho ?? "",
    data_inicio_contrato: cliente?.data_inicio_contrato ?? "",
    status: cliente?.status ?? "ativo",
    observacoes: cliente?.observacoes ?? "",
  });

  const [salvando, setSalvando] = useState(false);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function handleFaturamento(e: React.ChangeEvent<HTMLInputElement>) {
    const apenasNumeros = e.target.value.replace(/\D/g, "");
    setForm((p) => ({ ...p, faturamento_estimado: apenasNumeros }));
  }

  function faturamentoFormatado() {
    if (!form.faturamento_estimado) return "";
    const num = parseInt(form.faturamento_estimado);
    if (isNaN(num)) return "";
    return num.toLocaleString("pt-BR") + ",00";
  }

  async function salvar() {
    if (!form.nome.trim()) return;
    setSalvando(true);

    const payload = {
      ...form,
      num_funcionarios: form.num_funcionarios ? parseInt(form.num_funcionarios) : null,
      faturamento_estimado: form.faturamento_estimado ? parseInt(form.faturamento_estimado) : null,
      atualizado_em: new Date().toISOString(),
    };

    if (isNovo) {
      await supabase.from("clientes").insert(payload);
    } else {
      await supabase.from("clientes").update(payload).eq("id", cliente!.id);
    }

    onSave();
    onClose();
    setSalvando(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-card w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-[#E8D5A3]/50">
          <h2 className="font-display text-2xl font-semibold text-text-main">
            {isNovo ? "Novo Cliente" : "Editar Cliente"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Nome da empresa *</Label>
              <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Nome comercial" />
            </div>
            <div className="space-y-1.5">
              <Label>Razão social</Label>
              <Input value={form.razao_social} onChange={(e) => set("razao_social", e.target.value)} placeholder="Razão Social Ltda" />
            </div>
            <div className="space-y-1.5">
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Setor</Label>
              <select value={form.setor} onChange={(e) => set("setor", e.target.value)}
                className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold">
                <option value="">Selecione...</option>
                {SETORES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Porte</Label>
              <select value={form.porte} onChange={(e) => set("porte", e.target.value)}
                className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold">
                <option value="">Selecione...</option>
                {PORTES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Nº de funcionários</Label>
              <Input type="number" value={form.num_funcionarios} onChange={(e) => set("num_funcionarios", e.target.value)} placeholder="Ex: 50" />
            </div>
            <div className="space-y-1.5">
              <Label>Faturamento / ano</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={faturamentoFormatado()}
                  onChange={handleFaturamento}
                  placeholder="0,00"
                  className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface pl-9 pr-3 py-2 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Modelo de trabalho</Label>
              <select value={form.modelo_trabalho} onChange={(e) => set("modelo_trabalho", e.target.value)}
                className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold">
                <option value="">Selecione...</option>
                {MODELOS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Início do contrato</Label>
              <Input type="date" value={form.data_inicio_contrato} onChange={(e) => set("data_inicio_contrato", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold">
                <option value="ativo">Ativo</option>
                <option value="pausado">Pausado</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Anotações estratégicas (privado)</Label>
            <textarea
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              rows={3}
              placeholder="Observações internas sobre o cliente..."
              className="flex w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E8D5A3]/50">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando || !form.nome.trim()}>
            {salvando ? "Salvando..." : isNovo ? "Cadastrar Cliente" : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
