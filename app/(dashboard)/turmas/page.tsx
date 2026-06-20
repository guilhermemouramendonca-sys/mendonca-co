"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, GraduationCap, Users, CalendarDays, MapPin, Video, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

type Turma = {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  modalidade: string;
  data_inicio?: string;
  data_fim?: string;
  vagas: number;
  preco?: number;
  status: string;
  local?: string;
  link_online?: string;
  criado_em: string;
  inscritos?: number;
};

const TIPO_LABELS: Record<string, string> = {
  workshop: "Workshop",
  mentoria_grupo: "Mentoria em Grupo",
  curso: "Curso",
  palestra: "Palestra",
  imersao: "Imersão",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "muted" | "danger" | "primary" }> = {
  rascunho:          { label: "Rascunho",           variant: "muted" },
  inscricoes_abertas: { label: "Inscrições Abertas", variant: "primary" },
  em_andamento:      { label: "Em Andamento",        variant: "success" },
  encerrada:         { label: "Encerrada",           variant: "muted" },
  cancelada:         { label: "Cancelada",           variant: "danger" },
};

const FORM_INICIAL = {
  nome: "",
  descricao: "",
  tipo: "workshop",
  modalidade: "presencial",
  data_inicio: "",
  data_fim: "",
  vagas: "20",
  preco: "",
  status: "rascunho",
  local: "",
  link_online: "",
};

export default function TurmasPage() {
  const supabase = createClient();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [filtro, setFiltro] = useState<string>("todas");

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data: turmasData } = await supabase
      .from("turmas")
      .select("*")
      .order("criado_em", { ascending: false });

    if (!turmasData) return;

    // Buscar contagem de inscritos por turma
    const ids = turmasData.map((t) => t.id);
    const { data: alunosData } = await supabase
      .from("turma_alunos")
      .select("turma_id, status")
      .in("turma_id", ids)
      .neq("status", "cancelado");

    const contagem: Record<string, number> = {};
    for (const a of alunosData ?? []) {
      contagem[a.turma_id] = (contagem[a.turma_id] ?? 0) + 1;
    }

    setTurmas(turmasData.map((t) => ({ ...t, inscritos: contagem[t.id] ?? 0 })));
  }

  function set(f: string, v: string) {
    setForm((p) => ({ ...p, [f]: v }));
  }

  async function salvar() {
    if (!form.nome) return;
    setSalvando(true);
    await supabase.from("turmas").insert({
      nome: form.nome,
      descricao: form.descricao || null,
      tipo: form.tipo,
      modalidade: form.modalidade,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
      vagas: parseInt(form.vagas) || 20,
      preco: form.preco ? parseFloat(form.preco) : null,
      status: form.status,
      local: form.local || null,
      link_online: form.link_online || null,
    });
    setSalvando(false);
    setModalAberto(false);
    setForm(FORM_INICIAL);
    carregar();
  }

  const filtradas = filtro === "todas"
    ? turmas
    : turmas.filter((t) => t.status === filtro);

  // KPIs
  const ativas = turmas.filter((t) => ["inscricoes_abertas", "em_andamento"].includes(t.status));
  const totalInscritos = turmas.reduce((s, t) => s + (t.inscritos ?? 0), 0);
  const receitaTotal = turmas
    .filter((t) => t.preco)
    .reduce((s, t) => s + (t.preco ?? 0) * (t.inscritos ?? 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">Turmas & Educação</h1>
          <p className="text-text-muted mt-1">{turmas.length} turma{turmas.length !== 1 ? "s" : ""} cadastrada{turmas.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setModalAberto(true)}>
          <Plus size={16} /> Nova Turma
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-primary/10 flex items-center justify-center">
              <GraduationCap size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-main">{ativas.length}</p>
              <p className="text-xs text-text-muted">Turmas ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-gold/10 flex items-center justify-center">
              <Users size={18} className="text-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-main">{totalInscritos}</p>
              <p className="text-xs text-text-muted">Total inscritos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-green-50 flex items-center justify-center">
              <CalendarDays size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-main">{turmas.filter((t) => t.status === "em_andamento").length}</p>
              <p className="text-xs text-text-muted">Em andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-green-50 flex items-center justify-center">
              <span className="text-green-600 text-xs font-bold">R$</span>
            </div>
            <div>
              <p className="text-xl font-bold text-text-main">
                {receitaTotal > 0 ? receitaTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
              </p>
              <p className="text-xs text-text-muted">Receita estimada</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex rounded-btn border border-[#E8D5A3]/50 overflow-hidden text-xs w-fit mb-6">
        {(["todas", "inscricoes_abertas", "em_andamento", "encerrada", "rascunho"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 transition-all ${filtro === f ? "bg-primary text-gold" : "bg-surface text-text-muted hover:text-text-main"}`}
          >
            {f === "todas" ? "Todas" : STATUS_CONFIG[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma turma encontrada.</p>
          <Button variant="secondary" className="mt-4" onClick={() => setModalAberto(true)}>
            Criar primeira turma
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtradas.map((t) => {
            const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.rascunho;
            const ocupacao = t.vagas > 0 ? Math.round(((t.inscritos ?? 0) / t.vagas) * 100) : 0;
            const lotada = ocupacao >= 100;
            return (
              <Link key={t.id} href={`/turmas/${t.id}`}>
                <Card className="hover:border-gold/50 hover:shadow-sm transition-all cursor-pointer h-full">
                  <CardContent className="flex flex-col gap-3 h-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-medium text-text-muted bg-bg px-2 py-0.5 rounded-full">
                            {TIPO_LABELS[t.tipo] ?? t.tipo}
                          </span>
                          {lotada && (
                            <span className="text-[10px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Lotada</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-text-main leading-tight">{t.nome}</h3>
                      </div>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>

                    {t.descricao && (
                      <p className="text-xs text-text-muted line-clamp-2">{t.descricao}</p>
                    )}

                    {/* Datas */}
                    {t.data_inicio && (
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <CalendarDays size={12} />
                        {formatDate(t.data_inicio)}
                        {t.data_fim && ` → ${formatDate(t.data_fim)}`}
                      </div>
                    )}

                    {/* Local / Online */}
                    {(t.local || t.modalidade === "online") && (
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        {t.modalidade === "online" ? <Video size={12} /> : <MapPin size={12} />}
                        {t.local ?? "Online"}
                      </div>
                    )}

                    {/* Ocupação */}
                    <div className="mt-auto">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-muted">{t.inscritos ?? 0}/{t.vagas} inscritos</span>
                        <span className={`font-semibold ${lotada ? "text-red-500" : ocupacao > 75 ? "text-yellow-600" : "text-green-600"}`}>
                          {ocupacao}%
                        </span>
                      </div>
                      <div className="w-full bg-[#E8D5A3]/30 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${Math.min(ocupacao, 100)}%`,
                            backgroundColor: lotada ? "#DC2626" : ocupacao > 75 ? "#D97706" : "#16A34A",
                          }}
                        />
                      </div>
                    </div>

                    {t.preco && (
                      <div className="flex items-center justify-between pt-1 border-t border-[#E8D5A3]/30">
                        <span className="text-xs text-text-muted">Investimento</span>
                        <span className="font-mono-data text-sm font-semibold text-text-main">
                          {t.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-end text-gold text-xs font-medium">
                      Ver turma <ChevronRight size={14} className="ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal nova turma */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-card w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-[#E8D5A3]/50">
              <h2 className="font-display text-2xl font-semibold text-text-main">Nova Turma</h2>
              <button onClick={() => setModalAberto(false)} className="text-text-muted hover:text-text-main">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Nome da turma *</Label>
                <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Workshop Liderança Estratégica — Turma 1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <select value={form.tipo} onChange={(e) => set("tipo", e.target.value)} className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold">
                    {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Modalidade</Label>
                  <select value={form.modalidade} onChange={(e) => set("modalidade", e.target.value)} className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold">
                    <option value="presencial">Presencial</option>
                    <option value="online">Online</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <textarea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} rows={2} placeholder="Público-alvo, objetivos, diferenciais..." className="flex w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Data início</Label>
                  <Input type="date" value={form.data_inicio} onChange={(e) => set("data_inicio", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Data fim</Label>
                  <Input type="date" value={form.data_fim} onChange={(e) => set("data_fim", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Vagas</Label>
                  <Input type="number" value={form.vagas} onChange={(e) => set("vagas", e.target.value)} placeholder="20" />
                </div>
                <div className="space-y-1.5">
                  <Label>Preço por aluno (R$)</Label>
                  <Input type="number" value={form.preco} onChange={(e) => set("preco", e.target.value)} placeholder="0,00" />
                </div>
              </div>

              {form.modalidade !== "online" && (
                <div className="space-y-1.5">
                  <Label>Local</Label>
                  <Input value={form.local} onChange={(e) => set("local", e.target.value)} placeholder="Endereço ou nome do espaço" />
                </div>
              )}

              {form.modalidade !== "presencial" && (
                <div className="space-y-1.5">
                  <Label>Link online</Label>
                  <Input value={form.link_online} onChange={(e) => set("link_online", e.target.value)} placeholder="https://meet.google.com/..." />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold">
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E8D5A3]/50">
              <Button variant="secondary" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button onClick={salvar} disabled={salvando || !form.nome}>
                {salvando ? "Salvando..." : "Criar Turma"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
