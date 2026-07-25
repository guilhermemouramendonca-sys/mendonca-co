"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, X, LayoutGrid, List, Calendar, User, Building2,
  GripVertical, CheckSquare, Check, Trash2, Pencil,
} from "lucide-react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
} from "@dnd-kit/core";
import { cn, formatDate } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────
type Coluna   = { id: string; nome: string; cor: string; ordem: number };
type Prioridade = "baixa" | "media" | "alta";

type Tarefa = {
  id: string;
  titulo: string;
  descricao?: string | null;
  status: string;
  prioridade: Prioridade;
  cliente_id?: string | null;
  responsavel_id?: string | null;
  responsavel_externo?: string | null;
  data_prazo?: string | null;
  criado_em: string;
  cliente_nome?: string | null;
  responsavel_nome?: string | null;
};

type Cliente = { id: string; nome: string };
type Usuario = { id: string; nome: string };
type Contato = { id: string; nome: string; cargo?: string };

// ── Constants ──────────────────────────────────────────────────────
const PRIORIDADE_CONFIG: Record<Prioridade, { label: string; cor: string }> = {
  baixa: { label: "Baixa", cor: "#6B6B6B" },
  media: { label: "Média", cor: "#C9A84C" },
  alta:  { label: "Alta",  cor: "#C0392B" },
};

const CORES_PRESET = [
  "#6B6B6B", "#C9A84C", "#27AE60", "#2980B9",
  "#8E44AD", "#C0392B", "#E67E22", "#0D2B2E",
];

// ── TarefaCard (draggable) ─────────────────────────────────────────
function TarefaCardKanban({ tarefa, onClick }: { tarefa: Tarefa; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: tarefa.id });
  const style = transform ? { transform: `translate(${transform.x}px,${transform.y}px)` } : undefined;
  const hoje = new Date().toISOString().split("T")[0];
  const atrasada = tarefa.data_prazo && tarefa.data_prazo < hoje;
  const nomeResp = tarefa.responsavel_externo || tarefa.responsavel_nome;

  return (
    <div ref={setNodeRef} style={style} {...attributes}
      className={cn("bg-surface border border-[#E8D5A3]/50 rounded-btn p-3 shadow-sm transition-all",
        isDragging ? "opacity-30" : "hover:shadow-md")}>
      <div className="flex items-start gap-2">
        <button {...listeners} className="mt-0.5 cursor-grab text-text-muted hover:text-gold flex-shrink-0 active:cursor-grabbing">
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
          {nomeResp && (
            <p className="text-[10px] text-text-muted mt-1.5 flex items-center gap-1">
              <User size={9} />{nomeResp}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Coluna do Kanban ───────────────────────────────────────────────
function KanbanColuna({ coluna, tarefas, onClickTarefa, onNova, onRename, onDelete, onChangeCor }: {
  coluna: Coluna;
  tarefas: Tarefa[];
  onClickTarefa: (t: Tarefa) => void;
  onNova: () => void;
  onRename: (novoNome: string) => void;
  onDelete: () => void;
  onChangeCor: (cor: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.id });
  const [editando, setEditando] = useState(false);
  const [nomeEdit, setNomeEdit] = useState(coluna.nome);
  const [showCores, setShowCores] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function confirmarNome() {
    if (nomeEdit.trim() && nomeEdit.trim() !== coluna.nome) onRename(nomeEdit.trim());
    setEditando(false);
    setShowCores(false);
  }

  useEffect(() => { if (editando) inputRef.current?.focus(); }, [editando]);

  return (
    <div className="w-64 flex-shrink-0">
      {/* Header da coluna */}
      <div className="flex items-center gap-1.5 mb-3 group">
        {/* Cor + picker */}
        <div className="relative">
          <button
            onClick={() => { setShowCores(!showCores); setEditando(true); }}
            className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ring-2 ring-transparent hover:ring-offset-1 hover:ring-current transition-all"
            style={{ backgroundColor: coluna.cor }}
          />
          {showCores && (
            <div className="absolute top-5 left-0 z-20 bg-surface border border-[#E8D5A3] rounded-btn p-2 shadow-lg grid grid-cols-4 gap-1.5">
              {CORES_PRESET.map((c) => (
                <button key={c} onClick={() => { onChangeCor(c); setShowCores(false); }}
                  className={cn("w-5 h-5 rounded-full hover:scale-110 transition-transform",
                    c === coluna.cor ? "ring-2 ring-offset-1 ring-text-main" : "")}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          )}
        </div>

        {/* Nome */}
        {editando ? (
          <input ref={inputRef} value={nomeEdit} onChange={(e) => setNomeEdit(e.target.value)}
            onBlur={confirmarNome} onKeyDown={(e) => { if (e.key === "Enter") confirmarNome(); if (e.key === "Escape") { setEditando(false); setNomeEdit(coluna.nome); } }}
            className="flex-1 text-sm font-semibold text-text-main bg-transparent border-b border-gold outline-none min-w-0" />
        ) : (
          <button onClick={() => setEditando(true)} className="flex-1 text-sm font-semibold text-text-main text-left hover:text-gold transition-colors truncate">
            {coluna.nome}
          </button>
        )}

        <span className="text-xs text-text-muted font-mono-data">{tarefas.length}</span>

        {/* Ações */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!editando && (
            <button onClick={() => setEditando(true)} className="text-text-muted hover:text-gold transition-colors p-0.5">
              <Pencil size={12} />
            </button>
          )}
          {editando && (
            <button onClick={confirmarNome} className="text-gold p-0.5">
              <Check size={12} />
            </button>
          )}
          {tarefas.length === 0 && (
            <button onClick={onDelete} className="text-text-muted hover:text-danger transition-colors p-0.5" title="Excluir coluna vazia">
              <Trash2 size={12} />
            </button>
          )}
          <button onClick={onNova} className="text-text-muted hover:text-gold transition-colors p-0.5">
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div ref={setNodeRef}
        className={cn("min-h-20 space-y-2 p-2 rounded-btn transition-colors",
          isOver ? "bg-gold/10 border border-dashed border-gold/40" : "bg-[#E8D5A3]/10")}>
        {tarefas.map((t) => (
          <TarefaCardKanban key={t.id} tarefa={t} onClick={() => onClickTarefa(t)} />
        ))}
        {tarefas.length === 0 && (
          <p className="text-xs text-text-muted/40 text-center py-3">Vazio</p>
        )}
      </div>
    </div>
  );
}

// ── Modal Criar / Editar ───────────────────────────────────────────
function TarefaModal({ tarefa, statusInicial, colunas, clientes, usuarios, onClose, onSave }: {
  tarefa: Tarefa | null;
  statusInicial: string;
  colunas: Coluna[];
  clientes: Cliente[];
  usuarios: Usuario[];
  onClose: () => void;
  onSave: () => void;
}) {
  const supabase = createClient();
  const isNova = !tarefa;
  const [contatos, setContatos] = useState<Contato[]>([]);

  const [form, setForm] = useState({
    titulo:            tarefa?.titulo           ?? "",
    descricao:         tarefa?.descricao        ?? "",
    status:            tarefa?.status           ?? statusInicial,
    prioridade:        tarefa?.prioridade       ?? "media" as Prioridade,
    cliente_id:        tarefa?.cliente_id       ?? "",
    responsavel_tipo:  tarefa?.responsavel_externo ? "externo" : tarefa?.responsavel_id ? "interno" : "",
    responsavel_id:    tarefa?.responsavel_id   ?? "",
    responsavel_externo: tarefa?.responsavel_externo ?? "",
    data_prazo:        tarefa?.data_prazo       ?? "",
  });
  const [salvando, setSalvando] = useState(false);

  // Carregar contatos quando cliente muda
  useEffect(() => {
    if (!form.cliente_id) { setContatos([]); return; }
    supabase.from("contatos").select("id, nome, cargo").eq("cliente_id", form.cliente_id).order("principal", { ascending: false })
      .then(({ data }) => setContatos(data ?? []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cliente_id]);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function salvar() {
    if (!form.titulo.trim()) return;
    setSalvando(true);
    const payload = {
      titulo:              form.titulo.trim(),
      descricao:           form.descricao || null,
      status:              form.status,
      prioridade:          form.prioridade,
      cliente_id:          form.cliente_id || null,
      responsavel_id:      form.responsavel_tipo === "interno" ? (form.responsavel_id || null) : null,
      responsavel_externo: form.responsavel_tipo === "externo" ? (form.responsavel_externo || null) : null,
      data_prazo:          form.data_prazo || null,
    };
    if (isNova) await supabase.from("tarefas").insert(payload);
    else await supabase.from("tarefas").update(payload).eq("id", tarefa.id);
    onSave();
    onClose();
    setSalvando(false);
  }

  async function excluir() {
    if (!tarefa || !confirm("Excluir esta tarefa?")) return;
    await supabase.from("tarefas").delete().eq("id", tarefa.id);
    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-card w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-[#E8D5A3]/50">
          <h2 className="font-display text-xl font-semibold text-text-main">
            {isNova ? "Nova Tarefa" : "Editar Tarefa"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-main"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)}
              placeholder="O que precisa ser feito?" autoFocus onKeyDown={(e) => e.key === "Enter" && salvar()} />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <textarea className="w-full rounded-btn border border-[#E8D5A3] bg-bg p-3 text-sm text-text-main placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
              rows={2} placeholder="Detalhes, contexto, links..." value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Coluna</Label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-surface text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold/30">
                {colunas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
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

          <div className="space-y-1.5">
            <Label>Cliente (opcional)</Label>
            <select value={form.cliente_id} onChange={(e) => { set("cliente_id", e.target.value); set("responsavel_tipo", ""); set("responsavel_id", ""); set("responsavel_externo", ""); }}
              className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-surface text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold/30">
              <option value="">Interno (sem cliente)</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          {/* Responsável */}
          <div className="space-y-1.5">
            <Label>Responsável</Label>
            <select
              value={form.responsavel_tipo === "interno" ? `u:${form.responsavel_id}` : form.responsavel_tipo === "externo" ? `e:${form.responsavel_externo}` : ""}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) { set("responsavel_tipo", ""); set("responsavel_id", ""); set("responsavel_externo", ""); }
                else if (val.startsWith("u:")) { set("responsavel_tipo", "interno"); set("responsavel_id", val.slice(2)); set("responsavel_externo", ""); }
                else if (val.startsWith("e:")) { set("responsavel_tipo", "externo"); set("responsavel_externo", val.slice(2)); set("responsavel_id", ""); }
              }}
              className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-surface text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold/30">
              <option value="">Sem responsável</option>
              {usuarios.length > 0 && (
                <optgroup label="— Equipe interna">
                  {usuarios.map((u) => <option key={u.id} value={`u:${u.id}`}>{u.nome}</option>)}
                </optgroup>
              )}
              {contatos.length > 0 && (
                <optgroup label={`— Contatos do cliente`}>
                  {contatos.map((c) => <option key={c.id} value={`e:${c.nome}`}>{c.nome}{c.cargo ? ` (${c.cargo})` : ""}</option>)}
                </optgroup>
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Data limite</Label>
            <Input type="date" value={form.data_prazo} onChange={(e) => set("data_prazo", e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-[#E8D5A3]/50">
          <div>
            {!isNova && (
              <button onClick={excluir} className="text-sm text-danger hover:underline">Excluir</button>
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

// ── Página principal ───────────────────────────────────────────────
type View   = "kanban" | "lista";
type Filtro = "todos" | "minhas" | string;

export default function TarefasPage() {
  const supabase = createClient();
  const [colunas,  setColunas]  = useState<Coluna[]>([]);
  const [tarefas,  setTarefas]  = useState<Tarefa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [userId,   setUserId]   = useState<string | null>(null);
  const [view,     setView]     = useState<View>("kanban");
  const [filtro,   setFiltro]   = useState<Filtro>("todos");
  const [modal,    setModal]    = useState<Tarefa | null | undefined>(undefined);
  const [statusModal, setStatusModal] = useState<string>("");
  const [activeId, setActiveId] = useState<string | null>(null);

  // Nova coluna
  const [addingColuna, setAddingColuna] = useState(false);
  const [novaColunaNome, setNovaColunaNome] = useState("");
  const novaInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const carregar = useCallback(async () => {
    const [colRes, tRes, cRes, uRes, authRes] = await Promise.all([
      supabase.from("kanban_colunas").select("*").order("ordem"),
      supabase.from("tarefas").select("*, clientes(nome), usuarios!responsavel_id(nome)").order("criado_em", { ascending: false }),
      supabase.from("clientes").select("id, nome").eq("status", "ativo").order("nome"),
      supabase.from("usuarios").select("id, nome").eq("ativo", true).order("nome"),
      supabase.auth.getUser(),
    ]);
    if (colRes.data) setColunas(colRes.data);
    if (tRes.data) setTarefas(tRes.data.map((t) => ({
      ...t,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cliente_nome:     (t.clientes as any)?.nome ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responsavel_nome: (t.usuarios as any)?.nome ?? null,
    })));
    if (cRes.data) setClientes(cRes.data);
    if (uRes.data) setUsuarios(uRes.data);
    setUserId(authRes.data.user?.id ?? null);
  }, [supabase]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { if (addingColuna) novaInputRef.current?.focus(); }, [addingColuna]);

  // ── Colunas ─────────────────────────────────────────────────────
  async function renomearColuna(id: string, nome: string) {
    setColunas((prev) => prev.map((c) => c.id === id ? { ...c, nome } : c));
    await supabase.from("kanban_colunas").update({ nome }).eq("id", id);
  }

  async function mudarCorColuna(id: string, cor: string) {
    setColunas((prev) => prev.map((c) => c.id === id ? { ...c, cor } : c));
    await supabase.from("kanban_colunas").update({ cor }).eq("id", id);
  }

  async function deletarColuna(id: string) {
    if (!confirm("Excluir esta coluna?")) return;
    setColunas((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("kanban_colunas").delete().eq("id", id);
  }

  async function criarColuna() {
    const nome = novaColunaNome.trim();
    if (!nome) { setAddingColuna(false); return; }
    const ordem = colunas.length;
    const { data } = await supabase.from("kanban_colunas").insert({ nome, cor: "#6B6B6B", ordem }).select().single();
    if (data) setColunas((prev) => [...prev, data]);
    setNovaColunaNome("");
    setAddingColuna(false);
  }

  // ── DnD ─────────────────────────────────────────────────────────
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const novoStatus = over.id as string;
    if (!colunas.find((c) => c.id === novoStatus)) return;
    const tarefa = tarefas.find((t) => t.id === active.id);
    if (!tarefa || tarefa.status === novoStatus) return;
    setTarefas((prev) => prev.map((t) => t.id === tarefa.id ? { ...t, status: novoStatus } : t));
    await supabase.from("tarefas").update({ status: novoStatus }).eq("id", tarefa.id);
  }

  // ── Filtros ──────────────────────────────────────────────────────
  const filtradas = tarefas.filter((t) => {
    if (filtro === "minhas") return t.responsavel_id === userId;
    if (filtro !== "todos")  return t.cliente_id === filtro;
    return true;
  });

  function porColuna(colunaId: string) { return filtradas.filter((t) => t.status === colunaId); }

  const hoje = new Date().toISOString().split("T")[0];
  const atrasadas = filtradas.filter((t) => t.data_prazo && t.data_prazo < hoje && !tarefasNaColunaConcluido(t)).length;
  function tarefasNaColunaConcluido(t: Tarefa) {
    const coluna = colunas.find((c) => c.id === t.status);
    return coluna?.nome?.toLowerCase().includes("conclu");
  }

  const clientesComTarefas = clientes.filter((c) => tarefas.some((t) => t.cliente_id === c.id));
  const activeTarefa = tarefas.find((t) => t.id === activeId);

  function abrirNova(status?: string) {
    setStatusModal(status ?? colunas[0]?.id ?? "");
    setModal(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">Tarefas</h1>
          <p className="text-text-muted mt-1 text-sm">
            {filtradas.filter((t) => !tarefasNaColunaConcluido(t)).length} pendente{filtradas.filter((t) => !tarefasNaColunaConcluido(t)).length !== 1 ? "s" : ""}
            {atrasadas > 0 && <span className="text-danger ml-2 font-medium">· {atrasadas} atrasada{atrasadas > 1 ? "s" : ""}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-btn border border-[#E8D5A3] overflow-hidden">
            <button onClick={() => setView("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === "kanban" ? "bg-primary text-white" : "text-text-muted hover:text-text-main"}`}>
              <LayoutGrid size={13} /> Kanban
            </button>
            <button onClick={() => setView("lista")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === "lista" ? "bg-primary text-white" : "text-text-muted hover:text-text-main"}`}>
              <List size={13} /> Lista
            </button>
          </div>
          <Button onClick={() => abrirNova()}><Plus size={16} /> Nova Tarefa</Button>
        </div>
      </div>

      {/* Filtros compactos */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {[{ key: "todos", label: "Todas" }, { key: "minhas", label: "Minhas" }].map((f) => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${filtro === f.key ? "bg-primary text-gold" : "bg-surface border border-[#E8D5A3]/60 text-text-muted hover:text-text-main"}`}>
            {f.label}
          </button>
        ))}
        {clientesComTarefas.map((c) => (
          <button key={c.id} onClick={() => setFiltro(c.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${filtro === c.id ? "bg-primary text-gold" : "bg-surface border border-[#E8D5A3]/60 text-text-muted hover:text-text-main"}`}>
            {c.nome}
          </button>
        ))}
      </div>

      {/* KANBAN */}
      {view === "kanban" && (
        <div className="overflow-x-auto pb-6">
          <DndContext sensors={sensors}
            onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
            onDragEnd={handleDragEnd}>
            <div className="flex gap-4 min-w-max items-start">
              {colunas.map((col) => (
                <KanbanColuna key={col.id} coluna={col}
                  tarefas={porColuna(col.id)}
                  onClickTarefa={setModal}
                  onNova={() => abrirNova(col.id)}
                  onRename={(nome) => renomearColuna(col.id, nome)}
                  onDelete={() => deletarColuna(col.id)}
                  onChangeCor={(cor) => mudarCorColuna(col.id, cor)}
                />
              ))}

              {/* Adicionar coluna */}
              <div className="w-56 flex-shrink-0 mt-6">
                {addingColuna ? (
                  <div className="flex gap-1.5">
                    <input ref={novaInputRef} value={novaColunaNome} onChange={(e) => setNovaColunaNome(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") criarColuna(); if (e.key === "Escape") { setAddingColuna(false); setNovaColunaNome(""); } }}
                      onBlur={criarColuna}
                      className="flex-1 text-sm border border-gold rounded-btn px-2 py-1 bg-surface outline-none focus:ring-2 focus:ring-gold/30"
                      placeholder="Nome da coluna" />
                  </div>
                ) : (
                  <button onClick={() => setAddingColuna(true)}
                    className="flex items-center gap-2 text-sm text-text-muted hover:text-gold transition-colors px-2 py-1 rounded-btn hover:bg-gold/5 w-full">
                    <Plus size={15} /> Nova coluna
                  </button>
                )}
              </div>
            </div>

            <DragOverlay>
              {activeTarefa ? (
                <div className="bg-surface border border-gold/30 rounded-btn p-3 shadow-xl w-64 opacity-95">
                  <p className="text-sm font-medium text-text-main">{activeTarefa.titulo}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* LISTA */}
      {view === "lista" && (
        <div className="space-y-5">
          {colunas.map((col) => {
            const items = porColuna(col.id);
            if (items.length === 0) return null;
            return (
              <div key={col.id}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.cor }} />
                  <h3 className="text-sm font-semibold text-text-main">{col.nome}</h3>
                  <span className="text-xs text-text-muted">({items.length})</span>
                </div>
                <Card>
                  <CardContent className="p-0 divide-y divide-[#E8D5A3]/30">
                    {items.map((t) => {
                      const atrasada = t.data_prazo && t.data_prazo < hoje && !tarefasNaColunaConcluido(t);
                      const nomeResp = t.responsavel_externo || t.responsavel_nome;
                      return (
                        <div key={t.id} onClick={() => setModal(t)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-bg cursor-pointer transition-colors">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.cor }} />
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium", tarefasNaColunaConcluido(t) ? "line-through text-text-muted" : "text-text-main")}>
                              {t.titulo}
                            </p>
                            {t.descricao && <p className="text-xs text-text-muted truncate">{t.descricao}</p>}
                          </div>
                          <div className="flex items-center gap-2.5 flex-shrink-0 text-xs">
                            {t.cliente_nome && (
                              <span className="text-text-muted hidden md:flex items-center gap-1">
                                <Building2 size={11} />{t.cliente_nome}
                              </span>
                            )}
                            {nomeResp && (
                              <span className="text-text-muted hidden lg:flex items-center gap-1">
                                <User size={11} />{nomeResp}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded font-semibold text-[10px]"
                              style={{ backgroundColor: PRIORIDADE_CONFIG[t.prioridade].cor + "20", color: PRIORIDADE_CONFIG[t.prioridade].cor }}>
                              {PRIORIDADE_CONFIG[t.prioridade].label}
                            </span>
                            {t.data_prazo && (
                              <span className={cn("flex items-center gap-1", atrasada ? "text-danger font-semibold" : "text-text-muted")}>
                                <Calendar size={11} />{atrasada ? "Atrasada" : formatDate(t.data_prazo)}
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
        <TarefaModal tarefa={modal} statusInicial={statusModal}
          colunas={colunas} clientes={clientes} usuarios={usuarios}
          onClose={() => setModal(undefined)} onSave={carregar} />
      )}
    </div>
  );
}
