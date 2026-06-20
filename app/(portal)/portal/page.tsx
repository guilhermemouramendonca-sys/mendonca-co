"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FileText, ListChecks, CalendarDays, LogOut, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Cliente = { id: string; nome: string; setor?: string };
type Sessao = { id: string; tipo: string; data: string; duracao_minutos?: number };
type ItemPlano = { id: string; descricao: string; status: string; prazo?: string };
type Compartilhamento = { id: string; titulo: string; tipo: string; criado_em: string };

const TIPO_SESSAO: Record<string, string> = {
  mentoria: "Mentoria", board: "Board", diagnostico: "Diagnóstico", workshop: "Workshop",
};

export default function PortalDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [proximasSessoes, setProximasSessoes] = useState<Sessao[]>([]);
  const [itensPendentes, setItensPendentes] = useState<ItemPlano[]>([]);
  const [documentos, setDocumentos] = useState<Compartilhamento[]>([]);
  const [totalItens, setTotalItens] = useState(0);
  const [itensConcluidos, setItensConcluidos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Buscar dados do usuário
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("nome, papel")
      .eq("id", user.id)
      .single();

    if (!usuario || !["cliente_dono", "cliente_lider", "cliente_funcionario"].includes(usuario.papel)) {
      // Redirecionar membros internos para o dashboard
      router.push("/dashboard");
      return;
    }

    setNomeUsuario(usuario.nome ?? "");

    // Buscar cliente vinculado
    const { data: vinculo } = await supabase
      .from("usuarios_clientes")
      .select("cliente_id, clientes(id, nome, setor)")
      .eq("usuario_id", user.id)
      .single();

    if (!vinculo) { setLoading(false); return; }

    const clienteData = (vinculo as unknown as { clientes: Cliente }).clientes;
    setCliente(clienteData);

    const clienteId = clienteData.id;
    const hoje = new Date().toISOString();

    // Buscar próximas sessões
    const { data: sessoesData } = await supabase
      .from("sessoes")
      .select("id, tipo, data, duracao_minutos")
      .eq("cliente_id", clienteId)
      .gte("data", hoje)
      .order("data")
      .limit(3);

    if (sessoesData) setProximasSessoes(sessoesData as Sessao[]);

    // Buscar plano de ação
    const { data: planosData } = await supabase
      .from("planos_acao")
      .select("id")
      .eq("cliente_id", clienteId)
      .limit(1);

    if (planosData && planosData.length > 0) {
      const planoId = planosData[0].id;
      const { data: itensData } = await supabase
        .from("itens_plano_acao")
        .select("id, descricao, status, prazo")
        .eq("plano_id", planoId)
        .order("prazo", { ascending: true });

      if (itensData) {
        setTotalItens(itensData.length);
        setItensConcluidos(itensData.filter((i) => i.status === "concluido").length);
        setItensPendentes(
          (itensData as ItemPlano[]).filter((i) => i.status !== "concluido").slice(0, 4)
        );
      }
    }

    // Buscar documentos compartilhados
    const { data: docsData } = await supabase
      .from("compartilhamentos")
      .select("id, titulo, tipo, criado_em")
      .eq("cliente_id", clienteId)
      .order("criado_em", { ascending: false })
      .limit(4);

    if (docsData) setDocumentos(docsData as Compartilhamento[]);

    setLoading(false);
  }

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#0D2B2E] text-sm opacity-60">Carregando seu portal...</div>
      </div>
    );
  }

  const progresso = totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Header */}
      <header className="bg-[#0D2B2E] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[#C9A84C] font-display text-lg font-bold">Mendonça & Co</h1>
          <p className="text-white/50 text-xs">Portal do Cliente</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-medium">{nomeUsuario}</p>
            {cliente && <p className="text-white/50 text-xs">{cliente.nome}</p>}
          </div>
          <button onClick={sair} className="text-white/60 hover:text-white transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Boas-vindas */}
        <div>
          <h2 className="font-display text-3xl font-bold text-[#0D2B2E]">
            Olá, {nomeUsuario.split(" ")[0]} 👋
          </h2>
          {cliente && (
            <p className="text-[#6B7280] mt-1">{cliente.nome}{cliente.setor ? ` · ${cliente.setor}` : ""}</p>
          )}
        </div>

        {/* Cards de navegação */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/portal/plano">
            <div className="bg-white rounded-2xl p-5 border border-[#E8D5A3]/50 hover:border-[#C9A84C]/50 hover:shadow-sm transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-[#0D2B2E]/10 flex items-center justify-center mb-3">
                <ListChecks size={20} className="text-[#0D2B2E]" />
              </div>
              <p className="font-semibold text-[#0D2B2E]">Plano de Ação</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{itensPendentes.length} item{itensPendentes.length !== 1 ? "s" : ""} pendente{itensPendentes.length !== 1 ? "s" : ""}</p>
              {totalItens > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-[#6B7280] mb-1">
                    <span>{progresso}% concluído</span>
                    <span>{itensConcluidos}/{totalItens}</span>
                  </div>
                  <div className="w-full bg-[#E8D5A3]/40 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-[#C9A84C]" style={{ width: `${progresso}%` }} />
                  </div>
                </div>
              )}
            </div>
          </Link>

          <Link href="/portal/documentos">
            <div className="bg-white rounded-2xl p-5 border border-[#E8D5A3]/50 hover:border-[#C9A84C]/50 hover:shadow-sm transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center mb-3">
                <FileText size={20} className="text-[#C9A84C]" />
              </div>
              <p className="font-semibold text-[#0D2B2E]">Documentos</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{documentos.length} arquivo{documentos.length !== 1 ? "s" : ""} disponíve{documentos.length !== 1 ? "is" : "l"}</p>
            </div>
          </Link>

          <div className="bg-white rounded-2xl p-5 border border-[#E8D5A3]/50">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
              <CalendarDays size={20} className="text-green-600" />
            </div>
            <p className="font-semibold text-[#0D2B2E]">Próximas sessões</p>
            <p className="text-xs text-[#6B7280] mt-0.5">{proximasSessoes.length} agendada{proximasSessoes.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Próximas sessões */}
          <div className="bg-white rounded-2xl border border-[#E8D5A3]/50 p-5">
            <h3 className="font-semibold text-[#0D2B2E] mb-4 flex items-center gap-2">
              <CalendarDays size={16} className="text-[#C9A84C]" /> Próximas sessões
            </h3>
            {proximasSessoes.length === 0 ? (
              <p className="text-sm text-[#6B7280] py-4 text-center">Nenhuma sessão agendada.</p>
            ) : (
              <div className="space-y-3">
                {proximasSessoes.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0D2B2E] flex flex-col items-center justify-center flex-shrink-0">
                      <p className="text-[#C9A84C] text-[10px] font-bold leading-none">
                        {new Date(s.data).toLocaleDateString("pt-BR", { day: "2-digit" })}
                      </p>
                      <p className="text-white/60 text-[8px] uppercase">
                        {new Date(s.data).toLocaleDateString("pt-BR", { month: "short" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0D2B2E]">{TIPO_SESSAO[s.tipo] ?? s.tipo}</p>
                      <p className="text-xs text-[#6B7280]">
                        {new Date(s.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        {s.duracao_minutos ? ` · ${s.duracao_minutos} min` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Itens pendentes do plano */}
          <div className="bg-white rounded-2xl border border-[#E8D5A3]/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#0D2B2E] flex items-center gap-2">
                <ListChecks size={16} className="text-[#C9A84C]" /> Plano de ação
              </h3>
              <Link href="/portal/plano" className="text-xs text-[#C9A84C] hover:underline flex items-center gap-0.5">
                Ver tudo <ChevronRight size={12} />
              </Link>
            </div>
            {itensPendentes.length === 0 && totalItens === 0 ? (
              <p className="text-sm text-[#6B7280] py-4 text-center">Nenhum item no plano ainda.</p>
            ) : itensPendentes.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-green-600 font-semibold text-sm">🎉 Todos os itens concluídos!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {itensPendentes.map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded border-2 border-[#E8D5A3] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#374151] leading-snug">{item.descricao}</p>
                      {item.prazo && (
                        <p className="text-xs text-[#9CA3AF] mt-0.5">Prazo: {formatDate(item.prazo)}</p>
                      )}
                    </div>
                  </div>
                ))}
                {totalItens - itensConcluidos > 4 && (
                  <p className="text-xs text-[#6B7280]">+{totalItens - itensConcluidos - 4} mais...</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Últimos documentos */}
        {documentos.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E8D5A3]/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#0D2B2E] flex items-center gap-2">
                <FileText size={16} className="text-[#C9A84C]" /> Documentos recentes
              </h3>
              <Link href="/portal/documentos" className="text-xs text-[#C9A84C] hover:underline flex items-center gap-0.5">
                Ver todos <ChevronRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {documentos.map((d) => (
                <div key={d.id} className="flex items-center gap-3 py-1">
                  <FileText size={15} className="text-[#C9A84C] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0D2B2E] font-medium truncate">{d.titulo}</p>
                    <p className="text-xs text-[#6B7280]">{formatDate(d.criado_em)}</p>
                  </div>
                  <ChevronRight size={14} className="text-[#9CA3AF]" />
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-[#9CA3AF] pb-4">
          Mendonça & Co · Consultoria, Conselho & Educação
        </p>
      </main>
    </div>
  );
}
