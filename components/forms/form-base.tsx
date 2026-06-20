"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const baseSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().min(10, "WhatsApp obrigatório"),
  cargo: z.string().min(1, "Cargo obrigatório"),
  empresa: z.string().min(1, "Empresa obrigatória"),
  como_encontrou: z.string().min(1, "Selecione uma opção"),
});

export type BaseFields = z.infer<typeof baseSchema>;

type Props = {
  titulo: string;
  subtitulo: string;
  origem: string;
  tipoServico: string;
  camposExtras?: React.ReactNode;
  dadosExtras?: Record<string, string>;
};

const COMO_ENCONTROU = ["Instagram", "LinkedIn", "Indicação", "Podcast", "YouTube", "Outro"];

export function FormBase({ titulo, subtitulo, origem, tipoServico, camposExtras, dadosExtras }: Props) {
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [utm, setUtm] = useState<Record<string, string>>({});

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const u: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
      const v = p.get(k);
      if (v) u[k] = v;
    }
    setUtm(u);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BaseFields>({
    resolver: zodResolver(baseSchema),
  });

  async function onSubmit(data: BaseFields) {
    setEnviando(true);
    setErro("");

    const supabase = createClient();
    const { error } = await supabase.from("leads").insert({
      nome: data.nome,
      email: data.email,
      whatsapp: data.whatsapp,
      cargo: data.cargo,
      empresa: data.empresa,
      como_encontrou: data.como_encontrou,
      canal: utm.utm_source || data.como_encontrou?.toLowerCase().replace(/\s+/g, "_") || null,
      origem,
      tipo_servico: tipoServico,
      etapa: "novo",
      dados_extras: dadosExtras ?? {},
      ...utm,
    });

    if (error) {
      setErro("Ocorreu um erro. Tente novamente.");
      setEnviando(false);
      return;
    }

    setEnviado(true);
    setEnviando(false);
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-bold text-gold mb-3">Recebemos sua solicitação!</h2>
          <p className="text-gold/70 text-sm leading-relaxed">
            Em breve entraremos em contato. Fique atento ao seu e-mail e WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-gold">Mendonça & Co</h1>
          <p className="text-gold/60 mt-1 text-sm">Consultoria de Board e Cultura Organizacional</p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-card p-8 shadow-lg">
          <h2 className="font-display text-2xl font-semibold text-text-main mb-1">{titulo}</h2>
          <p className="text-text-muted text-sm mb-6">{subtitulo}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Campos base */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome completo *</Label>
                <Input {...register("nome")} placeholder="Seu nome" />
                {errors.nome && <p className="text-xs text-danger">{errors.nome.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>E-mail *</Label>
                <Input {...register("email")} type="email" placeholder="seu@email.com" />
                {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>WhatsApp *</Label>
                <Input {...register("whatsapp")} placeholder="(11) 99999-9999" />
                {errors.whatsapp && <p className="text-xs text-danger">{errors.whatsapp.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Cargo *</Label>
                <Input {...register("cargo")} placeholder="CEO, Diretor..." />
                {errors.cargo && <p className="text-xs text-danger">{errors.cargo.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Empresa *</Label>
              <Input {...register("empresa")} placeholder="Nome da sua empresa" />
              {errors.empresa && <p className="text-xs text-danger">{errors.empresa.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Como nos encontrou? *</Label>
              <select
                {...register("como_encontrou")}
                className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="">Selecione...</option>
                {COMO_ENCONTROU.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {errors.como_encontrou && <p className="text-xs text-danger">{errors.como_encontrou.message}</p>}
            </div>

            {/* Campos específicos do formulário */}
            {camposExtras}

            {erro && <p className="text-sm text-danger">{erro}</p>}

            <Button type="submit" className="w-full mt-2" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
