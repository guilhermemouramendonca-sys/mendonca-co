"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, X, LayoutGrid, List, Calendar, User, Building2,
  GripVertical, CheckSquare, Flag,
} from "lucide-react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
} from "@dnd-kit/core";
import { cn, formatDate } from "@/lib/utils";

type Status = "a_fazer" | "em_andamento" | "concluido";
type Prioridade = "baixa" | "media" | "alta";

type Tarefa = {
  id: string;
  titulo: string;
  descricao?: string | null;
  status: Status;
  prioridade: Prioridade;
  cliente_id?: string | null;
  responsavel_id?: string | null;
  data_prazo?: string | null;
  criado_em: string;
  cliente_nome?: string | null;
  responsavel_nome?: string | null;
};

type Cliente = { id: string; nome: string };
type Usuario = { id: string; nome: string };

const COLUNAS: { id: Status; label: string; cor: string }[] = [
  { id: "a_fazer",     label: "A fazer",       cor: "#6B6B6B" },
  { id: "em_andamento", label: "Em andamento", cor: "#C9A84C" },
  { id: "concluido",   label: "Concluído",     cor: "#27AE60" },
];

const PRIORIDADE_CONFIG: Record<Prioridade, { label: string; cor: string }> = {
  baixa: { label: "Baixa", cor: "#6B6B6B" },
  media: { label: "Média", cor: "#C9A84C" },
  alta:  { label: "Alta",  cor: "#C0392B" },
};

// ── CARD ARRASTÁVEL (kanban) ──────────────────────────────────────
function TarefaCardKanban({ tarefa, onClick }: { tarefa: Tarefa; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: tarefa.id });
  const style = transform ? { transform: `translate(${transform.x}px,${transform.y}px)` } : undefined;
  const hoje = new Date().toISOString().split("T")[0];
  const atrasada = tarefa.data_prazo && tarefa.data_prazo < hoje && tarefa.status !== "concluido";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "bg-surface border border-[#E8D5A3]/50 rounded-btn p-3 shadow-sm transition-all",
        isDragging ? "opacity-30" : "hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-2">
        <button {...listeners} className="mt-0.5 cursor-grab text-text-muted hover:text-gold flex-shrink-0">
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0" onClick={onClick} role="button">
          <p className="text-sm font-medium text-text-main leading-snug">{tarefa.titulo}</p>
          {tarefa.descricao && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">{tarefa.descricao}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
              style={{ backgroundColor: PRIORIDADE_CONFIG[tarefa.prioridade].cor + "20", color: PRIORIDADE_CONFIG[tarefa.prioridade].cor }}>
              {PRIORIDADE_CONFIG[tarefa.prioridade].label}
            </span>
            {tarefa.cliente_nome && (
              <span className="text-[10px] text-text-muted flex items-center gap-1">
                <Building2 size={9} />{tarefa.cliente_nome}
              </span>
            )}
            {tarefa.data_prazo && (
              <span className={cn("text-[10px] flex items-center gap-1", atrasada ? "text-danger font-semibold" : "text-text-muted")}>
                <Calendar size={9} />{atrasada ? "Atrasada" : formatDate(tarefa.data_prazo)}
              </span>
            )}
          </div>
          {tarefa.responsavel_nome && (
            <p className="text-[10px] text-text-muted mt-1.5 flex items-center gap-1">
              <User size={9} />{tarefa.responsavel_nome}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── COLUNA DO KANBAN (droppable) ──────────────────────────────────
function KanbanColuna({ col, tarefas, onClickTarefa, onNova }: {
  col: typeof COLUNAS[0];
  tarefas: Tarefa[];
  onClickTarefa: (t: Tarefa) => void;
  onNova: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div className="w-72 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.cor }} />
          <span className="text-sm font-semibold text-text-main">{col.label}</span>
          <span className="text-xs bg-[#E8D5A3]/30 text-text-muted rounded-full px-2 py-0.5 font-mono-data">
            {tarefas.length}
          </span>
        </div>
        <button onClick={onNova} className="text-text-muted hover:text-gold transition-colors" title="Nova tarefa nesta coluna">
          <Plus size={16} />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-24 space-y-2 p-2 rounded-btn transition-colors",
          isOver ? "bg-gold/10 border border-dashed border-gold/40" : "bg-[#E8D5A3]/10"
        )}
      >
        {tarefas.map((t) => (
          <TarefaCardKanban key={t.id} tarefa={t} onClick={() => onClickTarefa(t)} />
        ))}
        {tarefas.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4 opacity-50">Solte aqui</p>
        )}
      </div>
    </div>
  );
}

// ── MODAL CRIAR / EDITAR ──────────────────────────────────────────
function TarefaModal({ tarefa, statusInicial, clientes, usuarios, onClose, onSave }: {
  tarefa: Tarefa | null;
  statusInicial: Status;
  clientes: Cliente[];
  usuarios: Usuario[];
  onClose: () => void;
  onSave: () => void;
}) {
  const supabase = createClient();
  const isNova = !tarefa;

  const [form, setForm] = useState({
    titulo:        tarefa?.titulo          ?? "",
    descricao:     tarefa?.descricao       ?? "",
    status:        tarefa?.status          ?? statusInicial,
    prioridade:    tarefa?.prioridade      ?? "media" as Prioridade,
    cliente_id:    tarefa?.cliente_id      ?? "",
    responsavel_id: tarefa?.responsavel_id ?? "",
    data_prazo:    tarefa?.data_prazo      ?? "",
  });
  const [salvando, setSalvando] = useState(false);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function salvar() {
    if (!form.titulo.trim()) return;
    setSalvando(true);
    const payload = {
      titulo:         form.titulo.trim(),
      descricao:      form.descricao       || null,
      status:         form.status,
      prioridade:     form.prioridade,
      cliente_id:     form.cliente_id      || null,
      responsavel_id: form.responsavel_id  || null,
      data_prazo:     form.data_prazo      || null,
      atualizado_em:  new Date().toISOString(),
    };
    if (isNova) {
      await supabase.from("tarefas").insert(payload);
    } else {
      await supabase.from("tarefas").update(payload).eq("id", tarefa.id);
    }
    onSave();
    onClose();
    setSalvando(false);
  }

  async function excluir() {
    if (!tarefa) return;
    if (!confirm("Excluir esta tarefa?")) return;
    await supabase.from("tarefas").delete().eq("id", tarefa.id);
    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-card w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-[#E8D5A3]/50">
          <h2 className="font-display text-xl font-semibold text-text-main">
            {isNova ? "Nova Tarefa" : "Editar Tarefa"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-main">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input
              value={form.titulo}
              onChange={(e) => set("titulo", e.target.value)}
              placeholder="O que precisa ser feito?"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && salvar()}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <textarea
              className="w-full rounded-btn border border-[#E8D5A3] bg-bg p-3 text-sm text-text-main placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
              rows={3}
              placeholder="Detalhes, contexto, links..."
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-surface text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold/30">
                <option value="a_fazer">A fazer</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <select value={form.prioridade} onChange={(e) => set("prioridade", e.target.value)}
                className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-surface text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold/30">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Cliente (opcional)</Label>
              <select value={form.cliente_id} onChange={(e) => set("cliente_id", e.target.value)}
                className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-surface text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold/30">
                <option value="">Interno (sem cliente)</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <select value={form.responsavel_id} onChange={(e) => set("responsavel_id", e.target.value)}
                className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-surface text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold/30">
                <option value="">Sem responsável</option>
                {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Data limite</Label>
            <Input type="date" value={form.data_prazo} onChange={(e) => set("data_prazo", e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-[#E8D5A3]/50">
          <div>
            {!isNova && (
              <button onClick={excluir} className="text-sm text-danger hover:underline">
                Excluir
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando || !form.titulo.trim()}>
              {salvando ? "Salvando..." : isNova ? "Criar" : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────
type View   = "kanban" | "lista";
type Filtro = "todos" | "minhas" | string;

export default function TarefasPage() {
  const supabase = createClient();
  const [tarefas,  setTarefas]  = useState<Tarefa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [userId,   setUserId]   = useState<string | null>(null);
  const [view,     setView]     = useState<View>("kanban");
  const [filtro,   setFiltro]   = useState<Filtro>("todos");
  const [modal,    setModal]    = useState<Tarefa | null | undefined>(undefined);
  const [statusModal, setStatusModal] = useState<Status>("a_fazer");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const carregar = useCallback(async () => {
    const [tRes, cRes, uRes, authRes] = await Promise.all([
      supabase
        .from("tarefas")
        .select("*, clientes(nome), usuarios!responsavel_id(nome)")
        .order("criado_em", { ascending: false }),
      supabase.from("clientes").select("id, nome").eq("status", "ativo").order("nome"),
      supabase.from("usuarios").select("id, nome").eq("ativo", true).order("nome"),
      supabase.auth.getUser(),
    ]);

    if (tRes.data) {
      setTarefas(tRes.data.map((t) => ({
        ...t,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cliente_nome:    (t.clientes as any)?.nome ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responsavel_nome: (t.usuarios as any)?.nome ?? null,
      })));
    }
    if (cRes.data) setClientes(cRes.data);
    if (uRes.data) setUsuarios(uRes.data);
    setUserId(authRes.data.user?.id ?? null);
  }, [supabase]);

  useEffect(() => { carregar(); }, [carregar]);

  const filtradas = tarefas.filter((t) => {
    if (filtro === "minhas") return t.responsavel_id === userId;
    if (filtro !== "todos")  return t.cliente_id === filtro;
    return true;
  });

  function porStatus(s: Status) { return filtradas.filter((t) => t.status === s); }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const novoStatus = over.id as Status;
    if (!COLUNAS.find((c) => c.id === novoStatus)) return;
    const tarefa = tarefas.find((t) => t.id === active.id);
    if (!tarefa || tarefa.status === novoStatus) return;
    setTarefas((prev) => prev.map((t) => t.id === tarefa.id ? { ...t, status: novoStatus } : t));
    await supabase.from("tarefas").update({ status: novoStatus, atualizado_em: new Date().toISOString() }).eq("id", tarefa.id);
  }

  function abrirNova(status: Status = "a_fazer") {
    setStatusModal(status);
    setModal(null);
  }

  const hoje = new Date().toISOString().split("T")[0];
  const atrasadas = filtradas.filter((t) => t.data_prazo && t.data_prazo < hoje && t.status !== "concluido").length;
  const activeTarefa = tarefas.find((t) => t.id === activeId);

  // Clientes que têm tarefas (para filtro dinâmico)
  const clientesComTarefas = clientes.filter((c) => tarefas.some((t) => t.cliente_id === c.id));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">Tarefas</h1>
          <p className="text-text-muted mt-1 text-sm">
            {filtradas.filter((t) => t.status !== "concluido").length} pendente{filtradas.filter((t) => t.status !== "concluido").length !== 1 ? "s" : ""}
            {atrasadas > 0 && <span className="text-danger ml-2 font-medium">· {atrasadas} atrasada{atrasadas > 1 ? "s" : ""}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-btn border border-[#E8D5A3] overflow-hidden">
            <button onClick={() => setView("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === "kanban" ? "bg-primary text-white" : "text-text-muted hover:text-text-main"}`}>
              <LayoutGrid size={14} /> Kanban
            </button>
            <button onClick={() => setView("lista")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === "lista" ? "bg-primary text-white" : "text-text-muted hover:text-text-main"}`}>
              <List size={14} /> Lista
            </button>
          </div>
          <Button onClick={() => abrirNova()}>
            <Plus size={16} /> Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "todos",  label: "Todas" },
          { key: "minhas", label: "Minhas tarefas" },
        ].map((f) => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            className={`px-4 py-1.5 rounded-btn text-sm font-medium transition-all ${filtro === f.key ? "bg-primary text-gold" : "bg-surface border border-[#E8D5A3]/50 text-text-muted hover:text-text-main"}`}>
            {f.label}
          </button>
        ))}
        {clientesComTarefas.map((c) => (
          <button key={c.id} onClick={() => setFiltro(c.id)}
            className={`px-4 py-1.5 rounded-btn text-sm font-medium transition-all ${filtro === c.id ? "bg-primary text-gold" : "bg-surface border border-[#E8D5A3]/50 text-text-muted hover:text-text-main"}`}>
            {c.nome}
          </button>
        ))}
      </div>

      {/* KANBAN */}
      {view === "kanban" && (
        <div className="overflow-x-auto pb-6">
          <DndContext
            sensors={sensors}
            onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-5 min-w-max">
              {COLUNAS.map((col) => (
                <KanbanColuna
                  key={col.id}
                  col={col}
                  tarefas={porStatus(col.id)}
                  onClickTarefa={setModal}
                  onNova={() => abrirNova(col.id)}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTarefa ? (
                <div className="bg-surface border border-gold/30 rounded-btn p-3 shadow-xl w-72 opacity-95">
                  <p className="text-sm font-medium text-text-main">{activeTarefa.titulo}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* LISTA */}
      {view === "lista" && (
        <div className="space-y-6">
          {COLUNAS.map((col) => {
            const items = porStatus(col.id);
            if (items.length === 0) return null;
            return (
              <div key={col.id}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.cor }} />
                  <h3 className="text-sm font-semibold text-text-main">{col.label}</h3>
                  <span className="text-xs text-text-muted">({items.length})</span>
                </div>
                <Card>
                  <CardContent className="p-0 divide-y divide-[#E8D5A3]/30">
                    {items.map((t) => {
                      const atrasada = t.data_prazo && t.data_prazo < hoje && t.status !== "concluido";
                      return (
                        <div key={t.id} onClick={() => setModal(t)}
                          className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg cursor-pointer transition-colors">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: col.cor }} />
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium", t.status === "concluido" ? "line-through text-text-muted" : "text-text-main")}>
                              {t.titulo}
                            </p>
                            {t.descricao && <p className="text-xs text-text-muted truncate mt-0.5">{t.descricao}</p>}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                            {t.cliente_nome && (
                              <span className="text-text-muted hidden md:flex items-center gap-1">
                                <Building2 size={11} />{t.cliente_nome}
                              </span>
                            )}
                            {t.responsavel_nome && (
                              <span className="text-text-muted hidden lg:flex items-center gap-1">
                                <User size={11} />{t.responsavel_nome}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded font-semibold text-[10px]"
                              style={{ backgroundColor: PRIORIDADE_CONFIG[t.prioridade].cor + "20", color: PRIORIDADE_CONFIG[t.prioridade].cor }}>
                              <Flag size={9} className="inline mr-0.5" />
                              {PRIORIDADE_CONFIG[t.prioridade].label}
                            </span>
                            {t.data_prazo && (
                              <span className={cn("flex items-center gap-1", atrasada ? "text-danger font-semibold" : "text-text-muted")}>
                                <Calendar size={11} />
                                {atrasada ? "Atrasada" : formatDate(t.data_prazo)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {filtradas.length === 0 && (
            <div className="text-center py-20 text-text-muted">
              <CheckSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma tarefa ainda.</p>
              <Button className="mt-4" onClick={() => abrirNova()}>
                <Plus size={16} /> Criar primeira tarefa
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal !== undefined && (
        <TarefaModal
          tarefa={modal}
          statusInicial={statusModal}
          clientes={clientes}
          usuarios={usuarios}
          onClose={() => setModal(undefined)}
          onSave={carregar}
        />
      )}
    </div>
  );
}
