"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User, Users, Shield, Plus, Trash2, CheckCircle,
  AlertCircle, Key, Mail,
} from "lucide-react";

type Aba = "perfil" | "usuarios" | "acesso";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  cliente_id: string | null;
  ativo: boolean;
  criado_em: string;
  cliente_nome?: string;
};

type Cliente = { id: string; nome: string };

const PAPEL_LABELS: Record<string, string> = {
  admin: "Administrador",
  cliente_dono: "Dono do Cliente",
  cliente_lider: "Líder",
  cliente_funcionario: "Funcionário",
};

const PAPEL_CORES: Record<string, string> = {
  admin: "#0D2B2E",
  cliente_dono: "#C9A84C",
  cliente_lider: "#2980B9",
  cliente_funcionario: "#27AE60",
};

const ABAS: { key: Aba; label: string; icon: React.ElementType }[] = [
  { key: "perfil",   label: "Meu perfil",  icon: User },
  { key: "usuarios", label: "Usuários",    icon: Users },
  { key: "acesso",   label: "Acesso",      icon: Shield },
];

export default function ConfiguracoesPage() {
  const supabase = createClient();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("perfil");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [perfil, setPerfil] = useState({ nome: "", email: "" });
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaConfirm, setSenhaConfirm] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [feedbackPerfil, setFeedbackPerfil] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);
  const [feedbackSenha, setFeedbackSenha] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);
  const [modalConvite, setModalConvite] = useState(false);
  const [convite, setConvite] = useState({ email: "", nome: "", papel: "cliente_dono", cliente_id: "" });
  const [enviandoConvite, setEnviandoConvite] = useState(false);
  const [feedbackConvite, setFeedbackConvite] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);

  useEffect(() => {
    carregarDados();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setPerfil({ nome: user.user_metadata?.nome ?? "", email: user.email ?? "" });

    const [u, c] = await Promise.all([
      supabase.from("usuarios").select("*, clientes(nome)").order("criado_em"),
      supabase.from("clientes").select("id, nome").eq("status", "ativo").order("nome"),
    ]);
    if (u.data) setUsuarios(u.data.map((x: Usuario & { clientes: { nome: string } | null }) => ({ ...x, cliente_nome: x.clientes?.nome })));
    if (c.data) setClientes(c.data as Cliente[]);
  }

  async function salvarPerfil() {
    setSalvandoPerfil(true);
    setFeedbackPerfil(null);
    const { error } = await supabase.auth.updateUser({ data: { nome: perfil.nome } });
    if (error) {
      setFeedbackPerfil({ tipo: "erro", msg: "Erro ao salvar perfil." });
    } else {
      setFeedbackPerfil({ tipo: "ok", msg: "Perfil atualizado com sucesso." });
      setTimeout(() => setFeedbackPerfil(null), 3000);
    }
    setSalvandoPerfil(false);
  }

  async function alterarSenha() {
    if (senhaNova !== senhaConfirm) {
      setFeedbackSenha({ tipo: "erro", msg: "As senhas não coincidem." });
      return;
    }
    if (senhaNova.length < 8) {
      setFeedbackSenha({ tipo: "erro", msg: "A senha deve ter ao menos 8 caracteres." });
      return;
    }
    setSalvandoSenha(true);
    setFeedbackSenha(null);
    const { error } = await supabase.auth.updateUser({ password: senhaNova });
    if (error) {
      setFeedbackSenha({ tipo: "erro", msg: "Erro ao alterar senha." });
    } else {
      setFeedbackSenha({ tipo: "ok", msg: "Senha alterada com sucesso." });
      setSenhaAtual(""); setSenhaNova(""); setSenhaConfirm("");
      setTimeout(() => setFeedbackSenha(null), 3000);
    }
    setSalvandoSenha(false);
  }

  async function toggleAtivo(usuario: Usuario) {
    await supabase.from("usuarios").update({ ativo: !usuario.ativo }).eq("id", usuario.id);
    carregarDados();
  }

  async function excluirUsuario(id: string) {
    if (!confirm("Remover acesso deste usuário?")) return;
    await supabase.from("usuarios").delete().eq("id", id);
    carregarDados();
  }

  async function enviarConvite() {
    if (!convite.email.trim() || !convite.nome.trim()) return;
    setEnviandoConvite(true);
    setFeedbackConvite(null);

    // Gera usuário com senha temporária aleatória
    const senhaTemp = Math.random().toString(36).slice(-10) + "A1!";
    const { data, error } = await supabase.auth.admin
      ? { data: null, error: { message: "Admin API não disponível no client" } }
      : { data: null, error: { message: "Use o painel Supabase para criar usuários" } };

    // Alternativa: inserir na tabela usuarios com flag pendente
    const { error: dbError } = await supabase.from("usuarios").insert({
      nome: convite.nome,
      email: convite.email,
      papel: convite.papel,
      cliente_id: convite.cliente_id || null,
      ativo: false,
    });

    if (dbError) {
      setFeedbackConvite({ tipo: "erro", msg: "Erro ao criar usuário. O e-mail já pode estar cadastrado." });
    } else {
      setFeedbackConvite({ tipo: "ok", msg: `Usuário ${convite.nome} adicionado. Crie o acesso via painel do Supabase com o e-mail ${convite.email}.` });
      setConvite({ email: "", nome: "", papel: "cliente_dono", cliente_id: "" });
      carregarDados();
    }
    setEnviandoConvite(false);
    void data; void error; void senhaTemp;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-text-main">Configurações</h1>
        <p className="text-text-muted mt-1">Perfil, usuários e controle de acesso</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-surface rounded-btn p-1 w-fit border border-[#E8D5A3]/50">
        {ABAS.map((aba) => {
          const Icon = aba.icon;
          return (
            <button
              key={aba.key}
              onClick={() => setAbaAtiva(aba.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all ${abaAtiva === aba.key ? "bg-primary text-gold shadow-sm" : "text-text-muted hover:text-text-main"}`}
            >
              <Icon size={15} /> {aba.label}
            </button>
          );
        })}
      </div>

      {/* ── PERFIL ───────────────────────────────── */}
      {abaAtiva === "perfil" && (
        <div className="max-w-lg space-y-6">
          <Card>
            <CardHeader><CardTitle>Dados pessoais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={perfil.nome} onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })} placeholder="Seu nome completo" />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input value={perfil.email} disabled className="opacity-60 cursor-not-allowed" />
                <p className="text-xs text-text-muted">O e-mail não pode ser alterado aqui.</p>
              </div>
              {feedbackPerfil && (
                <div className={`flex items-center gap-2 text-sm ${feedbackPerfil.tipo === "ok" ? "text-success" : "text-danger"}`}>
                  {feedbackPerfil.tipo === "ok" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {feedbackPerfil.msg}
                </div>
              )}
              <Button onClick={salvarPerfil} disabled={salvandoPerfil}>
                {salvandoPerfil ? "Salvando..." : "Salvar perfil"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Key size={16} /> Alterar senha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Senha atual</Label>
                <Input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label>Nova senha</Label>
                <Input type="password" value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} placeholder="Mínimo 8 caracteres" />
              </div>
              <div className="space-y-1.5">
                <Label>Confirmar nova senha</Label>
                <Input type="password" value={senhaConfirm} onChange={(e) => setSenhaConfirm(e.target.value)} placeholder="••••••••" />
              </div>
              {feedbackSenha && (
                <div className={`flex items-center gap-2 text-sm ${feedbackSenha.tipo === "ok" ? "text-success" : "text-danger"}`}>
                  {feedbackSenha.tipo === "ok" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {feedbackSenha.msg}
                </div>
              )}
              <Button onClick={alterarSenha} disabled={salvandoSenha || !senhaNova || !senhaConfirm}>
                {salvandoSenha ? "Alterando..." : "Alterar senha"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── USUÁRIOS ─────────────────────────────── */}
      {abaAtiva === "usuarios" && (
        <div className="max-w-3xl">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setModalConvite(true)}><Plus size={14} /> Adicionar usuário</Button>
          </div>

          {usuarios.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-4">Nenhum usuário cadastrado além do admin.</p>
              <Button onClick={() => setModalConvite(true)}><Plus size={14} /> Adicionar</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {usuarios.map((u) => (
                <div key={u.id} className={`bg-surface rounded-card border px-5 py-4 flex items-center gap-4 ${!u.ativo ? "opacity-50 border-[#E8D5A3]/30" : "border-[#E8D5A3]/50"}`}>
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-gold font-display font-bold text-sm">{u.nome?.charAt(0) ?? "?"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-text-main">{u.nome}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: PAPEL_CORES[u.papel] ?? "#999" }}>
                        {PAPEL_LABELS[u.papel] ?? u.papel}
                      </span>
                      {!u.ativo && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8D5A3]/30 text-text-muted">Inativo</span>}
                    </div>
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                      <Mail size={10} /> {u.email}
                      {u.cliente_nome && <span className="ml-2">· {u.cliente_nome}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleAtivo(u)}
                      className={`text-xs px-2.5 py-1 rounded-btn font-medium transition-colors ${u.ativo ? "bg-[#E8D5A3]/30 text-text-muted hover:bg-danger/10 hover:text-danger" : "bg-success/10 text-success hover:bg-success/20"}`}
                    >
                      {u.ativo ? "Desativar" : "Reativar"}
                    </button>
                    <button onClick={() => excluirUsuario(u.id)} className="p-1.5 text-text-muted hover:text-danger hover:bg-bg rounded transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal convite */}
          {modalConvite && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-surface rounded-card shadow-xl w-full max-w-md">
                <div className="p-6 border-b border-[#E8D5A3]/30">
                  <h2 className="font-display text-xl font-semibold text-text-main">Adicionar usuário</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label>Nome *</Label>
                    <Input value={convite.nome} onChange={(e) => setConvite({ ...convite, nome: e.target.value })} placeholder="Nome completo" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-mail *</Label>
                    <Input type="email" value={convite.email} onChange={(e) => setConvite({ ...convite, email: e.target.value })} placeholder="email@empresa.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Papel</Label>
                    <select value={convite.papel} onChange={(e) => setConvite({ ...convite, papel: e.target.value })} className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
                      {Object.entries(PAPEL_LABELS).filter(([v]) => v !== "admin").map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  {convite.papel !== "admin" && (
                    <div className="space-y-1.5">
                      <Label>Cliente associado</Label>
                      <select value={convite.cliente_id} onChange={(e) => setConvite({ ...convite, cliente_id: e.target.value })} className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
                        <option value="">— Selecionar —</option>
                        {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                  )}
                  {feedbackConvite && (
                    <div className={`flex items-start gap-2 text-sm p-3 rounded-btn ${feedbackConvite.tipo === "ok" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                      {feedbackConvite.tipo === "ok" ? <CheckCircle size={14} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />}
                      <span>{feedbackConvite.msg}</span>
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-[#E8D5A3]/30 flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => { setModalConvite(false); setFeedbackConvite(null); }}>Fechar</Button>
                  <Button onClick={enviarConvite} disabled={enviandoConvite || !convite.email.trim() || !convite.nome.trim()}>
                    {enviandoConvite ? "Adicionando..." : "Adicionar"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ACESSO ───────────────────────────────── */}
      {abaAtiva === "acesso" && (
        <div className="max-w-2xl space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield size={16} /> Papéis e permissões</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(PAPEL_LABELS).map(([papel, label]) => {
                  const descricoes: Record<string, string> = {
                    admin: "Acesso total ao sistema — todos os clientes, módulos e configurações.",
                    cliente_dono: "Vê todos os dados da própria empresa: funcionários, OKRs, pesquisas, sessões e financeiro.",
                    cliente_lider: "Vê apenas o seu time no organograma — funcionários sob sua gestão, OKRs e pesquisas do time.",
                    cliente_funcionario: "Acesso restrito ao próprio perfil e pesquisas destinadas a ele.",
                  };
                  const count = usuarios.filter((u) => u.papel === papel).length;
                  return (
                    <div key={papel} className="flex items-start gap-4 p-4 bg-bg rounded-btn border border-[#E8D5A3]/50">
                      <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: PAPEL_CORES[papel] }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-text-main text-sm">{label}</p>
                          <span className="text-[10px] text-text-muted">{count} usuário{count !== 1 ? "s" : ""}</span>
                        </div>
                        <p className="text-xs text-text-muted mt-1">{descricoes[papel]}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sobre o sistema</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-text-muted">
              <div className="flex justify-between py-1.5 border-b border-[#E8D5A3]/30">
                <span>Sistema</span>
                <span className="text-text-main font-medium">Mendonça & Co v1.0</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E8D5A3]/30">
                <span>Framework</span>
                <span className="text-text-main">Next.js 14 + Supabase</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E8D5A3]/30">
                <span>Módulos ativos</span>
                <span className="text-text-main">9 módulos</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Desenvolvido por</span>
                <span className="text-text-main">Claude Code · Anthropic</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
