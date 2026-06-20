"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, MessageCircle, Mail, Phone, Users, FileText, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Lead, Etapa } from "@/lib/crm/tipos";

type Interacao = {
  id: string;
  tipo: string;
  descricao: string;
  data: string;
};

type Props = {
  lead: Lead | null;
  etapaInicial: Etapa | null;
  onClose: () => void;
  onSave: () => void;
  onGanhoPerda?: (lead: Lead, tipo: "ganho" | "perdido") => void;
};

const TIPO_ICONS: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle size={14} />,
  email: <Mail size={14} />,
  ligacao: <Phone size={14} />,
  reuniao: <Users size={14} />,
  nota: <FileText size={14} />,
};

const TIPOS_SERVICO = [
  { value: "mentoria_3d", label: "Mentoria 3D" },
  { value: "palestra", label: "Palestra" },
  { value: "diagnostico_board", label: "Diagnóstico Board" },
  { value: "mentoria_expressa", label: "Mentoria Expressa" },
];

const ETAPAS = [
  { value: "novo", label: "Novo Lead" },
  { value: "contato", label: "Contato Realizado" },
  { value: "diagnostico", label: "Diagnóstico Agendado" },
  { value: "proposta", label: "Proposta Enviada" },
  { value: "negociacao", label: "Em Negociação" },
  { value: "ganho", label: "Ganho" },
  { value: "perdido", label: "Perdido" },
];

export function LeadModal({ lead, etapaInicial, onClose, onSave, onGanhoPerda }: Props) {
  const supabase = createClient();
  const isNovo = !lead;

  const [form, setForm] = useState({
    nome: lead?.nome ?? "",
    email: lead?.email ?? "",
    whatsapp: lead?.whatsapp ?? "",
    cargo: lead?.cargo ?? "",
    empresa: lead?.empresa ?? "",
    canal: lead?.canal ?? "",
    tipo_servico: lead?.tipo_servico ?? "",
    valor_estimado: lead?.valor_estimado?.toString() ?? "",
    etapa: lead?.etapa ?? etapaInicial ?? "novo",
    proxima_acao: lead?.proxima_acao ?? "",
    data_proxima_acao: lead?.data_proxima_acao ?? "",
    data_fechamento_prevista: lead?.data_fechamento_prevista ?? "",
  });

  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [novaInteracao, setNovaInteracao] = useState({ tipo: "nota", descricao: "" });
  const [salvando, setSalvando] = useState(false);
  const [aba, setAba] = useState<"dados" | "historico">("dados");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (lead) carregarInteracoes(); }, [lead?.id]);

  async function carregarInteracoes() {
    if (!lead) return;
    const { data } = await supabase
      .from("interacoes")
      .select("*")
      .eq("lead_id", lead.id)
      .order("data", { ascending: false });
    if (data) setInteracoes(data as Interacao[]);
  }

  function handleEtapaChange(novaEtapa: string) {
    if ((novaEtapa === "ganho" || novaEtapa === "perdido") && onGanhoPerda && lead) {
      onGanhoPerda(lead, novaEtapa as "ganho" | "perdido");
      return;
    }
    setForm((prev) => ({ ...prev, etapa: novaEtapa as Etapa }));
  }

  async function salvar() {
    setSalvando(true);
    const payload = {
      ...form,
      valor_estimado: form.valor_estimado ? parseFloat(form.valor_estimado) : null,
      data_fechamento_prevista: form.data_fechamento_prevista || null,
      origem: lead?.origem ?? "manual",
      atualizado_em: new Date().toISOString(),
    };

    if (isNovo) {
      await supabase.from("leads").insert(payload);
    } else {
      await supabase.from("leads").update(payload).eq("id", lead!.id);
    }

    onSave();
    onClose();
    setSalvando(false);
  }

  async function registrarInteracao() {
    if (!lead || !novaInteracao.descricao.trim()) return;
    await supabase.from("interacoes").insert({
      lead_id: lead.id,
      tipo: novaInteracao.tipo,
      descricao: novaInteracao.descricao,
    });
    setNovaInteracao({ tipo: "nota", descricao: "" });
    carregarInteracoes();
  }

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-card w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8D5A3]/50">
          <div>
            <h2 className="font-display text-2xl font-semibold text-text-main">
              {isNovo ? "Novo Lead" : lead.nome}
            </h2>
            {lead?.utm_source && (
              <p className="text-xs text-text-muted mt-0.5">
                Origem UTM: {lead.utm_source} / {lead.utm_medium} {lead.utm_campaign ? `· ${lead.utm_campaign}` : ""}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Abas */}
        {!isNovo && (
          <div className="flex border-b border-[#E8D5A3]/50 px-6">
            {["dados", "historico"].map((a) => (
              <button
                key={a}
                onClick={() => setAba(a as "dados" | "historico")}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  aba === a
                    ? "border-gold text-gold"
                    : "border-transparent text-text-muted hover:text-text-main"
                }`}
              >
                {a === "dados" ? "Dados" : "Histórico"}
              </button>
            ))}
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          {aba === "dados" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nome *</Label>
                  <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="space-y-1.5">
                  <Label>Empresa</Label>
                  <Input value={form.empresa} onChange={(e) => set("empresa", e.target.value)} placeholder="Nome da empresa" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>E-mail *</Label>
                  <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp</Label>
                  <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="(11) 99999-9999" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Cargo</Label>
                  <Input value={form.cargo} onChange={(e) => set("cargo", e.target.value)} placeholder="CEO, Diretor..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Canal de origem</Label>
                  <select
                    value={form.canal}
                    onChange={(e) => set("canal", e.target.value)}
                    className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
                  >
                    <option value="">Selecione...</option>
                    <option value="indicacao">Indicação</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="organico">Orgânico (SEO/blog)</option>
                    <option value="evento">Evento / Palestra</option>
                    <option value="google">Google Ads</option>
                    <option value="whatsapp_ativo">WhatsApp Ativo</option>
                    <option value="email_frio">E-mail Frio</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Serviço de interesse</Label>
                  <select
                    value={form.tipo_servico}
                    onChange={(e) => set("tipo_servico", e.target.value)}
                    className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
                  >
                    <option value="">Selecione...</option>
                    {TIPOS_SERVICO.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor estimado (R$)</Label>
                  <Input type="number" value={form.valor_estimado} onChange={(e) => set("valor_estimado", e.target.value)} placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Etapa</Label>
                  <select
                    value={form.etapa}
                    onChange={(e) => handleEtapaChange(e.target.value)}
                    className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
                  >
                    {ETAPAS.map((e) => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Data fechamento previsto</Label>
                  <Input type="date" value={form.data_fechamento_prevista} onChange={(e) => set("data_fechamento_prevista", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Próxima ação</Label>
                  <Input value={form.proxima_acao} onChange={(e) => set("proxima_acao", e.target.value)} placeholder="Enviar proposta, agendar reunião..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Data próxima ação</Label>
                  <Input type="date" value={form.data_proxima_acao} onChange={(e) => set("data_proxima_acao", e.target.value)} />
                </div>
              </div>

              {/* Dados ganho/perda (só leitura se já foi registrado) */}
              {lead?.etapa === "ganho" && lead?.motivo_ganho && (
                <div className="bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 rounded-btn p-4 space-y-1">
                  <p className="text-xs font-medium text-[#2D6A4F]">Negócio ganho</p>
                  {lead.valor_fechado && (
                    <p className="text-sm text-text-main">Valor fechado: R$ {lead.valor_fechado.toLocaleString("pt-BR")}</p>
                  )}
                  <p className="text-sm text-text-main">{lead.motivo_ganho}</p>
                  {lead.data_ganho && <p className="text-xs text-text-muted">{formatDate(lead.data_ganho)}</p>}
                </div>
              )}

              {lead?.etapa === "perdido" && lead?.motivo_perda && (
                <div className="bg-danger/10 border border-danger/30 rounded-btn p-4 space-y-1">
                  <p className="text-xs font-medium text-danger">Negócio perdido</p>
                  {lead.categoria_perda && (
                    <p className="text-xs text-text-muted capitalize">{lead.categoria_perda.replace(/_/g, " ")}</p>
                  )}
                  <p className="text-sm text-text-main">{lead.motivo_perda}</p>
                  {lead.data_perda && <p className="text-xs text-text-muted">{formatDate(lead.data_perda)}</p>}
                </div>
              )}
            </div>
          )}

          {aba === "historico" && (
            <div className="space-y-4">
              {/* Nova interação */}
              <div className="bg-bg rounded-btn p-4 space-y-3">
                <p className="text-sm font-medium text-text-main">Registrar interação</p>
                <div className="flex gap-2 flex-wrap">
                  {["whatsapp", "email", "ligacao", "reuniao", "nota"].map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => setNovaInteracao((p) => ({ ...p, tipo }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium transition-colors ${
                        novaInteracao.tipo === tipo
                          ? "bg-gold text-primary"
                          : "bg-surface border border-[#E8D5A3] text-text-muted hover:text-text-main"
                      }`}
                    >
                      {TIPO_ICONS[tipo]}
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={novaInteracao.descricao}
                    onChange={(e) => setNovaInteracao((p) => ({ ...p, descricao: e.target.value }))}
                    placeholder="Descreva a interação..."
                    onKeyDown={(e) => e.key === "Enter" && registrarInteracao()}
                  />
                  <Button size="icon" onClick={registrarInteracao}>
                    <Plus size={16} />
                  </Button>
                </div>
              </div>

              {/* Lista de interações */}
              <div className="space-y-2">
                {interacoes.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-6">Nenhuma interação registrada ainda.</p>
                )}
                {interacoes.map((i) => (
                  <div key={i.id} className="flex gap-3 p-3 bg-bg rounded-btn">
                    <div className="text-gold mt-0.5">{TIPO_ICONS[i.tipo] ?? <FileText size={14} />}</div>
                    <div className="flex-1">
                      <p className="text-sm text-text-main">{i.descricao}</p>
                      <p className="text-xs text-text-muted mt-1">{formatDate(i.data)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E8D5A3]/50">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando || !form.nome || !form.email}>
            {salvando ? "Salvando..." : isNovo ? "Criar Lead" : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
