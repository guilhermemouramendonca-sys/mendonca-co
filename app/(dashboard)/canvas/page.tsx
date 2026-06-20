"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link2, FileText, ExternalLink, ChevronDown, ChevronUp, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PERGUNTAS_CANVAS } from "@/lib/canvas/perguntas";
import type { CanvasId } from "@/lib/canvas/perguntas";

type Registro = {
  id: string;
  token: string;
  respondente_nome?: string;
  respondente_email?: string;
  respondente_empresa?: string;
  respondente_cargo?: string;
  resultado?: { respostas: Record<CanvasId, string>; analise: Record<CanvasId, string> };
  pdf_url?: string;
  criado_em: string;
  concluido_em?: string;
};

export default function CanvasPage() {
  const supabase = createClient();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState<string | null>(null);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data } = await supabase
      .from("canvas_estrategico")
      .select("*")
      .order("criado_em", { ascending: false });
    if (data) setRegistros(data);
  }

  async function gerarLink() {
    const token = crypto.randomUUID();
    const { error } = await supabase.from("canvas_estrategico").insert({ token });
    if (!error) {
      const url = `${window.location.origin}/forms/canvas/${token}`;
      await navigator.clipboard.writeText(url);
      alert("Link copiado:\n" + url);
      carregar();
    }
  }

  async function gerarPdf(id: string) {
    setGerandoPdf(id);
    const res = await fetch("/api/canvas/gerar-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canvasId: id }),
    });
    const data = await res.json();
    if (data.pdfUrl) window.open(data.pdfUrl, "_blank");
    setGerandoPdf(null);
    carregar();
  }

  const concluidos = registros.filter((r) => r.respondente_nome);
  const pendentes = registros.filter((r) => !r.respondente_nome);

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">Canvas Estratégico</h1>
          <p className="text-text-muted mt-1">
            {concluidos.length} concluído{concluidos.length !== 1 ? "s" : ""}
            {pendentes.length > 0 && ` · ${pendentes.length} pendente${pendentes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={gerarLink}>
          <Link2 size={16} /> Gerar link
        </Button>
      </div>

      {/* Concluídos */}
      {concluidos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4">Concluídos</h2>
          <div className="space-y-3">
            {concluidos.map((r) => {
              const aberto = expandido === r.id;
              return (
                <Card key={r.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg/50"
                      onClick={() => setExpandido(aberto ? null : r.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-lg">🎯</div>
                        <div>
                          <p className="font-semibold text-text-main">{r.respondente_nome}</p>
                          <p className="text-xs text-text-muted">
                            {r.respondente_email}
                            {r.respondente_empresa && ` · ${r.respondente_empresa}`}
                            {" · "}{formatDate(r.concluido_em ?? r.criado_em)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.pdf_url ? (
                          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); window.open(r.pdf_url!, "_blank"); }}>
                            <ExternalLink size={13} /> PDF
                          </Button>
                        ) : (
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); gerarPdf(r.id); }} disabled={gerandoPdf === r.id}>
                            <FileText size={13} /> {gerandoPdf === r.id ? "Gerando..." : "Gerar PDF"}
                          </Button>
                        )}
                        {aberto ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                      </div>
                    </div>

                    {aberto && r.resultado && (
                      <div className="border-t border-[#E8D5A3]/30 p-4 bg-bg/30 space-y-4">
                        {PERGUNTAS_CANVAS.map((q) => {
                          const resposta = r.resultado!.respostas[q.id] ?? "";
                          const analise = r.resultado!.analise?.[q.id] ?? "";
                          if (!resposta.trim()) return null;
                          return (
                            <div key={q.id} className="border-l-2 pl-4" style={{ borderColor: q.cor }}>
                              <p className="text-xs font-semibold text-text-muted mb-1">{q.icone} {q.titulo}</p>
                              <p className="text-sm text-text-main mb-2 leading-relaxed">{resposta}</p>
                              {analise && (
                                <p className="text-xs text-text-muted italic">{analise}</p>
                              )}
                            </div>
                          );
                        })}
                        {r.pdf_url && (
                          <Button size="sm" onClick={() => gerarPdf(r.id)} disabled={gerandoPdf === r.id} variant="secondary">
                            {gerandoPdf === r.id ? "Gerando..." : "Regerar PDF"}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Pendentes */}
      {pendentes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4">Aguardando resposta</h2>
          <div className="space-y-2">
            {pendentes.map((r) => {
              const url = `${typeof window !== "undefined" ? window.location.origin : ""}/forms/canvas/${r.token}`;
              return (
                <Card key={r.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E8D5A3]/30 flex items-center justify-center">
                        <Users size={14} className="text-text-muted" />
                      </div>
                      <div>
                        <p className="text-sm text-text-muted">Link gerado em {formatDate(r.criado_em)}</p>
                        <p className="text-xs text-text-muted/60 font-mono truncate max-w-xs">{r.token}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(url)}>
                      <Link2 size={13} /> Copiar link
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {registros.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-text-muted text-sm mb-4">Nenhum Canvas Estratégico ainda.</p>
            <Button onClick={gerarLink}>
              <Link2 size={15} /> Gerar primeiro link
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
