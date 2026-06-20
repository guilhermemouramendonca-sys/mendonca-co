"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Shield, User, X, Check } from "lucide-react";

type Papel = "admin" | "consultor" | "cs" | "sdr" | "closer";

type Membro = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  cargo?: string;
  whatsapp?: string;
  ativo: boolean;
  criado_em: string;
  pendente?: boolean; // pré-cadastro sem convite
  convite_enviado?: boolean;
  totalClientes?: number;
  totalLeads?: number;
};

const PAPEL_CONFIG: Record<Papel, { label: string; descricao: string; cor: string }> = {
  admin:    { label: "Admin",     descricao: "Acesso total ao sistema",                        cor: "#0D2B2E" },
  consultor:{ label: "Consultor", descricao: "Vê sua carteira de clientes e diagnósticos",     cor: "#2980B9" },
  cs:       { label: "CS",        descricao: "Sucesso do cliente, financeiro e administrativo", cor: "#27AE60" },
  sdr:      { label: "SDR",       descricao: "Prospecção — cria e qualifica leads",             cor: "#8E44AD" },
  closer:   { label: "Closer",    descricao: "Fecha negócios — vê propostas e negociações",    cor: "#C9A84C" },
};

const EQUIPE_PRE_DEFINIDA = [
  { nome: "Guilherme Mendonça", cargo: "Diretor & Expert", papel: "admin" as Papel },
  { nome: "Oscar",              cargo: "Consultor & Gestor de Projetos", papel: "consultor" as Papel },
  { nome: "Natalia",            cargo: "CS & Administrativo",            papel: "cs" as Papel },
];

export default function EquipePage() {
  const supabase = createClient();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [criando, setCriando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: "", email: "", papel: "consultor" as Papel,
    cargo: "", whatsapp: "",
  });

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const [{ data: ativos }, { data: pendentes }, { data: clientes }, { data: leads }] = await Promise.all([
      supabase.from("usuarios").select("*").in("papel", ["admin", "consultor", "cs", "sdr", "closer"]).order("criado_em"),
      supabase.from("membros_equipe_pendentes").select("*").order("criado_em"),
      supabase.from("clientes").select("responsavel_id"),
      supabase.from("leads").select("responsavel_id").neq("etapa", "perdido"),
    ]);

    const membrosAtivos: Membro[] = (ativos ?? []).map((m) => ({
      ...m,
      pendente: false,
      totalClientes: (clientes ?? []).filter((c) => c.responsavel_id === m.id).length,
      totalLeads: (leads ?? []).filter((l) => l.responsavel_id === m.id).length,
    }));

    const emailsAtivos = new Set(membrosAtivos.map((m) => m.email));

    const membrosPendentes: Membro[] = (pendentes ?? [])
      .filter((p) => !emailsAtivos.has(p.email))
      .map((p) => ({
        id: p.id, nome: p.nome, email: p.email,
        papel: p.papel as Papel, cargo: p.cargo,
        whatsapp: p.whatsapp, ativo: true,
        criado_em: p.criado_em,
        pendente: true,
        convite_enviado: p.convite_enviado,
        totalClientes: 0, totalLeads: 0,
      }));

    setMembros([...membrosAtivos, ...membrosPendentes]);
  }

  async function salvar() {
    if (!form.nome.trim() || !form.email.trim()) return;
    setSalvando(true);

    if (editando) {
      await supabase.from("usuarios").update({
        nome: form.nome.trim(),
        papel: form.papel,
        cargo: form.cargo.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
      }).eq("id", editando);
    } else {
      // Cria registro sem auth — o convite é enviado depois
      // Primeiro verifica se já existe na auth.users pelo email
      // Como não podemos criar auth.users pelo client, criamos um placeholder
      // que será linkado quando o usuário aceitar o convite
      const { data: existente } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", form.email.trim())
        .maybeSingle();

      if (existente) {
        alert("Já existe um membro com este e-mail.");
        setSalvando(false);
        return;
      }

      // Inserir como pré-cadastro (sem auth.uid ainda — será vinculado no convite)
      await supabase.from("membros_equipe_pendentes").upsert({
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        papel: form.papel,
        cargo: form.cargo.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
      }, { onConflict: "email" });
    }

    await carregar();
    setCriando(false);
    setEditando(null);
    setForm({ nome: "", email: "", papel: "consultor", cargo: "", whatsapp: "" });
    setSalvando(false);
  }

  function iniciarEdicao(m: Membro) {
    setForm({ nome: m.nome, email: m.email, papel: m.papel, cargo: m.cargo ?? "", whatsapp: m.whatsapp ?? "" });
    setEditando(m.id);
    setCriando(true);
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from("usuarios").update({ ativo: !ativo }).eq("id", id);
    await carregar();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">Equipe</h1>
          <p className="text-text-muted mt-1">Gerencie os membros internos — convites serão enviados quando você estiver pronto</p>
        </div>
        <Button onClick={() => { setCriando(true); setEditando(null); setForm({ nome: "", email: "", papel: "consultor", cargo: "", whatsapp: "" }); }}>
          <UserPlus size={15} /> Adicionar membro
        </Button>
      </div>

      {/* Form */}
      {criando && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold text-text-main mb-5">
              {editando ? "Editar membro" : "Novo membro da equipe"}
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <Label>Nome completo *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do colaborador" />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@empresa.com" disabled={!!editando} />
              </div>
              <div className="space-y-1.5">
                <Label>Cargo</Label>
                <Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Consultor, SDR..." />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(11) 99999-0000" />
              </div>
            </div>

            {/* Papel */}
            <div className="mb-5">
              <Label className="block mb-2">Papel no sistema *</Label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.entries(PAPEL_CONFIG) as [Papel, typeof PAPEL_CONFIG[Papel]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setForm({ ...form, papel: key })}
                    className={`p-3 rounded-btn border-2 text-left transition-all ${
                      form.papel === key ? "border-gold bg-gold/5" : "border-[#E8D5A3]/40 hover:border-gold/40"
                    }`}
                  >
                    <span
                      className="text-xs font-bold block mb-1"
                      style={{ color: cfg.cor }}
                    >{cfg.label}</span>
                    <span className="text-[10px] text-text-muted leading-snug block">{cfg.descricao}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={salvar} disabled={salvando || !form.nome.trim() || !form.email.trim()}>
                <Check size={14} /> {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar (sem convite por ora)"}
              </Button>
              <Button variant="secondary" onClick={() => { setCriando(false); setEditando(null); }}>
                <X size={14} /> Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de membros ativos */}
      <div className="space-y-3">
        {membros.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <User size={36} className="mx-auto mb-3 text-text-muted opacity-30" />
              <p className="text-text-muted text-sm mb-1">Nenhum membro cadastrado ainda.</p>
              <p className="text-xs text-text-muted/60">
                Cadastre Oscar e Natalia abaixo — o convite de acesso será enviado quando você quiser.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-5">
                {EQUIPE_PRE_DEFINIDA.map((p) => (
                  <button
                    key={p.nome}
                    onClick={() => {
                      setForm({ nome: p.nome, email: "", papel: p.papel, cargo: p.cargo, whatsapp: "" });
                      setCriando(true);
                    }}
                    className="px-3 py-2 text-xs rounded-btn bg-surface border border-[#E8D5A3]/50 text-text-muted hover:text-text-main hover:border-gold/40 transition-all"
                  >
                    + {p.nome}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          membros.map((m) => {
            const cfg = PAPEL_CONFIG[m.papel] ?? PAPEL_CONFIG.consultor;
            return (
              <Card key={m.id} className={!m.ativo ? "opacity-50" : ""}>
                <CardContent className="p-5 flex items-center gap-5">
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                    style={{ backgroundColor: cfg.cor }}
                  >
                    {m.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-text-main text-sm">{m.nome}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: cfg.cor + "18", color: cfg.cor }}
                      >{cfg.label}</span>
                      {m.pendente && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8D5A3]/40 text-text-muted font-medium">
                          Aguardando convite
                        </span>
                      )}
                      {!m.ativo && <span className="text-[10px] text-text-muted/60">(inativo)</span>}
                    </div>
                    <p className="text-xs text-text-muted">{m.cargo ?? cfg.descricao}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <Mail size={9} /> {m.email}
                      </span>
                    </div>
                  </div>

                  {/* Métricas */}
                  {(m.papel === "consultor" || m.papel === "cs") && (
                    <div className="flex gap-4 text-center shrink-0">
                      <div>
                        <p className="font-mono-data text-lg font-bold text-text-main">{m.totalClientes}</p>
                        <p className="text-[10px] text-text-muted">clientes</p>
                      </div>
                      <div>
                        <p className="font-mono-data text-lg font-bold text-text-main">{m.totalLeads}</p>
                        <p className="text-[10px] text-text-muted">leads</p>
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => iniciarEdicao(m)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => toggleAtivo(m.id, m.ativo)}
                      className={m.ativo ? "text-danger border-danger/30 hover:bg-danger/5" : "text-success border-success/30"}
                    >
                      {m.ativo ? "Desativar" : "Reativar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Aviso de convite */}
      <div className="mt-8 p-4 rounded-btn border border-[#E8D5A3]/40 bg-gold/5">
        <p className="text-xs text-text-muted">
          <span className="font-semibold text-text-main">Convites não enviados ainda.</span>{" "}
          Quando estiver pronto para dar acesso à equipe, vá em Configurações → Enviar convites.
          Cada pessoa receberá um e-mail para criar a senha e entrar no sistema com as permissões do papel atribuído.
        </p>
      </div>
    </div>
  );
}
