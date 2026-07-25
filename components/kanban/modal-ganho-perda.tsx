"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Lead } from "@/lib/crm/tipos";
import { Trophy, XCircle, X, Building2, User, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const CATEGORIAS_PERDA = [
  { id: "preco",        label: "Preço alto" },
  { id: "concorrente",  label: "Escolheu concorrente" },
  { id: "timing",       label: "Timing ruim" },
  { id: "sem_budget",   label: "Sem budget" },
  { id: "sem_fit",      label: "Sem fit" },
  { id: "nao_respondeu",label: "Não respondeu" },
  { id: "outro",        label: "Outro motivo" },
];

const SETORES = [
  "Agronegócio", "Construção Civil", "Educação", "Financeiro", "Indústria",
  "Logística", "Saúde", "Tecnologia", "Varejo", "Serviços", "Outro",
];

const PORTES = [
  { value: "micro",    label: "Micro (até 9 func.)" },
  { value: "pequena",  label: "Pequena (10–49)" },
  { value: "media",    label: "Média (50–249)" },
  { value: "grande",   label: "Grande (250+)" },
];

const MODELOS = [
  { value: "mentoria_3d",       label: "Mentoria 3D" },
  { value: "palestra",          label: "Palestra" },
  { value: "diagnostico_board", label: "Diagnóstico Board" },
  { value: "mentoria_expressa", label: "Mentoria Expressa" },
];

type Props = {
  lead: Lead;
  tipo: "ganho" | "perdido";
  onClose: () => void;
  onConfirmar: (lead: Lead, tipo: "ganho" | "perdido", dados: Record<string, string>) => void;
};

export function ModalGanhoPerca({ lead, tipo, onClose, onConfirmar }: Props) {
  const supabase = createClient();
  const isGanho  = tipo === "ganho";

  // ── Passo 1: dados do negócio ──
  const [motivo,       setMotivo]       = useState("");
  const [categoria,    setCategoria]    = useState("");
  const [valorFechado, setValorFechado] = useState(lead.valor_estimado?.toString() ?? "");
  const [dataGanho,    setDataGanho]    = useState(new Date().toISOString().split("T")[0]);

  // ── Passo 2: criação do cliente ──
  const [passo,      setPasso]      = useState<1 | 2 | 3>(1);
  const [salvando,   setSalvando]   = useState(false);
  const [clienteId,  setClienteId]  = useState<string | null>(null);

  // Campos do cliente (pré-preenchidos com dados do lead)
  const [nomeEmpresa,    setNomeEmpresa]    = useState(lead.empresa ?? "");
  const [setor,          setSetor]          = useState("");
  const [porte,          setPorte]          = useState("");
  const [modeloTrabalho, setModeloTrabalho] = useState(lead.tipo_servico ?? "");
  const [dataInicio,     setDataInicio]     = useState(new Date().toISOString().split("T")[0]);

  // Contato principal (dados do próprio lead)
  const [criarContato,    setCriarContato]    = useState(true);
  const [nomeContato,     setNomeContato]     = useState(lead.nome ?? "");
  const [emailContato,    setEmailContato]    = useState(lead.email ?? "");
  const [whatsContato,    setWhatsContato]    = useState(lead.whatsapp ?? "");
  const [cargoContato,    setCargoContato]    = useState(lead.cargo ?? "");

  // ── Passo 1: validação e confirmação ──────────────────────────────
  const podeConfirmar = isGanho
    ? motivo.trim().length > 0
    : motivo.trim().length > 0 && categoria.length > 0;

  function confirmarNegocio() {
    if (!podeConfirmar) return;
    const dados: Record<string, string> = isGanho
      ? { motivo_ganho: motivo, valor_fechado: valorFechado, data_ganho: dataGanho }
      : { motivo_perda: motivo, categoria_perda: categoria };
    onConfirmar(lead, tipo, dados);
    if (isGanho) setPasso(2); else onClose();
  }

  // ── Passo 2: criar cliente ────────────────────────────────────────
  async function criarCliente() {
    if (!nomeEmpresa.trim()) return;
    setSalvando(true);
    try {
      const { data: novoCliente, error } = await supabase
        .from("clientes")
        .insert({
          nome: nomeEmpresa.trim(),
          setor:              setor || null,
          porte:              porte || null,
          modelo_trabalho:    modeloTrabalho || null,
          data_inicio_contrato: dataInicio,
          status: "ativo",
        })
        .select("id")
        .single();

      if (error || !novoCliente) throw error;

      setClienteId(novoCliente.id);

      // Criar contato principal
      if (criarContato && nomeContato.trim()) {
        await supabase.from("contatos_cliente").insert({
          cliente_id: novoCliente.id,
          nome:       nomeContato.trim(),
          email:      emailContato || null,
          whatsapp:   whatsContato || null,
          cargo:      cargoContato || null,
          principal:  true,
        });
      }

      setPasso(3);
    } catch {
      alert("Erro ao criar cliente. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-card shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8D5A3]/50">
          <div className="flex items-center gap-3">
            {passo === 3
              ? <CheckCircle2 className="text-[#2D6A4F]" size={22} />
              : isGanho
              ? <Trophy className="text-[#2D6A4F]" size={22} />
              : <XCircle className="text-danger" size={22} />}
            <div>
              <h2 className="font-display text-xl font-bold text-text-main">
                {passo === 1 && (isGanho ? "Negócio Ganho!" : "Negócio Perdido")}
                {passo === 2 && "Criar cliente"}
                {passo === 3 && "Cliente criado!"}
              </h2>
              <p className="text-xs text-text-muted">{lead.nome} · {lead.empresa}</p>
            </div>
          </div>
          {passo !== 3 && (
            <button onClick={onClose} className="text-text-muted hover:text-text-main">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Indicador de passos (só para ganho) */}
        {isGanho && (
          <div className="flex items-center gap-0 px-6 pt-4 pb-0">
            {[1, 2].map((p) => (
              <div key={p} className="flex items-center gap-0 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  passo >= p ? "bg-[#2D6A4F] text-white" : "bg-[#E8D5A3]/30 text-text-muted"
                }`}>{p}</div>
                {p < 2 && <div className={`flex-1 h-0.5 transition-colors ${passo > p ? "bg-[#2D6A4F]" : "bg-[#E8D5A3]/30"}`} />}
              </div>
            ))}
            <div className="ml-3 flex gap-4 text-xs text-text-muted">
              <span className={passo === 1 ? "text-text-main font-medium" : ""}>Negócio</span>
              <span className={passo >= 2 ? "text-text-main font-medium" : ""}>Cliente</span>
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* ── Passo 1 ── */}
          {passo === 1 && isGanho && (
            <>
              <div className="space-y-1.5">
                <Label>Valor fechado (R$)</Label>
                <Input type="number" value={valorFechado}
                  onChange={(e) => setValorFechado(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Data de fechamento</Label>
                <Input type="date" value={dataGanho} onChange={(e) => setDataGanho(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>O que foi decisivo para fechar? *</Label>
                <textarea
                  className="w-full rounded-btn border border-[#E8D5A3] bg-bg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold/30"
                  rows={3} placeholder="Ex: preço competitivo, fit com o serviço, urgência do cliente..."
                  value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              </div>
            </>
          )}

          {passo === 1 && !isGanho && (
            <>
              <div className="space-y-1.5">
                <Label>Categoria de perda *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIAS_PERDA.map((cat) => (
                    <button key={cat.id} onClick={() => setCategoria(cat.id)}
                      className={`px-3 py-2 rounded-btn text-xs font-medium text-left border transition-colors ${
                        categoria === cat.id
                          ? "bg-danger/10 border-danger text-danger"
                          : "border-[#E8D5A3] text-text-muted hover:text-text-main hover:border-gold"
                      }`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Detalhes do motivo *</Label>
                <textarea
                  className="w-full rounded-btn border border-[#E8D5A3] bg-bg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold/30"
                  rows={3} placeholder="Descreva o que levou à perda desse negócio..."
                  value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              </div>
            </>
          )}

          {/* ── Passo 2: criar cliente ── */}
          {passo === 2 && (
            <>
              {/* Empresa */}
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={15} className="text-gold" />
                <p className="text-sm font-semibold text-text-main">Dados da empresa</p>
              </div>
              <div className="space-y-1.5">
                <Label>Nome da empresa *</Label>
                <Input value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)}
                  placeholder="Nome comercial" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Setor</Label>
                  <select value={setor} onChange={(e) => setSetor(e.target.value)}
                    className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-surface text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold/30">
                    <option value="">Selecione...</option>
                    {SETORES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Porte</Label>
                  <select value={porte} onChange={(e) => setPorte(e.target.value)}
                    className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-surface text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold/30">
                    <option value="">Selecione...</option>
                    {PORTES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Serviço contratado</Label>
                  <select value={modeloTrabalho} onChange={(e) => setModeloTrabalho(e.target.value)}
                    className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-surface text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold/30">
                    <option value="">Selecione...</option>
                    {MODELOS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Início do contrato</Label>
                  <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                </div>
              </div>

              {/* Contato principal */}
              <div className="border-t border-[#E8D5A3]/50 pt-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={criarContato}
                    onChange={(e) => setCriarContato(e.target.checked)}
                    className="w-4 h-4 accent-gold rounded" />
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-gold" />
                    <span className="text-sm font-medium text-text-main">Criar contato principal</span>
                    <span className="text-xs text-text-muted">(pré-preenchido com dados do lead)</span>
                  </div>
                </label>
                {criarContato && (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div className="space-y-1.5">
                      <Label>Nome</Label>
                      <Input value={nomeContato} onChange={(e) => setNomeContato(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cargo</Label>
                      <Input value={cargoContato} onChange={(e) => setCargoContato(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>E-mail</Label>
                      <Input type="email" value={emailContato} onChange={(e) => setEmailContato(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>WhatsApp</Label>
                      <Input value={whatsContato} onChange={(e) => setWhatsContato(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Passo 3: sucesso ── */}
          {passo === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-[#2D6A4F]" />
              </div>
              <h3 className="font-display text-lg font-bold text-text-main mb-1">
                {nomeEmpresa} criado com sucesso!
              </h3>
              <p className="text-sm text-text-muted mb-4">
                O cliente foi adicionado ao sistema{criarContato && nomeContato ? ` com ${nomeContato} como contato principal` : ""}.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={onClose}>Fechar</Button>
                {clienteId && (
                  <Button onClick={() => { onClose(); window.location.href = `/clientes/${clienteId}`; }}
                    style={{ backgroundColor: "#2D6A4F" }}>
                    Ver cliente →
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {passo !== 3 && (
          <div className="flex gap-3 p-6 border-t border-[#E8D5A3]/50">
            {passo === 1 && (
              <>
                <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
                <Button className="flex-1" onClick={confirmarNegocio} disabled={!podeConfirmar}
                  style={isGanho ? { backgroundColor: "#2D6A4F" } : { backgroundColor: "#C1121F" }}>
                  {isGanho ? "Confirmar ganho →" : "Registrar perda"}
                </Button>
              </>
            )}
            {passo === 2 && (
              <>
                <Button variant="secondary" className="flex-1" onClick={onClose}>Pular</Button>
                <Button className="flex-1" onClick={criarCliente}
                  disabled={salvando || !nomeEmpresa.trim()}
                  style={{ backgroundColor: "#2D6A4F" }}>
                  {salvando ? "Criando..." : "Criar cliente"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
