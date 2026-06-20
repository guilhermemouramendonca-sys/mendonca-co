"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, FileText, Download, Search } from "lucide-react";

type Compartilhamento = {
  id: string;
  titulo: string;
  descricao?: string;
  arquivo_url: string;
  tipo: string;
  criado_em: string;
};

const TIPO_LABELS: Record<string, string> = {
  relatorio:    "Relatório",
  diagnostico:  "Diagnóstico",
  radar360:     "Radar 360",
  pesquisa:     "Pesquisa",
  canvas:       "Canvas",
  proposta:     "Proposta",
  plano_acao:   "Plano de Ação",
  documento:    "Documento",
  outro:        "Outro",
};

const TIPO_CORES: Record<string, string> = {
  relatorio:   "#0D2B2E",
  diagnostico: "#2D6A4F",
  radar360:    "#1D4ED8",
  pesquisa:    "#7C3AED",
  canvas:      "#C9A84C",
  proposta:    "#DC2626",
  plano_acao:  "#16A34A",
  documento:   "#6B7280",
  outro:       "#9CA3AF",
};

export default function PortalDocumentos() {
  const supabase = createClient();
  const [docs, setDocs] = useState<Compartilhamento[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: vinculo } = await supabase
      .from("usuarios_clientes")
      .select("cliente_id")
      .eq("usuario_id", user.id)
      .single();

    if (!vinculo) { setLoading(false); return; }

    const { data } = await supabase
      .from("compartilhamentos")
      .select("*")
      .eq("cliente_id", vinculo.cliente_id)
      .order("criado_em", { ascending: false });

    if (data) setDocs(data as Compartilhamento[]);
    setLoading(false);
  }

  const tiposDisponiveis = Array.from(new Set(docs.map((d) => d.tipo)));

  const filtrados = docs.filter((d) => {
    const buscaOk = d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      d.descricao?.toLowerCase().includes(busca.toLowerCase());
    const tipoOk = filtroTipo === "todos" || d.tipo === filtroTipo;
    return buscaOk && tipoOk;
  });

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <header className="bg-[#0D2B2E] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/portal" className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-[#C9A84C] font-display text-lg font-bold">Mendonça & Co</h1>
            <p className="text-white/50 text-xs">Documentos</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-[#0D2B2E]">Seus documentos</h2>
          <p className="text-[#6B7280] text-sm mt-1">{docs.length} arquivo{docs.length !== 1 ? "s" : ""} compartilhado{docs.length !== 1 ? "s" : ""} com você</p>
        </div>

        {/* Busca + filtro */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar documento..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8D5A3] bg-white text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30"
            />
          </div>
          {tiposDisponiveis.length > 1 && (
            <div className="flex rounded-xl border border-[#E8D5A3] overflow-hidden text-xs">
              <button
                onClick={() => setFiltroTipo("todos")}
                className={`px-3 py-2 transition-all ${filtroTipo === "todos" ? "bg-[#0D2B2E] text-[#C9A84C]" : "bg-white text-[#6B7280]"}`}
              >
                Todos
              </button>
              {tiposDisponiveis.map((t) => (
                <button
                  key={t}
                  onClick={() => setFiltroTipo(t)}
                  className={`px-3 py-2 transition-all ${filtroTipo === t ? "bg-[#0D2B2E] text-[#C9A84C]" : "bg-white text-[#6B7280]"}`}
                >
                  {TIPO_LABELS[t] ?? t}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-center text-[#6B7280] text-sm py-12">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={40} className="mx-auto mb-3 text-[#9CA3AF]" />
            <p className="text-[#6B7280] text-sm">
              {busca || filtroTipo !== "todos" ? "Nenhum documento encontrado." : "Nenhum documento disponível ainda."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map((d) => {
              const cor = TIPO_CORES[d.tipo] ?? "#6B7280";
              return (
                <div key={d.id} className="bg-white rounded-2xl border border-[#E8D5A3]/50 p-4 flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: cor + "15" }}
                  >
                    <FileText size={20} style={{ color: cor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: cor + "15", color: cor }}
                      >
                        {TIPO_LABELS[d.tipo] ?? d.tipo}
                      </span>
                    </div>
                    <p className="font-semibold text-[#0D2B2E] truncate">{d.titulo}</p>
                    {d.descricao && <p className="text-xs text-[#6B7280] mt-0.5 truncate">{d.descricao}</p>}
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      {new Date(d.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <a
                    href={d.arquivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#0D2B2E] text-[#C9A84C] hover:bg-[#0D2B2E]/90 transition-colors flex-shrink-0"
                  >
                    <Download size={14} /> Abrir
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
