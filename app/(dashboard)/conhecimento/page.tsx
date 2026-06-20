"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";
import {
  Plus, Search, FileText, Video, Paperclip,
  Pencil, Trash2, X, Eye, Code2, ExternalLink, Tag, ChevronRight,
} from "lucide-react";

type Categoria = "ferramenta" | "metodologia" | "template" | "roteiro" | "referencia";
type TipoDoc = "texto" | "video" | "arquivo";

type Documento = {
  id: string;
  titulo: string;
  categoria: Categoria;
  tipo: TipoDoc;
  conteudo: string | null;
  video_url: string | null;
  arquivo_url: string | null;
  publico: boolean;
  tags: string[] | null;
  criado_em: string;
  atualizado_em: string;
};

const CATEGORIAS: { key: Categoria; label: string; emoji: string; descricao: string }[] = [
  { key: "metodologia", label: "Metodologia",  emoji: "📚", descricao: "Os 12 passos e os 4 blocos" },
  { key: "ferramenta",  label: "Ferramentas",  emoji: "🧰", descricao: "8 ferramentas proprietárias" },
  { key: "template",    label: "Templates",    emoji: "📋", descricao: "Modelos e frameworks" },
  { key: "roteiro",     label: "Roteiros",     emoji: "🗺️",  descricao: "Passo a passo de sessões" },
  { key: "referencia",  label: "Referências",  emoji: "📖", descricao: "Artigos e leituras" },
];

const TIPO_ICONS = { texto: FileText, video: Video, arquivo: Paperclip };
const TIPO_LABELS: Record<TipoDoc, string> = { texto: "Texto", video: "Vídeo", arquivo: "Arquivo" };
const CAT_CORES: Record<Categoria, string> = {
  metodologia: "#0D2B2E", ferramenta: "#C9A84C", template: "#2980B9",
  roteiro: "#27AE60", referencia: "#8E44AD",
};

const EMPTY: Omit<Documento, "id" | "criado_em" | "atualizado_em"> = {
  titulo: "", categoria: "metodologia", tipo: "texto",
  conteudo: "", video_url: null, arquivo_url: null, publico: false, tags: [],
};

function extrairYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

export default function ConhecimentoPage() {
  const supabase = createClient();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<Categoria | "todos">("todos");
  const [docAberto, setDocAberto] = useState<Documento | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [abaEditor, setAbaEditor] = useState<"editar" | "preview">("editar");
  const [form, setForm] = useState(EMPTY);
  const [tagsInput, setTagsInput] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [novoDoc, setNovoDoc] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data } = await supabase
      .from("documentos")
      .select("*")
      .order("atualizado_em", { ascending: false });
    if (data) setDocumentos(data as Documento[]);
  }

  const filtrados = useMemo(() => {
    return documentos.filter((d) => {
      const matchCat = categoriaAtiva === "todos" || d.categoria === categoriaAtiva;
      const matchBusca = !busca.trim() ||
        d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        (d.conteudo ?? "").toLowerCase().includes(busca.toLowerCase()) ||
        (d.tags ?? []).some((t) => t.toLowerCase().includes(busca.toLowerCase()));
      return matchCat && matchBusca;
    });
  }, [documentos, categoriaAtiva, busca]);

  function abrirNovo() {
    setForm({ ...EMPTY });
    setTagsInput("");
    setAbaEditor("editar");
    setModoEdicao(true);
    setDocAberto(null);
    setNovoDoc(true);
  }

  function abrirEditar(doc: Documento) {
    setForm({
      titulo: doc.titulo, categoria: doc.categoria, tipo: doc.tipo,
      conteudo: doc.conteudo, video_url: doc.video_url, arquivo_url: doc.arquivo_url,
      publico: doc.publico, tags: doc.tags,
    });
    setTagsInput((doc.tags ?? []).join(", "));
    setAbaEditor("editar");
    setModoEdicao(true);
    setDocAberto(doc);
    setNovoDoc(false);
  }

  function fechar() {
    setModoEdicao(false);
    setDocAberto(null);
    setNovoDoc(false);
  }

  async function salvar() {
    if (!form.titulo.trim()) return;
    setSalvando(true);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = { ...form, tags, atualizado_em: new Date().toISOString() };
    if (novoDoc) {
      await supabase.from("documentos").insert(payload);
    } else if (docAberto) {
      await supabase.from("documentos").update(payload).eq("id", docAberto.id);
    }
    await carregar();
    setSalvando(false);
    fechar();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir documento?")) return;
    await supabase.from("documentos").delete().eq("id", id);
    fechar();
    carregar();
  }

  const contsPorCategoria = useMemo(() => {
    const c: Record<string, number> = { todos: documentos.length };
    for (const cat of CATEGORIAS) c[cat.key] = documentos.filter((d) => d.categoria === cat.key).length;
    return c;
  }, [documentos]);

  return (
    <div className="flex gap-6 min-h-0">
      {/* Sidebar de categorias */}
      <aside className="w-56 flex-shrink-0">
        <div className="sticky top-0 space-y-1">
          <button
            onClick={() => setCategoriaAtiva("todos")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-btn text-sm font-medium transition-colors ${categoriaAtiva === "todos" ? "bg-primary text-gold" : "text-text-muted hover:text-text-main hover:bg-surface"}`}
          >
            <span>Todos</span>
            <span className="text-xs opacity-60">{contsPorCategoria.todos}</span>
          </button>
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoriaAtiva(cat.key)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors ${categoriaAtiva === cat.key ? "bg-primary text-gold" : "text-text-muted hover:text-text-main hover:bg-surface"}`}
            >
              <span>{cat.emoji}</span>
              <span className="flex-1 text-left">{cat.label}</span>
              <span className="text-xs opacity-60">{contsPorCategoria[cat.key] ?? 0}</span>
            </button>
          ))}

          <div className="pt-4">
            <Button className="w-full" onClick={abrirNovo}>
              <Plus size={14} /> Novo documento
            </Button>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Buscar por título, conteúdo ou tag..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          {busca && (
            <button onClick={() => setBusca("")} className="text-text-muted hover:text-text-main">
              <X size={15} />
            </button>
          )}
          {busca && (
            <span className="text-sm text-text-muted">{filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {filtrados.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-4">{busca ? "Nenhum resultado para esta busca." : "Nenhum documento nesta categoria."}</p>
            <Button onClick={abrirNovo}><Plus size={14} /> Criar primeiro documento</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map((doc) => {
              const Icon = TIPO_ICONS[doc.tipo];
              const cat = CATEGORIAS.find((c) => c.key === doc.categoria);
              return (
                <button
                  key={doc.id}
                  onClick={() => { setDocAberto(doc); setModoEdicao(false); }}
                  className="w-full text-left bg-surface rounded-card border border-[#E8D5A3]/50 px-5 py-4 hover:border-gold/40 hover:shadow-sm transition-all flex items-start gap-4"
                >
                  <div className="w-8 h-8 rounded-btn flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: CAT_CORES[doc.categoria] + "20" }}>
                    <Icon size={16} style={{ color: CAT_CORES[doc.categoria] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-text-main">{doc.titulo}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ color: CAT_CORES[doc.categoria], backgroundColor: CAT_CORES[doc.categoria] + "15" }}>
                        {cat?.emoji} {cat?.label}
                      </span>
                    </div>
                    {doc.conteudo && (
                      <p className="text-sm text-text-muted mt-0.5 line-clamp-1">
                        {doc.conteudo.replace(/[#*`_\[\]]/g, "").slice(0, 120)}
                      </p>
                    )}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {doc.tags.map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[#E8D5A3]/30 text-text-muted flex items-center gap-1">
                            <Tag size={9} /> {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-text-muted mt-1 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Painel de visualização / edição */}
      {(docAberto || novoDoc) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-stretch justify-end" onClick={(e) => { if (e.target === e.currentTarget) fechar(); }}>
          <div className="w-full max-w-3xl bg-surface shadow-2xl flex flex-col h-full overflow-hidden">
            {/* Header do painel */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8D5A3]/30">
              {modoEdicao ? (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 bg-bg rounded-btn p-1">
                    <button onClick={() => setAbaEditor("editar")} className={`px-3 py-1 text-xs rounded font-medium transition-colors ${abaEditor === "editar" ? "bg-surface text-text-main shadow-sm" : "text-text-muted hover:text-text-main"}`}>
                      <Code2 size={12} className="inline mr-1" />Editar
                    </button>
                    <button onClick={() => setAbaEditor("preview")} className={`px-3 py-1 text-xs rounded font-medium transition-colors ${abaEditor === "preview" ? "bg-surface text-text-main shadow-sm" : "text-text-muted hover:text-text-main"}`}>
                      <Eye size={12} className="inline mr-1" />Preview
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => abrirEditar(docAberto!)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-main hover:bg-bg rounded-btn transition-colors">
                    <Pencil size={12} /> Editar
                  </button>
                  <button onClick={() => excluir(docAberto!.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-danger hover:bg-bg rounded-btn transition-colors">
                    <Trash2 size={12} /> Excluir
                  </button>
                </div>
              )}
              <button onClick={fechar} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg rounded transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Corpo */}
            <div className="flex-1 overflow-y-auto">
              {modoEdicao ? (
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label>Título *</Label>
                    <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Nome do documento" className="text-lg font-semibold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Categoria</Label>
                      <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as Categoria })} className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
                        {CATEGORIAS.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tipo</Label>
                      <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoDoc })} className="w-full h-10 px-3 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-gold/30">
                        {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  {form.tipo === "texto" && (
                    <div className="space-y-1.5">
                      <Label>Conteúdo (Markdown)</Label>
                      {abaEditor === "editar" ? (
                        <textarea
                          value={form.conteudo ?? ""}
                          onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                          placeholder={`## Título\n\nEscreva o conteúdo em **markdown**.\n\n- Item 1\n- Item 2`}
                          rows={18}
                          className="w-full px-3 py-2 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-gold/30"
                        />
                      ) : (
                        <div className="min-h-64 p-4 rounded-btn border border-[#E8D5A3] bg-bg prose prose-sm max-w-none">
                          <MarkdownView content={form.conteudo ?? ""} />
                        </div>
                      )}
                    </div>
                  )}

                  {form.tipo === "video" && (
                    <div className="space-y-1.5">
                      <Label>URL do YouTube</Label>
                      <Input value={form.video_url ?? ""} onChange={(e) => setForm({ ...form, video_url: e.target.value || null })} placeholder="https://youtube.com/watch?v=..." />
                      {form.video_url && extrairYoutubeId(form.video_url) && (
                        <div className="aspect-video rounded-card overflow-hidden bg-black mt-2">
                          <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${extrairYoutubeId(form.video_url)}`} allowFullScreen />
                        </div>
                      )}
                      <div className="space-y-1.5 mt-3">
                        <Label>Descrição (opcional)</Label>
                        <textarea value={form.conteudo ?? ""} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} placeholder="Descreva o conteúdo do vídeo..." rows={4} className="w-full px-3 py-2 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold/30" />
                      </div>
                    </div>
                  )}

                  {form.tipo === "arquivo" && (
                    <div className="space-y-1.5">
                      <Label>URL do arquivo</Label>
                      <Input value={form.arquivo_url ?? ""} onChange={(e) => setForm({ ...form, arquivo_url: e.target.value || null })} placeholder="https://..." />
                      <div className="space-y-1.5 mt-3">
                        <Label>Descrição (opcional)</Label>
                        <textarea value={form.conteudo ?? ""} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} placeholder="Descreva o arquivo..." rows={4} className="w-full px-3 py-2 rounded-btn border border-[#E8D5A3] bg-bg text-text-main text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold/30" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label>Tags (separadas por vírgula)</Label>
                    <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="liderança, OKR, board, estratégia..." />
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="publico" checked={form.publico} onChange={(e) => setForm({ ...form, publico: e.target.checked })} className="rounded" />
                    <Label htmlFor="publico" className="font-normal cursor-pointer">Visível para clientes</Label>
                  </div>
                </div>
              ) : (
                <DocViewer doc={docAberto!} />
              )}
            </div>

            {/* Footer do painel (modo edição) */}
            {modoEdicao && (
              <div className="px-6 py-4 border-t border-[#E8D5A3]/30 flex justify-end gap-3">
                <Button variant="secondary" onClick={fechar}>Cancelar</Button>
                <Button onClick={salvar} disabled={salvando || !form.titulo.trim()}>
                  {salvando ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VISUALIZADOR DE DOCUMENTO
// ─────────────────────────────────────────────────────────────

function DocViewer({ doc }: { doc: Documento }) {
  const cat = CATEGORIAS.find((c) => c.key === doc.categoria);
  const ytId = doc.video_url ? extrairYoutubeId(doc.video_url) : null;

  return (
    <div className="p-6">
      {/* Meta */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: CAT_CORES[doc.categoria], backgroundColor: CAT_CORES[doc.categoria] + "15" }}>
          {cat?.emoji} {cat?.label}
        </span>
        <span className="text-xs text-text-muted">{TIPO_LABELS[doc.tipo]}</span>
        {doc.publico && <span className="text-xs text-success bg-success/10 px-1.5 py-0.5 rounded-full">Público</span>}
      </div>

      <h1 className="font-display text-3xl font-bold text-text-main mb-4">{doc.titulo}</h1>

      {/* Video embed */}
      {doc.tipo === "video" && ytId && (
        <div className="aspect-video rounded-card overflow-hidden bg-black mb-6">
          <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${ytId}`} allowFullScreen />
        </div>
      )}

      {/* Arquivo link */}
      {doc.tipo === "arquivo" && doc.arquivo_url && (
        <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-gold rounded-btn text-sm font-medium mb-6 hover:bg-primary/90 transition-colors">
          <Paperclip size={15} /> Abrir arquivo <ExternalLink size={12} />
        </a>
      )}

      {/* Conteúdo markdown */}
      {doc.conteudo && (
        <div className="prose-conhecimento">
          <MarkdownView content={doc.conteudo} />
        </div>
      )}

      {/* Tags */}
      {doc.tags && doc.tags.length > 0 && (
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-[#E8D5A3]/30 flex-wrap">
          <Tag size={12} className="text-text-muted" />
          {doc.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded bg-[#E8D5A3]/30 text-text-muted">{tag}</span>
          ))}
        </div>
      )}

      <p className="text-xs text-text-muted mt-6">
        Atualizado em {new Date(doc.atualizado_em).toLocaleDateString("pt-BR")}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RENDERER MARKDOWN
// ─────────────────────────────────────────────────────────────

function MarkdownView({ content }: { content: string }) {
  return (
    <div className="markdown-body text-text-main text-sm leading-relaxed">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="font-display text-2xl font-bold text-text-main mt-6 mb-3">{children}</h1>,
          h2: ({ children }) => <h2 className="font-display text-xl font-semibold text-text-main mt-5 mb-2 pb-1 border-b border-[#E8D5A3]/50">{children}</h2>,
          h3: ({ children }) => <h3 className="font-semibold text-text-main mt-4 mb-2">{children}</h3>,
          p:  ({ children }) => <p className="text-text-main mb-3 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-text-main">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-text-main">{children}</ol>,
          li: ({ children }) => <li className="text-text-main">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-text-main">{children}</strong>,
          em: ({ children }) => <em className="italic text-text-muted">{children}</em>,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-gold pl-4 my-3 text-text-muted italic">{children}</blockquote>,
          code: ({ children }) => <code className="bg-[#E8D5A3]/30 text-primary px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
          pre: ({ children }) => <pre className="bg-bg border border-[#E8D5A3]/50 rounded-card p-4 my-3 overflow-x-auto text-xs font-mono">{children}</pre>,
          hr: () => <hr className="border-[#E8D5A3]/50 my-4" />,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">{children}</a>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
