"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, CheckCircle, AlertCircle, Clock, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Contrato } from "./contratos-tab";

export type Cobranca = {
  id: string;
  contrato_id: string | null;
  cliente_id: string;
  cliente_nome?: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: "pendente" | "pago" | "atrasado" | "cancelado";
  data_pagamento: string | null;
  criado_em: string;
};

type Cliente = { id: string; nome: string };

const STATUS_LABELS: Record<string, string> = { pendente: "Pendente", pago: "Pago", atrasado: "Atrasado", cancelado: "Cancelado" };
const STATUS_CORES: Record<string, string> = { pendente: "#C9A84C", pago: "#27AE60", atrasado: "#C0392B", cancelado: "#95A5A6" };
const STATUS_ICONS = { pendente: Clock, pago: CheckCircle, atrasado: AlertCircle, cancelado: Clock };

const EMPTY = {
  contrato_id: null as string | null,
  cliente_id: "",
  descricao: "",
  valor: 0,
  vencimento: new Date().toISOString().split("T")[0],
  status: "pendente" as Cobranca["status"],
  data_pagamento: null as string | null,
};

export default function CobrancasTab({ cobrancas, clientes, contratos, onRefresh }: {
  cobrancas: Cobranca[]; clientes: Cliente[]; contratos: Contrato[]; onRefresh: () => void;
}) {
  const supabase = createClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [salvando, setSalvando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("pendente");

  // Marcar atrasadas automaticamente (sem alterar DB, só visual)
  const hoje = new Date().toISOString().split("T")[0];
  const cobransaProcessadas = cobrancas.map((c) => ({
    ...c,
    status: (c.status === "pendente" && c.vencimento < hoje ? "atrasado" : c.status) as Cobranca["status"],
  }));

  function abrirNovo() {
    setForm({ ...EMPTY, cliente_id: clientes[0]?.id ?? "" });
    setModalAberto(true);
  }

  function preencherContrato(contratoId: string) {
    const contrato = contratos.find((c) => c.id === contratoId);
    if (contrato) {
      setForm((f) => ({
        ...f,
        contrato_id: contratoId,
        cliente_id: contrato.cliente_id,
        descricao: contrato.descricao,
        valor: contrato.valor_mensal,
      }));
    } else {
      setForm((f) => ({ ...f, contrato_id: null }));
    }
  }

  async function salvar() {
    if (!form.cliente_id || !form.descricao.trim() || form.valor <= 0) return;
    setSalvando(true);
    await supabase.from("cobrancas").insert(form);
    setSalvando(false);
    setModalAberto(false);
    onRefresh();
  }

  async function marcarPago(id: string) {
    const hoje = new Date().toISOString().split("T")[0];
    await supabase.from("cobrancas").update({ status: "pago", data_pagamento: hoje }).eq("id", id);
    onRefresh();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir cobrança?")) return;
    await supabase.from("cobrancas").delete().eq("id", id);
    onRefresh();
  }

  const filtradas = filtroStatus === "todos"
    ? cobransaProcessadas
    : cobransaProcessadas.filter((c) => c.status === filtroStatus);

  const totalFiltrado = filtradas.reduce((s, c) => s + c.valor, 0);
  const totalAtrasado = cobransaProcessadas.filter((c) => c.status === "atrasado").reduce((s, c) => s + c.valor, 0);
  const totalPendente = cobransaProcessadas.filter((c) => c.status === "pendente").reduce((s, c) => s + c.valor, 0);

  const contratosDoCliente = form.cliente_id
    ? contratos.filter((c) => c.cliente_id === form.cliente_id && c.status === "ativo")
    : [];

  return (
    <div>
      {/* Resumo */}
      {cobrancas.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-4">
            <p className="text-xs text-text-muted mb-1">A receber</p>
            <p className="font-mono-data text-xl font-bold text-text-main">{formatCurrency(totalPendente)}</p>
          </div>
          <div className="bg-surface rounded-card border border-warning/30 p-4">
            <p className="text-xs text-text-muted mb-1">Em atraso</p>
            <p className="font-mono-data text-xl font-bold text-warning">{formatCurrency(totalAtrasado)}</p>
          </div>
          <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-4">
            <p className="text-xs text-text-muted mb-1">Recebido (mês)</p>
            <p className="font-mono-data text-xl font-bold text-success">
              {formatCurrency(cobransaProcessadas.filter((c) => c.status === "pago" && c.data_pagamento?.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, c) => s + c.valor, 0))}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1 flex-wrap">
          {["atrasado", "pendente", "pago", "todos"].map((s) => {
            const count = s === "todos" ? cobransaProcessadas.length : cobransaProcessadas.filter((c) => c.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFiltroStatus(s)}
                className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-colors ${filtroStatus === s ? "bg-primary text-gold" : "bg-surface text-text-muted hover:text-text-main border border-[#E8D5A3]/50"}`}
              >
                {s === "todos" ? "Todos" : STATUS_LABELS[s]}
                <span className="ml-1.5 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto">
          <Button onClick={abrirNovo}><Plus size={15} /> Nova cobrança</Button>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-4">Nenhuma cobrança aqui.</p>
          <Button onClick={abrirNovo}><Plus size={15} /> Criar cobrança</Button>
        </div>
      ) : (
        <div>
          <div className="space-y-2">
            {filtradas
              .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
              .map((c) => {
                const Icon = STATUS_ICONS[c.status];
                const isAtrasada = c.status === "atrasado";
                const isPaga = c.status === "pago";
                return (
                  <div key={c.id} className={`flex items-center gap-4 px-5 py-4 rounded-card border ${isAtrasada ? "border-danger/30 bg-danger/5" : "border-[#E8D5A3]/50 bg-surface"}`}>
                    <Icon size={18} style={{ color: STATUS_CORES[c.status] }} className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-main truncate">{c.cliente_nome} — {c.descricao}</p>
                      <p className="text-xs text-text-muted">
                        {isPaga ? `Pago em ${formatDate(c.data_pagamento!)}` : `Vencimento: ${formatDate(c.vencimento)}`}
                      </p>
                    </div>
                    <p className="font-mono-data font-semibold flex-shrink-0" style={{ color: isPaga ? STATUS_CORES.pago : isAtrasada ? STATUS_CORES.atrasado : "inherit" }}>
                      {formatCurrency(c.valor)}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!isPaga && c.status !== "cancelado" && (
                        <button
                          onClick={() => marcarPago(c.id)}
                          className="text-xs px-2.5 py-1 rounded-btn bg-success/10 text-success hover:bg-success/20 transition-colors font-medium"
                        >
                          Marcar pago
                        </button>
                      )}
                      <button onClick={() => excluir(c.id)} className="p-1.5 text-text-muted hover:text-danger hover:bg-bg rounded transition-colors ml-1">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
          {filtroStatus !== "todos" && (
            <p className="text-xs text-text-muted mt-4 text-right">Total: <strong>{formatCurrency(totalFiltrado)}</strong></p>
          )}
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-card shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E8D5A3]/30">
              <h2 className="font-display text-xl font-semibold text-text-main">Nova cobrança</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Cliente *</Label>
                <select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value, contrato_id: null })} className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
                  <option value="">Selecionar cliente</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              {contratosDoCliente.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Contrato (opcional)</Label>
                  <select value={form.contrato_id ?? ""} onChange={(e) => preencherContrato(e.target.value)} className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
                    <option value="">— Sem contrato —</option>
                    {contratosDoCliente.map((c) => <option key={c.id} value={c.id}>{c.descricao}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Descrição *</Label>
                <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Retainer — Julho 2025" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Valor (R$) *</Label>
                  <Input type="number" value={form.valor || ""} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label>Vencimento</Label>
                  <Input type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#E8D5A3]/30 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button onClick={salvar} disabled={salvando || !form.cliente_id || !form.descricao.trim() || form.valor <= 0}>{salvando ? "Salvando..." : "Salvar"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
