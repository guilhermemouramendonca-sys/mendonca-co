"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link2, FileText, ExternalLink, ChevronDown, ChevronUp, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DIMENSOES, corScore, labelScore } from "@/lib/radar360/dimensoes";
import type { ResultadoRadar360 } from "@/lib/radar360/dimensoes";

type Registro = {
  id: string;
  token: string;
  respondente_nome?: string;
  respondente_email?: string;
  respondente_empresa?: string;
  respondente_cargo?: string;
  faturamento_faixa?: string;
  resultado?: ResultadoRadar360;
  pdf_url?: string;
  lead_criado?: boolean;
  criado_em: string;
};

const FAT_LABELS: Record<string, string> = {
  ate_7m: "Até R$7M", "7m_30m": "R$7M–R$30M",
  "30m_100m": "R$30M–R$100M", acima_100m: ">R$100M",
};

export default function Radar360Page() {
  const supabase = createClient();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState<string | null>(null);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data } = await supabase
      .from("radar360")
      .select("*")
      .order("criado_em", { ascending: false });
    if (data) setRegistros(data);
  }

  async function gerarLink() {
    const token = crypto.randomUUID();
    const { error } = await supabase.from("radar360").insert({ token });
    if (!error) {
      const url = `${window.location.origin}/forms/radar360/${token}`;
      await navigator.clipboard.writeText(url);
      alert("Link copiado para o clipboard:\n" + url);
      carregar();
    }
  }

  async function gerarPdf(id: string) {
    setGerandoPdf(id);
    const res = await fetch("/api/radar360/gerar-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ radar360Id: id }),
    });
    const data = await res.json();
    if (data.pdfUrl) window.open(data.pdfUrl, "_blank");
    setGerandoPdf(null);
    carregar();
  }

  const concluidos = registros.filter((r) => r.resultado && r.respondente_nome);
  const pendentes = registros.filter((r) => !r.resultado || !r.respondente_nome);

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">Radar 360</h1>
          <p className="text-text-muted mt-1">
            {concluidos.length} concluído{concluidos.length !== 1 ? "s" : ""}
            {pendentes.length > 0 && ` · ${pendentes.length} pendente${pendentes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={gerarLink} className="flex items-center gap-2">
          <Link2 size={16} /> Gerar link
        </Button>
      </div>

      {/* Concluídos */}
      {concluidos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4">Concluídos</h2>
          <div className="space-y-3">
            {concluidos.map((r) => {
              const geral = r.resultado!.geral;
              const corGeral = corScore(Math.round(geral));
              const aberto = expandido === r.id;

              return (
                <Card key={r.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header do card */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg/50 transition-colors"
                      onClick={() => setExpandido(aberto ? null : r.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-mono-data font-bold text-sm"
                          style={{ backgroundColor: corGeral + "20", color: corGeral }}>
                          {geral.toFixed(1)}
                        </div>
                        <div>
                          <p className="font-semibold text-text-main">{r.respondente_nome}</p>
                          <p className="text-xs text-text-muted">
                            {r.respondente_email}
                            {r.respondente_empresa && ` · ${r.respondente_empresa}`}
                            {r.faturamento_faixa && ` · ${FAT_LABELS[r.faturamento_faixa] ?? r.faturamento_faixa}`}
                            {" · "}{formatDate(r.criado_em)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-full"
                          style={{ color: corGeral, backgroundColor: corGeral + "15" }}>
                          Entrada {r.resultado!.portaEntrada}
                        </span>
                        {aberto ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                      </div>
                    </div>

                    {/* Detalhe expandido */}
                    {aberto && (
                      <div className="border-t border-[#E8D5A3]/30 p-4 bg-bg/30">
                        {/* Scores das 8 dimensões */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {DIMENSOES.map((d) => {
                            const score = r.resultado!.scores[d.id];
                            const cor = corScore(score);
                            return (
                              <div key={d.id} className="bg-surface rounded-btn p-2">
                                <p className="text-[9px] text-text-muted mb-1">{d.titulo}</p>
                                <div className="flex items-center justify-between">
                                  <p className="font-mono-data text-base font-bold text-text-main">{score}/5</p>
                                  <span className="text-[8px]" style={{ color: cor }}>{labelScore(score)}</span>
                                </div>
                                <div className="w-full bg-[#E8D5A3]/30 rounded-full h-1 mt-1">
                                  <div className="h-1 rounded-full" style={{ width: `${(score / 5) * 100}%`, backgroundColor: cor }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Zonas */}
                        <div className="flex gap-3 mb-4 flex-wrap">
                          {r.resultado!.zonaCritica.length > 0 && (
                            <div className="text-xs px-3 py-1 rounded-full bg-danger/10 text-danger">
                              Crítico: {r.resultado!.zonaCritica.map((id) => DIMENSOES.find((d) => d.id === id)?.titulo).join(", ")}
                            </div>
                          )}
                          {r.resultado!.zonaAtencao.length > 0 && (
                            <div className="text-xs px-3 py-1 rounded-full bg-gold/10 text-gold">
                              Atenção: {r.resultado!.zonaAtencao.map((id) => DIMENSOES.find((d) => d.id === id)?.titulo).join(", ")}
                            </div>
                          )}
                          {r.resultado!.zonaForte.length > 0 && (
                            <div className="text-xs px-3 py-1 rounded-full bg-success/10 text-success">
                              Forte: {r.resultado!.zonaForte.map((id) => DIMENSOES.find((d) => d.id === id)?.titulo).join(", ")}
                            </div>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2">
                          {r.pdf_url ? (
                            <Button size="sm" variant="secondary" onClick={() => window.open(r.pdf_url!, "_blank")}>
                              <ExternalLink size={14} className="mr-1" /> Abrir PDF
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => gerarPdf(r.id)} disabled={gerandoPdf === r.id}>
                              <FileText size={14} className="mr-1" />
                              {gerandoPdf === r.id ? "Gerando..." : "Gerar PDF"}
                            </Button>
                          )}
                          {r.pdf_url && (
                            <Button size="sm" onClick={() => gerarPdf(r.id)} disabled={gerandoPdf === r.id} variant="secondary">
                              {gerandoPdf === r.id ? "Gerando..." : "Regerar PDF"}
                            </Button>
                          )}
                        </div>
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
              const url = `${typeof window !== "undefined" ? window.location.origin : ""}/forms/radar360/${r.token}`;
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
                      <Link2 size={13} className="mr-1" /> Copiar link
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
            <p className="text-text-muted text-sm mb-4">Nenhum Radar 360 ainda.</p>
            <Button onClick={gerarLink}>
              <Link2 size={15} className="mr-2" /> Gerar primeiro link
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
