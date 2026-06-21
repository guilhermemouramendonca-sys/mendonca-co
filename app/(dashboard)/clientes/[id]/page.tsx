"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Users, Edit2, Plus, Trash2,
  Phone, Mail, MessageCircle, FileText, Calendar, Save, Share2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { ClienteModal } from "@/components/clientes/cliente-modal";
import type { Cliente } from "../page";

type Contato = {
  id: string;
  nome: string;
  cargo?: string;
  email?: string;
  whatsapp?: string;
  papel?: string;
  principal: boolean;
};

type Sessao = {
  id: string;
  tipo: string;
  data: string;
  duracao_minutos?: number;
  anotacoes?: string;
  proximos_passos?: string;
};

type Interacao = {
  id: string;
  tipo: string;
  descricao: string;
  data: string;
};

const TIPO_SESSAO_LABELS: Record<string, string> = {
  mentoria: "Mentoria",
  board: "Board",
  diagnostico: "Diagnóstico",
  workshop: "Workshop",
};

const PAPEL_LABELS: Record<string, string> = {
  socio: "Sócio",
  diretor: "Diretor",
  lider: "Líder",
  outro: "Outro",
};

const TIPO_ICONS: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle size={13} />,
  email: <Mail size={13} />,
  ligacao: <Phone size={13} />,
  reuniao: <Users size={13} />,
  nota: <FileText size={13} />,
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  ativo: "success",
  pausado: "warning",
  encerrado: "danger",
};

export default function ClienteFichaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [aba, setAba] = useState<"visao" | "contatos" | "sessoes" | "historico">("visao");
  const [editandoCliente, setEditandoCliente] = useState(false);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [modalCompartilhar, setModalCompartilhar] = useState(false);
  const [compartilhamentos, setCompartilhamentos] = useState<{id:string;titulo:string;tipo:string;criado_em:string}[]>([]);
  const [formComp, setFormComp] = useState({ titulo: "", descricao: "", arquivo_url: "", tipo: "documento" });
  const [salvandoComp, setSalvandoComp] = useState(false);

  // Novo contato
  const [novoContato, setNovoContato] = useState({ nome: "", cargo: "", email: "", whatsapp: "", papel: "outro" });
  const [adicionandoContato, setAdicionandoContato] = useState(false);

  // Nova sessão
  const [novaSessao, setNovaSessao] = useState({ tipo: "mentoria", data: "", duracao_minutos: "", anotacoes: "", proximos_passos: "" });
  const [adicionandoSessao, setAdicionandoSessao] = useState(false);

  // Nova interação
  const [novaInteracao, setNovaInteracao] = useState({ tipo: "nota", descricao: "" });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregar(); }, [id]);

  async function carregar() {
    const [{ data: c }, { data: ct }, { data: s }, { data: i }, { data: comp }] = await Promise.all([
      supabase.from("clientes").select("*").eq("id", id).single(),
      supabase.from("contatos_cliente").select("*").eq("cliente_id", id).order("principal", { ascending: false }),
      supabase.from("sessoes").select("*").eq("cliente_id", id).order("data", { ascending: false }),
      supabase.from("interacoes").select("*").eq("cliente_id", id).order("data", { ascending: false }),
      supabase.from("compartilhamentos").select("id,titulo,tipo,criado_em").eq("cliente_id", id).order("criado_em", { ascending: false }),
    ]);
    if (c) setCliente(c as Cliente);
    if (ct) setContatos(ct as Contato[]);
    if (s) setSessoes(s as Sessao[]);
    if (i) setInteracoes(i as Interacao[]);
    if (comp) setCompartilhamentos(comp);
  }

  async function compartilharDoc() {
    if (!formComp.titulo || !formComp.arquivo_url) return;
    setSalvandoComp(true);
    await supabase.from("compartilhamentos").insert({
      cliente_id: id,
      titulo: formComp.titulo,
      descricao: formComp.descricao || null,
      arquivo_url: formComp.arquivo_url,
      tipo: formComp.tipo,
    });
    setSalvandoComp(false);
    setModalCompartilhar(false);
    setFormComp({ titulo: "", descricao: "", arquivo_url: "", tipo: "documento" });
    carregar();
  }

  async function removerCompartilhamento(cid: string) {
    if (!confirm("Remover acesso do cliente a este documento?")) return;
    await supabase.from("compartilhamentos").delete().eq("id", cid);
    carregar();
  }

  async function salvarContato() {
    if (!novoContato.nome.trim()) return;
    await supabase.from("contatos_cliente").insert({ ...novoContato, cliente_id: id });
    setNovoContato({ nome: "", cargo: "", email: "", whatsapp: "", papel: "outro" });
    setAdicionandoContato(false);
    carregar();
  }

  async function deletarContato(cid: string) {
    if (!confirm("Remover este contato?")) return;
    await supabase.from("contatos_cliente").delete().eq("id", cid);
    carregar();
  }

  async function salvarSessao() {
    if (!novaSessao.data) return;
    await supabase.from("sessoes").insert({
      cliente_id: id,
      tipo: novaSessao.tipo,
      data: novaSessao.data,
      duracao_minutos: novaSessao.duracao_minutos ? parseInt(novaSessao.duracao_minutos) : null,
      anotacoes: novaSessao.anotacoes,
      proximos_passos: novaSessao.proximos_passos,
    });
    setNovaSessao({ tipo: "mentoria", data: "", duracao_minutos: "", anotacoes: "", proximos_passos: "" });
    setAdicionandoSessao(false);
    carregar();
  }

  async function registrarInteracao() {
    if (!novaInteracao.descricao.trim()) return;
    await supabase.from("interacoes").insert({ cliente_id: id, ...novaInteracao });
    setNovaInteracao({ tipo: "nota", descricao: "" });
    carregar();
  }

  if (!cliente) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-text-muted text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <button onClick={() => router.back()} className="mt-1 text-text-muted hover:text-text-main transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-4xl font-bold text-text-main">{cliente.nome}</h1>
              <Badge variant={STATUS_VARIANT[cliente.status] ?? "muted"}>
                {cliente.status.charAt(0).toUpperCase() + cliente.status.slice(1)}
              </Badge>
            </div>
            <p className="text-text-muted mt-1 text-sm">
              {[cliente.setor, cliente.porte && `Empresa ${PAPEL_LABELS[cliente.porte] ?? cliente.porte}`, cliente.num_funcionarios && `${cliente.num_funcionarios} funcionários`]
                .filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              setGerandoRelatorio(true);
              const res = await fetch("/api/relatorio-executivo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clienteId: id }),
              });
              const data = await res.json();
              if (data.pdfUrl) window.open(data.pdfUrl, "_blank");
              else alert(data.error ?? "Erro ao gerar relatório.");
              setGerandoRelatorio(false);
            }}
            disabled={gerandoRelatorio}
          >
            <FileText size={15} />
            {gerandoRelatorio ? "Gerando..." : "Relatório Executivo"}
          </Button>
          <Button variant="secondary" onClick={() => setModalCompartilhar(true)}>
            <Share2 size={15} /> Portal do Cliente
          </Button>
          <Button variant="secondary" onClick={() => setEditandoCliente(true)}>
            <Edit2 size={15} /> Editar
          </Button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex border-b border-[#E8D5A3]/50 mb-6">
        {[
          { id: "visao", label: "Visão Geral" },
          { id: "contatos", label: `Contatos (${contatos.length})` },
          { id: "sessoes", label: `Sessões (${sessoes.length})` },
          { id: "historico", label: `Histórico (${interacoes.length})` },
        ].map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id as typeof aba)}
            className={`py-3 px-5 text-sm font-medium border-b-2 transition-colors ${
              aba === a.id
                ? "border-gold text-gold"
                : "border-transparent text-text-muted hover:text-text-main"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* ABA: VISÃO GERAL */}
      {aba === "visao" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Dados da empresa</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: "Razão social", value: cliente.razao_social },
                { label: "CNPJ", value: cliente.cnpj },
                { label: "Setor", value: cliente.setor },
                { label: "Faturamento / ano", value: cliente.faturamento_estimado ? `R$ ${Number(cliente.faturamento_estimado).toLocaleString("pt-BR")},00` : undefined },
                { label: "Modelo de trabalho", value: cliente.modelo_trabalho },
                { label: "Cliente desde", value: cliente.data_inicio_contrato ? formatDate(cliente.data_inicio_contrato) : undefined },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex justify-between">
                  <span className="text-text-muted">{label}</span>
                  <span className="text-text-main font-medium">{value}</span>
                </div>
              ) : null)}
            </CardContent>
          </Card>

          {cliente.observacoes && (
            <Card>
              <CardHeader><CardTitle>Anotações estratégicas</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-text-main whitespace-pre-wrap">{cliente.observacoes}</p>
              </CardContent>
            </Card>
          )}

          {/* Últimas sessões */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Últimas sessões</CardTitle>
                <button onClick={() => setAba("sessoes")} className="text-xs text-gold hover:underline">Ver todas</button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {sessoes.slice(0, 3).length === 0 ? (
                <p className="text-sm text-text-muted">Nenhuma sessão registrada.</p>
              ) : sessoes.slice(0, 3).map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-[#E8D5A3]/30 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text-main">{TIPO_SESSAO_LABELS[s.tipo] ?? s.tipo}</p>
                    {s.duracao_minutos && <p className="text-xs text-text-muted">{s.duracao_minutos} min</p>}
                  </div>
                  <span className="text-xs text-text-muted">{formatDate(s.data)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Últimas interações */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Últimas interações</CardTitle>
                <button onClick={() => setAba("historico")} className="text-xs text-gold hover:underline">Ver todas</button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {interacoes.slice(0, 3).length === 0 ? (
                <p className="text-sm text-text-muted">Nenhuma interação registrada.</p>
              ) : interacoes.slice(0, 3).map((i) => (
                <div key={i.id} className="flex gap-2 py-2 border-b border-[#E8D5A3]/30 last:border-0">
                  <span className="text-gold mt-0.5">{TIPO_ICONS[i.tipo]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-main truncate">{i.descricao}</p>
                    <p className="text-xs text-text-muted">{formatDate(i.data)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ABA: CONTATOS */}
      {aba === "contatos" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setAdicionandoContato(true)}>
              <Plus size={15} /> Adicionar contato
            </Button>
          </div>

          {adicionandoContato && (
            <Card>
              <CardHeader><CardTitle>Novo contato</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nome *</Label>
                    <Input value={novoContato.nome} onChange={(e) => setNovoContato((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome completo" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cargo</Label>
                    <Input value={novoContato.cargo} onChange={(e) => setNovoContato((p) => ({ ...p, cargo: e.target.value }))} placeholder="CEO, Diretor..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-mail</Label>
                    <Input type="email" value={novoContato.email} onChange={(e) => setNovoContato((p) => ({ ...p, email: e.target.value }))} placeholder="email@empresa.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>WhatsApp</Label>
                    <Input value={novoContato.whatsapp} onChange={(e) => setNovoContato((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Papel</Label>
                    <select value={novoContato.papel} onChange={(e) => setNovoContato((p) => ({ ...p, papel: e.target.value }))}
                      className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold">
                      {Object.entries(PAPEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => setAdicionandoContato(false)}>Cancelar</Button>
                  <Button onClick={salvarContato}><Save size={15} /> Salvar contato</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {contatos.length === 0 && !adicionandoContato ? (
            <div className="text-center py-12 text-text-muted">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum contato cadastrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contatos.map((c) => (
                <Card key={c.id}>
                  <CardContent className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-text-main">{c.nome}</p>
                        {c.principal && <Badge variant="default" className="text-[10px]">Principal</Badge>}
                      </div>
                      {c.cargo && <p className="text-xs text-text-muted">{c.cargo} · {PAPEL_LABELS[c.papel ?? "outro"]}</p>}
                      <div className="flex flex-col gap-1 mt-2">
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors">
                            <Mail size={12} /> {c.email}
                          </a>
                        )}
                        {c.whatsapp && (
                          <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors">
                            <Phone size={12} /> {c.whatsapp}
                          </a>
                        )}
                      </div>
                    </div>
                    <button onClick={() => deletarContato(c.id)} className="text-text-muted hover:text-danger transition-colors flex-shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA: SESSÕES */}
      {aba === "sessoes" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setAdicionandoSessao(true)}>
              <Plus size={15} /> Registrar sessão
            </Button>
          </div>

          {adicionandoSessao && (
            <Card>
              <CardHeader><CardTitle>Nova sessão</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <select value={novaSessao.tipo} onChange={(e) => setNovaSessao((p) => ({ ...p, tipo: e.target.value }))}
                      className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold">
                      {Object.entries(TIPO_SESSAO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data *</Label>
                    <Input type="datetime-local" value={novaSessao.data} onChange={(e) => setNovaSessao((p) => ({ ...p, data: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Duração (min)</Label>
                    <Input type="number" value={novaSessao.duracao_minutos} onChange={(e) => setNovaSessao((p) => ({ ...p, duracao_minutos: e.target.value }))} placeholder="60" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Anotações da sessão</Label>
                  <textarea value={novaSessao.anotacoes} onChange={(e) => setNovaSessao((p) => ({ ...p, anotacoes: e.target.value }))} rows={3}
                    placeholder="O que foi discutido..."
                    className="flex w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold resize-none" />
                </div>
                <div className="space-y-1.5">
                  <Label>Próximos passos</Label>
                  <textarea value={novaSessao.proximos_passos} onChange={(e) => setNovaSessao((p) => ({ ...p, proximos_passos: e.target.value }))} rows={2}
                    placeholder="Ações acordadas..."
                    className="flex w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold resize-none" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => setAdicionandoSessao(false)}>Cancelar</Button>
                  <Button onClick={salvarSessao} disabled={!novaSessao.data}><Save size={15} /> Salvar sessão</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {sessoes.length === 0 && !adicionandoSessao ? (
            <div className="text-center py-12 text-text-muted">
              <Calendar size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma sessão registrada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessoes.map((s) => (
                <Card key={s.id}>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="default">{TIPO_SESSAO_LABELS[s.tipo] ?? s.tipo}</Badge>
                        <span className="text-sm text-text-muted">{formatDate(s.data)}</span>
                        {s.duracao_minutos && <span className="text-xs text-text-muted">{s.duracao_minutos} min</span>}
                      </div>
                    </div>
                    {s.anotacoes && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Anotações</p>
                        <p className="text-sm text-text-main whitespace-pre-wrap">{s.anotacoes}</p>
                      </div>
                    )}
                    {s.proximos_passos && (
                      <div>
                        <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Próximos passos</p>
                        <p className="text-sm text-text-main whitespace-pre-wrap">{s.proximos_passos}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA: HISTÓRICO */}
      {aba === "historico" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium text-text-main">Registrar interação</p>
              <div className="flex gap-2 flex-wrap">
                {["whatsapp", "email", "ligacao", "reuniao", "nota"].map((tipo) => (
                  <button key={tipo} onClick={() => setNovaInteracao((p) => ({ ...p, tipo }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium transition-colors ${
                      novaInteracao.tipo === tipo ? "bg-gold text-primary" : "bg-bg border border-[#E8D5A3] text-text-muted hover:text-text-main"
                    }`}>
                    {TIPO_ICONS[tipo]}
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={novaInteracao.descricao} onChange={(e) => setNovaInteracao((p) => ({ ...p, descricao: e.target.value }))}
                  placeholder="Descreva a interação..." onKeyDown={(e) => e.key === "Enter" && registrarInteracao()} />
                <Button onClick={registrarInteracao}><Plus size={15} /></Button>
              </div>
            </CardContent>
          </Card>

          {interacoes.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <FileText size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma interação registrada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {interacoes.map((i) => (
                <div key={i.id} className="flex gap-3 p-4 bg-surface rounded-btn border border-[#E8D5A3]/50">
                  <span className="text-gold mt-0.5">{TIPO_ICONS[i.tipo] ?? <FileText size={13} />}</span>
                  <div className="flex-1">
                    <p className="text-sm text-text-main">{i.descricao}</p>
                    <p className="text-xs text-text-muted mt-1">{formatDate(i.data)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editandoCliente && (
        <ClienteModal
          cliente={cliente}
          onClose={() => setEditandoCliente(false)}
          onSave={carregar}
        />
      )}

      {/* Modal Portal do Cliente / Compartilhamentos */}
      {modalCompartilhar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-card w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-[#E8D5A3]/50">
              <div>
                <h2 className="font-display text-xl font-semibold text-text-main">Portal do Cliente</h2>
                <p className="text-xs text-text-muted mt-0.5">Documentos visíveis para {cliente.nome}</p>
              </div>
              <button onClick={() => setModalCompartilhar(false)} className="text-text-muted hover:text-text-main">✕</button>
            </div>

            {/* Lista de compartilhamentos existentes */}
            <div className="px-6 pt-4">
              {compartilhamentos.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">Nenhum documento compartilhado ainda.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {compartilhamentos.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-bg rounded-btn">
                      <FileText size={14} className="text-gold flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-main truncate">{c.titulo}</p>
                        <p className="text-xs text-text-muted">{c.tipo} · {formatDate(c.criado_em)}</p>
                      </div>
                      <button onClick={() => removerCompartilhamento(c.id)} className="text-text-muted hover:text-red-500 transition-colors flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulário novo compartilhamento */}
            <div className="px-6 pb-6 space-y-3 border-t border-[#E8D5A3]/30 pt-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Compartilhar novo documento</p>
              <div className="space-y-1.5">
                <Label>Título *</Label>
                <input
                  value={formComp.titulo}
                  onChange={(e) => setFormComp((p) => ({ ...p, titulo: e.target.value }))}
                  placeholder="Ex: Relatório Executivo — Jun/2025"
                  className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div className="space-y-1.5">
                <Label>URL do arquivo *</Label>
                <input
                  value={formComp.arquivo_url}
                  onChange={(e) => setFormComp((p) => ({ ...p, arquivo_url: e.target.value }))}
                  placeholder="https://..."
                  className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <select
                    value={formComp.tipo}
                    onChange={(e) => setFormComp((p) => ({ ...p, tipo: e.target.value }))}
                    className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
                  >
                    {[["relatorio","Relatório"],["diagnostico","Diagnóstico"],["radar360","Radar 360"],["pesquisa","Pesquisa"],["canvas","Canvas"],["proposta","Proposta"],["plano_acao","Plano de Ação"],["documento","Documento"],["outro","Outro"]].map(([v,l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Descrição</Label>
                  <input
                    value={formComp.descricao}
                    onChange={(e) => setFormComp((p) => ({ ...p, descricao: e.target.value }))}
                    placeholder="Opcional..."
                    className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>
              <Button onClick={compartilharDoc} disabled={salvandoComp || !formComp.titulo || !formComp.arquivo_url} className="w-full">
                <Share2 size={14} /> {salvandoComp ? "Salvando..." : "Compartilhar com cliente"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
