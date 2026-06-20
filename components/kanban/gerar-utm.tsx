"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Copy, Check, Link2 } from "lucide-react";

const FONTES = [
  { id: "youtube", label: "YouTube", medium: "video" },
  { id: "instagram", label: "Instagram", medium: "social" },
  { id: "substack", label: "Substack", medium: "email" },
  { id: "linkedin", label: "LinkedIn", medium: "social" },
  { id: "whatsapp", label: "WhatsApp", medium: "mensagem" },
  { id: "indicacao", label: "Indicação", medium: "referral" },
];

type Props = { onClose: () => void };

export function GerarUTM({ onClose }: Props) {
  const [baseUrl, setBaseUrl] = useState("");
  const [source, setSource] = useState("youtube");
  const [medium, setMedium] = useState("video");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [copiado, setCopiado] = useState(false);

  function selecionarFonte(f: typeof FONTES[0]) {
    setSource(f.id);
    setMedium(f.medium);
  }

  function gerarUrl() {
    if (!baseUrl) return "";
    const base = baseUrl.includes("?") ? baseUrl : baseUrl;
    const params = new URLSearchParams({
      utm_source: source,
      utm_medium: medium,
      ...(campaign ? { utm_campaign: campaign } : {}),
      ...(content ? { utm_content: content } : {}),
    });
    const sep = baseUrl.includes("?") ? "&" : "?";
    return `${base}${sep}${params.toString()}`;
  }

  const urlGerada = gerarUrl();

  async function copiar() {
    if (!urlGerada) return;
    await navigator.clipboard.writeText(urlGerada);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-card shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link2 size={20} className="text-primary" />
            <h2 className="font-display text-xl font-bold text-text-main">Gerador de Links UTM</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>URL de destino *</Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://mendoncaeco.com/diagnostico"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Fonte (utm_source)</Label>
            <div className="grid grid-cols-3 gap-2">
              {FONTES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => selecionarFonte(f)}
                  className={`px-3 py-2 rounded-btn text-xs font-medium border transition-colors ${
                    source === f.id
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-[#E8D5A3] text-text-muted hover:text-text-main hover:border-[#C9A84C]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Meio (utm_medium)</Label>
              <Input value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="video, social..." />
            </div>
            <div className="space-y-1.5">
              <Label>Campanha (utm_campaign)</Label>
              <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="lancamento-jun25" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Conteúdo (utm_content) — opcional</Label>
            <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="video-diagnostico, post-carrossel..." />
          </div>

          {urlGerada && (
            <div className="bg-background border border-[#E8D5A3] rounded-btn p-3">
              <p className="text-[10px] text-text-muted uppercase font-medium mb-1.5">Link gerado</p>
              <p className="text-xs text-text-main break-all font-mono leading-relaxed">{urlGerada}</p>
              <button
                onClick={copiar}
                className="flex items-center gap-1.5 mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {copiado ? <Check size={12} /> : <Copy size={12} />}
                {copiado ? "Copiado!" : "Copiar link"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-[#E8D5A3]/50">
          <p className="text-[11px] text-text-muted leading-relaxed">
            Quando um lead chegar pelo link UTM, a fonte será capturada automaticamente no CRM.
            Acompanhe os resultados em Origens & Canais.
          </p>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}
