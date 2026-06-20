"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Link2, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { faixaScore } from "@/lib/diagnostico/perguntas";

type Diagnostico = {
  id: string;
  tipo: string;
  respondente_nome?: string;
  respondente_email?: string;
  resultado?: {
    geral: number;
    scores: { disciplina: number; direcao: number; dominio: number };
  };
  pdf_url?: string;
  token: string;
  criado_em: string;
};

export default function DiagnosticosPage() {
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [gerandoPdf, setGerandoPdf] = useState<string | null>(null);
  const [linkCopiado, setLinkCopiado] = useState<string | null>(null);
  const supabase = createClient();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data } = await supabase
      .from("diagnosticos")
      .select("*")
      .order("criado_em", { ascending: false });
    if (data) setDiagnosticos(data as Diagnostico[]);
  }

  async function criarLink() {
    const token = crypto.randomUUID();
    const { data } = await supabase
      .from("diagnosticos")
      .insert({ tipo: "captacao", token, respostas: {} })
      .select("id, token")
      .single();

    if (data) {
      const url = `${window.location.origin}/diagnostico/${data.token}`;
      await navigator.clipboard.writeText(url);
      setLinkCopiado(data.token);
      setTimeout(() => setLinkCopiado(null), 3000);
      carregar();
    }
  }

  async function gerarPdf(id: string) {
    setGerandoPdf(id);
    const res = await fetch("/api/diagnostico/gerar-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diagnosticoId: id }),
    });
    const data = await res.json();
    if (data.pdfUrl) {
      window.open(data.pdfUrl, "_blank");
      carregar();
    }
    setGerandoPdf(null);
  }

  async function copiarLink(token: string) {
    const url = `${window.location.origin}/diagnostico/${token}`;
    await navigator.clipboard.writeText(url);
    setLinkCopiado(token);
    setTimeout(() => setLinkCopiado(null), 3000);
  }

  const concluidos = diagnosticos.filter((d) => d.resultado && d.respondente_nome);
  const pendentes = diagnosticos.filter((d) => !d.resultado || !d.respondente_nome);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">Diagnóstico 3D</h1>
          <p className="text-text-muted mt-1">{concluidos.length} concluído{concluidos.length !== 1 ? "s" : ""} · {pendentes.length} pendente{pendentes.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={criarLink}>
          <Link2 size={15} />
          {linkCopiado ? "Link copiado!" : "Gerar link"}
        </Button>
      </div>

      {/* Concluídos */}
      {concluidos.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold text-text-main mb-4">Concluídos</h2>
          <div className="space-y-3">
            {concluidos.map((d) => {
              const geral = d.resultado!.geral;
              const faixa = faixaScore(geral);
              return (
                <Card key={d.id}>
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Score */}
                      <div className="w-14 h-14 rounded-card flex flex-col items-center justify-center bg-bg flex-shrink-0">
                        <span className="font-mono-data text-xl font-bold text-text-main">{geral.toFixed(1)}</span>
                        <div className="w-8 h-1 rounded-full mt-1" style={{ backgroundColor: faixa.cor }} />
                      </div>
                      {/* Info */}
                      <div className="min-w-0">
                        <p className="font-semibold text-text-main truncate">{d.respondente_nome}</p>
                        <p className="text-xs text-text-muted">{d.respondente_email} · {formatDate(d.criado_em)}</p>
                        <div className="flex gap-3 mt-1">
                          {(["disciplina", "direcao", "dominio"] as const).map((dim) => {
                            const s = d.resultado!.scores[dim];
                            const f = faixaScore(s);
                            return (
                              <span key={dim} className="text-[10px] font-mono-data" style={{ color: f.cor }}>
                                {dim.slice(0, 4).toUpperCase()} {s.toFixed(1)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => copiarLink(d.token)}
                      >
                        <Link2 size={13} />
                        {linkCopiado === d.token ? "Copiado!" : "Link"}
                      </Button>

                      {d.pdf_url ? (
                        <Button
                          size="sm"
                          onClick={() => window.open(d.pdf_url!, "_blank")}
                        >
                          <ExternalLink size={13} /> PDF
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => gerarPdf(d.id)}
                          disabled={gerandoPdf === d.id}
                        >
                          <Download size={13} />
                          {gerandoPdf === d.id ? "Gerando..." : "Gerar PDF"}
                        </Button>
                      )}
                    </div>
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
          <h2 className="font-display text-xl font-semibold text-text-main mb-4">Aguardando resposta</h2>
          <div className="space-y-2">
            {pendentes.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-surface rounded-btn border border-[#E8D5A3]/50">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-text-muted" />
                  <div>
                    <p className="text-sm text-text-muted">Link gerado em {formatDate(d.criado_em)}</p>
                    <p className="text-xs text-text-muted font-mono-data truncate max-w-xs">
                      /diagnostico/{d.token}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copiarLink(d.token)}
                >
                  <Link2 size={13} />
                  {linkCopiado === d.token ? "Copiado!" : "Copiar link"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {diagnosticos.length === 0 && (
        <div className="text-center py-20 text-text-muted">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-4">Nenhum diagnóstico ainda.</p>
          <Button onClick={criarLink}>
            <Link2 size={15} /> Gerar primeiro link
          </Button>
        </div>
      )}
    </div>
  );
}
