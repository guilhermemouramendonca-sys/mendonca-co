"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Mail, UserCircle } from "lucide-react";

export type Funcionario = {
  id: string;
  cliente_id: string;
  nome: string;
  cargo: string;
  departamento: string;
  nivel: string;
  gestor_id: string | null;
  data_admissao: string | null;
  email: string | null;
  status: string;
};

const NIVEIS = ["Junior", "Pleno", "Sênior", "Especialista", "Gestor", "Gerente", "Diretor", "VP", "C-Level"];
const STATUS_OPTS = ["ativo", "ferias", "licenca", "inativo"];
const STATUS_LABELS: Record<string, string> = { ativo: "Ativo", ferias: "Férias", licenca: "Licença", inativo: "Inativo" };
const STATUS_CORES: Record<string, string> = { ativo: "#27AE60", ferias: "#C9A84C", licenca: "#2980B9", inativo: "#95A5A6" };

const EMPTY: Omit<Funcionario, "id" | "cliente_id"> = {
  nome: "", cargo: "", departamento: "", nivel: "Pleno",
  gestor_id: null, data_admissao: null, email: null, status: "ativo",
};

export default function FuncionariosTab({ clienteId, funcionarios, onRefresh }: {
  clienteId: string; funcionarios: Funcionario[]; onRefresh: () => void;
}) {
  const supabase = createClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [salvando, setSalvando] = useState(false);
  const [filtro, setFiltro] = useState("");

  function abrirNovo() { setEditando(null); setForm(EMPTY); setModalAberto(true); }
  function abrirEditar(f: Funcionario) { setEditando(f); setForm({ nome: f.nome, cargo: f.cargo, departamento: f.departamento, nivel: f.nivel, gestor_id: f.gestor_id, data_admissao: f.data_admissao, email: f.email, status: f.status }); setModalAberto(true); }

  async function salvar() {
    if (!form.nome.trim() || !form.cargo.trim()) return;
    setSalvando(true);
    if (editando) {
      await supabase.from("funcionarios").update(form).eq("id", editando.id);
    } else {
      await supabase.from("funcionarios").insert({ ...form, cliente_id: clienteId });
    }
    setSalvando(false);
    setModalAberto(false);
    onRefresh();
  }

  async function excluir(id: string) {
    if (!confirm("Remover funcionário?")) return;
    await supabase.from("funcionarios").delete().eq("id", id);
    onRefresh();
  }

  const filtrados = funcionarios.filter((f) =>
    f.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    f.cargo.toLowerCase().includes(filtro.toLowerCase()) ||
    f.departamento.toLowerCase().includes(filtro.toLowerCase())
  );

  // Agrupar por departamento
  const porDepto: Record<string, Funcionario[]> = {};
  for (const f of filtrados) {
    const d = f.departamento || "Sem departamento";
    if (!porDepto[d]) porDepto[d] = [];
    porDepto[d].push(f);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Input
          placeholder="Buscar por nome, cargo ou departamento..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto">
          <Button onClick={abrirNovo}><Plus size={15} /> Novo funcionário</Button>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <UserCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-4">Nenhum funcionário cadastrado.</p>
          <Button onClick={abrirNovo}><Plus size={15} /> Adicionar primeiro</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(porDepto).map(([depto, lista]) => (
            <div key={depto}>
              <h3 className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">{depto} <span className="ml-1 opacity-60">({lista.length})</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lista.map((f) => {
                  const gestor = funcionarios.find((g) => g.id === f.gestor_id);
                  return (
                    <div key={f.id} className="bg-surface rounded-card border border-[#E8D5A3]/50 p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-gold font-display font-bold text-sm">{f.nome.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-text-main text-sm">{f.nome}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: STATUS_CORES[f.status] }}>
                            {STATUS_LABELS[f.status]}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted">{f.cargo} · {f.nivel}</p>
                        {gestor && <p className="text-xs text-text-muted mt-0.5">Reporta a: {gestor.nome}</p>}
                        {f.email && (
                          <a href={`mailto:${f.email}`} className="text-xs text-gold hover:underline flex items-center gap-1 mt-1">
                            <Mail size={11} /> {f.email}
                          </a>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => abrirEditar(f)} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg rounded transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => excluir(f.id)} className="p-1.5 text-text-muted hover:text-danger hover:bg-bg rounded transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-card shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E8D5A3]/30">
              <h2 className="font-display text-xl font-semibold text-text-main">
                {editando ? "Editar funcionário" : "Novo funcionário"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Nome completo *</Label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" />
                </div>
                <div className="space-y-1.5">
                  <Label>Cargo *</Label>
                  <Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="CEO, Analista..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Nível</Label>
                  <select value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })} className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
                    {NIVEIS.map((n) => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Departamento</Label>
                  <Input value={form.departamento} onChange={(e) => setForm({ ...form, departamento: e.target.value })} placeholder="Comercial, RH, TI..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
                    {STATUS_OPTS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Gestor direto</Label>
                  <select value={form.gestor_id ?? ""} onChange={(e) => setForm({ ...form, gestor_id: e.target.value || null })} className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
                    <option value="">— Nenhum —</option>
                    {funcionarios.filter((f) => f.id !== editando?.id).map((f) => (
                      <option key={f.id} value={f.id}>{f.nome} · {f.cargo}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value || null })} placeholder="nome@empresa.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Admissão</Label>
                  <Input type="date" value={form.data_admissao ?? ""} onChange={(e) => setForm({ ...form, data_admissao: e.target.value || null })} />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#E8D5A3]/30 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button onClick={salvar} disabled={salvando || !form.nome.trim() || !form.cargo.trim()}>
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
