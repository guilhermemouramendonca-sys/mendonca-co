"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FileText, Download, Search, CheckCircle, XCircle, Clock, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type Proposta = {
  id: string;
  numero: number;
  nome_prospect: string;
  empresa?: string;
  email?: string;
  servico: string;
  descricao?: string;
  valor?: number;
  condicao_pagamento?: string;
  validade_dias: number;
  status: string;
  pdf_url?: string;
  observacoes?: string;
  criado_em: string;
};

const SERVICOS = [
  { value: "mentoria_3d", label: "Mentoria Estratégica 3D" },
  { value: "diagnostico_board", label: "Diagnóstico Board" },
  { value: "palestra", label: "Palestra / Workshop" },
  { value: "mentoria_expressa", label: "Mentoria Expressa" },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" | "muted" | "info"; icon: React.ReactNode }> = {
  rascunho: { label: "Rascunho", variant: "muted", icon: <FileText size={12} /> },
  enviada: { label: "Enviada", variant: "info", icon: <Send size={12} /> },
  aceita: { label: "Aceita", variant: "success", icon: <CheckCircle size={12} /> },
  recusada: { label: "Recusada", variant: "danger", icon: <XCircle size={12} /> },
  expirada: { label: "Expirada", variant: "warning", icon: <Clock size={12} /> },
};

const FORM_INICIAL = {
  nomeProspect: "",
  empresa: "",
  email: "",
  servico: "mentoria_3d",
  descricao: "",
  valor: "",
  condicaoPagamento: "",
  validadeDias: "15",
  observacoes: "",
};

export default function PropostasPage() {
  const supabase = createClient();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [gerando, setGerando] = useState(false);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data } = await supabase
      .from("propostas")
      .select("*")
      .order("criado_em", { ascending: false });
    if (data) setPropostas(data as Proposta[]);
  }

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function gerar() {
    if (!form.nomeProspect || !form.servico) return;
    setGerando(true);
    try {
      const res = await fetch("/api/proposta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeProspect: form.nomeProspect,
          empresa: form.empresa || undefined,
          email: form.email || undefined,
          servico: form.servico,
          descricao: form.descricao || undefined,
          valor: form.valor ? parseFloat(form.valor) : undefined,
          condicaoPagamento: form.condicaoPagamento || undefined,
          validadeDias: parseInt(form.validadeDias),
          observacoes: form.observacoes || undefined,
        }),
      });
      const { pdfUrl } = await res.json();
      if (pdfUrl) window.open(pdfUrl, "_blank");
      setModalAberto(false);
      setForm(FORM_INICIAL);
      carregar();
    } finally {
      setGerando(false);
    }
  }

  async function atualizarStatus(id: string, status: string) {
    await fetch("/api/proposta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    carregar();
  }

  const filtradas = propostas.filter(
    (p) =>
      p.nome_prospect.toLowerCase().includes(busca.toLowerCase()) ||
      p.empresa?.toLowerCase().includes(busca.toLowerCase())
  );

  const totalValor = propostas
    .filter((p) => p.status === "aceita" && p.valor)
    .reduce((acc, p) => acc + (p.valor ?? 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">Propostas</h1>
          <p className="text-text-muted mt-1">
            {propostas.length} proposta{propostas.length !== 1 ? "s" : ""} ·{" "}
            {totalValor > 0 && (
              <span className="text-green-600 font-medium">
                {totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} aceitos
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setModalAberto(true)}>
          <Plus size={16} /> Nova Proposta
        </Button>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {(["rascunho", "enviada", "aceita", "recusada"] as const).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = propostas.filter((p) => p.status === s).length;
          return (
            <Card key={s}>
              <CardContent className="flex items-center gap-3">
                <div className="text-text-muted">{cfg.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-text-main">{count}</p>
                  <p className="text-xs text-text-muted">{cfg.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Busca */}
      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Buscar por nome ou empresa..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma proposta encontrada.</p>
          <Button variant="secondary" className="mt-4" onClick={() => setModalAberto(true)}>
            Criar primeira proposta
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((p) => {
            const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.rascunho;
            const servico = SERVICOS.find((s) => s.value === p.servico)?.label ?? p.servico;
            const anoEmissao = new Date(p.criado_em).getFullYear();
            return (
              <Card key={p.id}>
                <CardContent className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-btn bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-text-muted">
                        #{String(p.numero).padStart(3, "0")}/{anoEmissao}
                      </span>
                      <Badge variant={cfg.variant as "success" | "warning" | "danger" | "muted"}>
                        {cfg.label}
                      </Badge>
                    </div>
                    <p className="font-semibold text-text-main mt-0.5 truncate">
                      {p.empresa ?? p.nome_prospect}
                    </p>
                    <p className="text-xs text-text-muted">
                      {servico} · {formatDate(p.criado_em)}
                    </p>
                  </div>

                  {p.valor && (
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-text-main">
                        {p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                      {p.condicao_pagamento && (
                        <p className="text-xs text-text-muted">{p.condicao_pagamento}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.pdf_url && (
                      <a href={p.pdf_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm">
                          <Download size={14} /> PDF
                        </Button>
                      </a>
                    )}
                    {p.status === "rascunho" && (
                      <Button size="sm" onClick={() => atualizarStatus(p.id, "enviada")}>
                        <Send size={14} /> Marcar Enviada
                      </Button>
                    )}
                    {p.status === "enviada" && (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => atualizarStatus(p.id, "aceita")}
                          className="bg-green-600 hover:bg-green-700">
                          <CheckCircle size={14} /> Aceita
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => atualizarStatus(p.id, "recusada")}>
                          <XCircle size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal nova proposta */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-card w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-[#E8D5A3]/50">
              <h2 className="font-display text-2xl font-semibold text-text-main">Nova Proposta</h2>
              <button onClick={() => setModalAberto(false)} className="text-text-muted hover:text-text-main">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nome do contato *</Label>
                  <Input value={form.nomeProspect} onChange={(e) => set("nomeProspect", e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="space-y-1.5">
                  <Label>Empresa</Label>
                  <Input value={form.empresa} onChange={(e) => set("empresa", e.target.value)} placeholder="Nome da empresa" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@empresa.com" />
              </div>

              <div className="space-y-1.5">
                <Label>Solução proposta *</Label>
                <select
                  value={form.servico}
                  onChange={(e) => set("servico", e.target.value)}
                  className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  {SERVICOS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Descrição personalizada <span className="text-text-muted">(opcional — substitui o texto padrão)</span></Label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => set("descricao", e.target.value)}
                  rows={3}
                  placeholder="Contexto específico do cliente..."
                  className="flex w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Valor (R$)</Label>
                  <Input type="number" value={form.valor} onChange={(e) => set("valor", e.target.value)} placeholder="0,00" />
                </div>
                <div className="space-y-1.5">
                  <Label>Condição de pagamento</Label>
                  <Input value={form.condicaoPagamento} onChange={(e) => set("condicaoPagamento", e.target.value)} placeholder="À vista, 3x, mensal..." />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Validade (dias)</Label>
                <select
                  value={form.validadeDias}
                  onChange={(e) => set("validadeDias", e.target.value)}
                  className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="7">7 dias</option>
                  <option value="15">15 dias</option>
                  <option value="30">30 dias</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Observações internas</Label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => set("observacoes", e.target.value)}
                  rows={2}
                  placeholder="Notas que aparecerão no PDF..."
                  className="flex w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E8D5A3]/50">
              <Button variant="secondary" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button onClick={gerar} disabled={gerando || !form.nomeProspect}>
                {gerando ? "Gerando PDF..." : "Gerar Proposta"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
