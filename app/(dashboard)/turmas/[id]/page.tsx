"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Plus, Users, CalendarDays, CheckCircle,
  Clock, Trash2, BookOpen, MapPin, Video, Pencil, ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type Turma = {
  id: string; nome: string; descricao?: string; tipo: string;
  modalidade: string; data_inicio?: string; data_fim?: string;
  vagas: number; preco?: number; status: string; local?: string;
  link_online?: string;
};

type Aluno = {
  id: string; turma_id: string; nome: string; email: string;
  empresa?: string; cargo?: string; whatsapp?: string;
  status: string; pago: boolean; valor_pago?: number; data_inscricao: string;
};

type Aula = {
  id: string; turma_id: string; titulo: string; descricao?: string;
  data: string; duracao_minutos: number; material_url?: string;
  notas?: string; realizada: boolean;
};

const STATUS_ALUNO: Record<string, { label: string; cor: string }> = {
  inscrito:     { label: "Inscrito",      cor: "#C9A84C" },
  confirmado:   { label: "Confirmado",    cor: "#2D6A4F" },
  em_andamento: { label: "Em andamento",  cor: "#0D2B2E" },
  concluido:    { label: "Concluído",     cor: "#16A34A" },
  cancelado:    { label: "Cancelado",     cor: "#DC2626" },
  desistente:   { label: "Desistente",    cor: "#6B7280" },
};

const STATUS_TURMA: Record<string, { label: string; variant: "success" | "warning" | "muted" | "danger" | "primary" }> = {
  rascunho:           { label: "Rascunho",            variant: "muted" },
  inscricoes_abertas: { label: "Inscrições Abertas",  variant: "primary" },
  em_andamento:       { label: "Em Andamento",         variant: "success" },
  encerrada:          { label: "Encerrada",            variant: "muted" },
  cancelada:          { label: "Cancelada",            variant: "danger" },
};

export default function TurmaDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();

  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [aba, setAba] = useState<"alunos" | "aulas">("alunos");
  const [modalAluno, setModalAluno] = useState(false);
  const [modalAula, setModalAula] = useState(false);
  const [editandoStatus, setEditandoStatus] = useState<string | null>(null);

  const [formAluno, setFormAluno] = useState({ nome: "", email: "", empresa: "", cargo: "", whatsapp: "", status: "inscrito", pago: false, valor_pago: "" });
  const [formAula, setFormAula] = useState({ titulo: "", descricao: "", data: "", duracao_minutos: "90", material_url: "", notas: "" });

  useEffect(() => { carregar(); }, [id]);

  async function carregar() {
    const [t, a, au] = await Promise.all([
      supabase.from("turmas").select("*").eq("id", id).single(),
      supabase.from("turma_alunos").select("*").eq("turma_id", id).order("data_inscricao"),
      supabase.from("turma_aulas").select("*").eq("turma_id", id).order("data"),
    ]);
    if (t.data) setTurma(t.data as Turma);
    if (a.data) setAlunos(a.data as Aluno[]);
    if (au.data) setAulas(au.data as Aula[]);
  }

  async function adicionarAluno() {
    if (!formAluno.nome || !formAluno.email) return;
    await supabase.from("turma_alunos").insert({
      turma_id: id,
      nome: formAluno.nome,
      email: formAluno.email,
      empresa: formAluno.empresa || null,
      cargo: formAluno.cargo || null,
      whatsapp: formAluno.whatsapp || null,
      status: formAluno.status,
      pago: formAluno.pago,
      valor_pago: formAluno.valor_pago ? parseFloat(formAluno.valor_pago) : null,
    });
    setModalAluno(false);
    setFormAluno({ nome: "", email: "", empresa: "", cargo: "", whatsapp: "", status: "inscrito", pago: false, valor_pago: "" });
    carregar();
  }

  async function adicionarAula() {
    if (!formAula.titulo || !formAula.data) return;
    await supabase.from("turma_aulas").insert({
      turma_id: id,
      titulo: formAula.titulo,
      descricao: formAula.descricao || null,
      data: formAula.data,
      duracao_minutos: parseInt(formAula.duracao_minutos) || 90,
      material_url: formAula.material_url || null,
      notas: formAula.notas || null,
    });
    setModalAula(false);
    setFormAula({ titulo: "", descricao: "", data: "", duracao_minutos: "90", material_url: "", notas: "" });
    carregar();
  }

  async function atualizarStatusAluno(alunoId: string, status: string) {
    await supabase.from("turma_alunos").update({ status }).eq("id", alunoId);
    setEditandoStatus(null);
    carregar();
  }

  async function togglePago(aluno: Aluno) {
    await supabase.from("turma_alunos").update({ pago: !aluno.pago }).eq("id", aluno.id);
    carregar();
  }

  async function toggleRealizada(aula: Aula) {
    await supabase.from("turma_aulas").update({ realizada: !aula.realizada }).eq("id", aula.id);
    carregar();
  }

  async function excluirAluno(alunoId: string) {
    if (!confirm("Remover aluno?")) return;
    await supabase.from("turma_alunos").delete().eq("id", alunoId);
    carregar();
  }

  async function excluirAula(aulaId: string) {
    if (!confirm("Excluir aula?")) return;
    await supabase.from("turma_aulas").delete().eq("id", aulaId);
    carregar();
  }

  if (!turma) return <div className="text-text-muted text-sm p-8">Carregando...</div>;

  const ativos = alunos.filter((a) => !["cancelado", "desistente"].includes(a.status));
  const pagos = alunos.filter((a) => a.pago).length;
  const concluidos = alunos.filter((a) => a.status === "concluido").length;
  const receitaRealizada = alunos.filter((a) => a.pago).reduce((s, a) => s + (a.valor_pago ?? turma.preco ?? 0), 0);
  const aulasRealizadas = aulas.filter((a) => a.realizada).length;
  const cfg = STATUS_TURMA[turma.status] ?? STATUS_TURMA.rascunho;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/turmas" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main mb-4 w-fit">
          <ArrowLeft size={15} /> Voltar para Turmas
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
              <span className="text-xs text-text-muted bg-bg px-2 py-0.5 rounded-full">{turma.tipo}</span>
              <span className="text-xs text-text-muted bg-bg px-2 py-0.5 rounded-full">{turma.modalidade}</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-text-main">{turma.nome}</h1>
            {turma.descricao && <p className="text-text-muted mt-1 max-w-xl">{turma.descricao}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
              {turma.data_inicio && (
                <span className="flex items-center gap-1"><CalendarDays size={12} />{formatDate(turma.data_inicio)}{turma.data_fim && ` → ${formatDate(turma.data_fim)}`}</span>
              )}
              {turma.local && <span className="flex items-center gap-1"><MapPin size={12} />{turma.local}</span>}
              {turma.link_online && (
                <a href={turma.link_online} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gold hover:underline">
                  <Video size={12} /> Sala online <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-4">
          <p className="text-xs text-text-muted mb-1 flex items-center gap-1"><Users size={11} /> Inscritos ativos</p>
          <p className="text-2xl font-bold text-text-main">{ativos.length}<span className="text-sm text-text-muted font-normal">/{turma.vagas}</span></p>
        </div>
        <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-4">
          <p className="text-xs text-text-muted mb-1 flex items-center gap-1"><CheckCircle size={11} /> Pagamentos</p>
          <p className="text-2xl font-bold text-green-600">{pagos}<span className="text-sm text-text-muted font-normal">/{ativos.length}</span></p>
        </div>
        <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-4">
          <p className="text-xs text-text-muted mb-1 flex items-center gap-1"><BookOpen size={11} /> Aulas</p>
          <p className="text-2xl font-bold text-text-main">{aulasRealizadas}<span className="text-sm text-text-muted font-normal">/{aulas.length}</span></p>
        </div>
        <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-4">
          <p className="text-xs text-text-muted mb-1">Receita realizada</p>
          <p className="text-xl font-bold text-text-main">
            {receitaRealizada > 0 ? receitaRealizada.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
          </p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 bg-surface rounded-btn p-1 w-fit border border-[#E8D5A3]/50">
        {(["alunos", "aulas"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all ${aba === a ? "bg-primary text-gold shadow-sm" : "text-text-muted hover:text-text-main"}`}
          >
            {a === "alunos" ? <><Users size={14} /> Alunos ({ativos.length})</> : <><BookOpen size={14} /> Aulas ({aulas.length})</>}
          </button>
        ))}
      </div>

      {/* ABA ALUNOS */}
      {aba === "alunos" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-muted">{concluidos} concluído{concluidos !== 1 ? "s" : ""} · {pagos} pago{pagos !== 1 ? "s" : ""}</p>
            <Button onClick={() => setModalAluno(true)}><Plus size={15} /> Adicionar aluno</Button>
          </div>

          {alunos.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <Users size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-3">Nenhum aluno inscrito ainda.</p>
              <Button variant="secondary" onClick={() => setModalAluno(true)}>Adicionar primeiro aluno</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {alunos.map((a) => {
                const cfg = STATUS_ALUNO[a.status] ?? STATUS_ALUNO.inscrito;
                return (
                  <div key={a.id} className="bg-surface rounded-card border border-[#E8D5A3]/50 p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {a.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-main truncate">{a.nome}</p>
                      <p className="text-xs text-text-muted">{a.email}{a.empresa ? ` · ${a.empresa}` : ""}{a.cargo ? ` · ${a.cargo}` : ""}</p>
                    </div>

                    {/* Status dropdown */}
                    {editandoStatus === a.id ? (
                      <select
                        autoFocus
                        defaultValue={a.status}
                        onChange={(e) => atualizarStatusAluno(a.id, e.target.value)}
                        onBlur={() => setEditandoStatus(null)}
                        className="text-xs border border-[#E8D5A3] rounded-btn px-2 py-1 bg-surface text-text-main"
                      >
                        {Object.entries(STATUS_ALUNO).map(([v, c]) => (
                          <option key={v} value={v}>{c.label}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditandoStatus(a.id)}
                        className="text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: cfg.cor + "20", color: cfg.cor }}
                      >
                        {cfg.label} <Pencil size={10} />
                      </button>
                    )}

                    {/* Pago */}
                    <button
                      onClick={() => togglePago(a)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-btn transition-colors ${a.pago ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600"}`}
                    >
                      {a.pago ? "✓ Pago" : "Pagar"}
                    </button>

                    {a.whatsapp && (
                      <a
                        href={`https://wa.me/55${a.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 hover:underline flex-shrink-0"
                      >
                        WhatsApp
                      </a>
                    )}

                    <button onClick={() => excluirAluno(a.id)} className="text-text-muted hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA AULAS */}
      {aba === "aulas" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-muted">{aulasRealizadas}/{aulas.length} aulas realizadas</p>
            <Button onClick={() => setModalAula(true)}><Plus size={15} /> Adicionar aula</Button>
          </div>

          {aulas.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-3">Nenhuma aula cadastrada ainda.</p>
              <Button variant="secondary" onClick={() => setModalAula(true)}>Adicionar primeira aula</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {aulas.map((au, i) => (
                <div key={au.id} className={`bg-surface rounded-card border p-4 ${au.realizada ? "border-green-200 bg-green-50/30" : "border-[#E8D5A3]/50"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-btn flex items-center justify-center text-sm font-bold flex-shrink-0 ${au.realizada ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold ${au.realizada ? "text-text-muted line-through" : "text-text-main"}`}>{au.titulo}</p>
                        {au.realizada && <span className="text-xs text-green-600 font-medium">✓ Realizada</span>}
                      </div>
                      {au.descricao && <p className="text-xs text-text-muted mt-0.5">{au.descricao}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
                        <span className="flex items-center gap-1"><CalendarDays size={11} />{new Date(au.data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{au.duracao_minutos} min</span>
                        {au.material_url && (
                          <a href={au.material_url} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline flex items-center gap-1">
                            Material <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      {au.notas && <p className="text-xs text-text-muted mt-1.5 italic">{au.notas}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleRealizada(au)}
                        className={`text-xs px-2.5 py-1 rounded-btn transition-colors ${au.realizada ? "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                      >
                        {au.realizada ? "Desfazer" : "Realizada"}
                      </button>
                      <button onClick={() => excluirAula(au.id)} className="p-1.5 text-text-muted hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal aluno */}
      {modalAluno && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-card w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-[#E8D5A3]/50">
              <h2 className="font-display text-xl font-semibold text-text-main">Adicionar Aluno</h2>
              <button onClick={() => setModalAluno(false)} className="text-text-muted hover:text-text-main">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nome *</Label>
                  <Input value={formAluno.nome} onChange={(e) => setFormAluno((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome completo" />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail *</Label>
                  <Input type="email" value={formAluno.email} onChange={(e) => setFormAluno((p) => ({ ...p, email: e.target.value }))} placeholder="email@empresa.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Empresa</Label>
                  <Input value={formAluno.empresa} onChange={(e) => setFormAluno((p) => ({ ...p, empresa: e.target.value }))} placeholder="Nome da empresa" />
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp</Label>
                  <Input value={formAluno.whatsapp} onChange={(e) => setFormAluno((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select value={formAluno.status} onChange={(e) => setFormAluno((p) => ({ ...p, status: e.target.value }))} className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold">
                    {Object.entries(STATUS_ALUNO).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor pago (R$)</Label>
                  <Input type="number" value={formAluno.valor_pago} onChange={(e) => setFormAluno((p) => ({ ...p, valor_pago: e.target.value }))} placeholder={turma.preco?.toString() ?? "0"} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-text-main cursor-pointer">
                <input type="checkbox" checked={formAluno.pago} onChange={(e) => setFormAluno((p) => ({ ...p, pago: e.target.checked }))} className="rounded" />
                Pagamento confirmado
              </label>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[#E8D5A3]/50">
              <Button variant="secondary" onClick={() => setModalAluno(false)}>Cancelar</Button>
              <Button onClick={adicionarAluno} disabled={!formAluno.nome || !formAluno.email}>Adicionar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal aula */}
      {modalAula && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-card w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-[#E8D5A3]/50">
              <h2 className="font-display text-xl font-semibold text-text-main">Adicionar Aula</h2>
              <button onClick={() => setModalAula(false)} className="text-text-muted hover:text-text-main">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <div className="space-y-1.5">
                <Label>Título *</Label>
                <Input value={formAula.titulo} onChange={(e) => setFormAula((p) => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Aula 1 — Diagnóstico estratégico" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data e hora *</Label>
                  <Input type="datetime-local" value={formAula.data} onChange={(e) => setFormAula((p) => ({ ...p, data: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Duração (min)</Label>
                  <Input type="number" value={formAula.duracao_minutos} onChange={(e) => setFormAula((p) => ({ ...p, duracao_minutos: e.target.value }))} placeholder="90" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Input value={formAula.descricao} onChange={(e) => setFormAula((p) => ({ ...p, descricao: e.target.value }))} placeholder="O que será abordado..." />
              </div>
              <div className="space-y-1.5">
                <Label>Link do material</Label>
                <Input value={formAula.material_url} onChange={(e) => setFormAula((p) => ({ ...p, material_url: e.target.value }))} placeholder="https://drive.google.com/..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[#E8D5A3]/50">
              <Button variant="secondary" onClick={() => setModalAula(false)}>Cancelar</Button>
              <Button onClick={adicionarAula} disabled={!formAula.titulo || !formAula.data}>Adicionar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
