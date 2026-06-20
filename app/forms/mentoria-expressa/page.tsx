"use client";

import { useState } from "react";
import { FormBase } from "@/components/forms/form-base";
import { Label } from "@/components/ui/label";

const HORARIOS = [
  "Manhã (8h–12h)",
  "Tarde (13h–17h)",
  "Início da noite (17h–19h)",
  "Flexível",
];

export default function MentoriaExpressaPage() {
  const [gargalo, setGargalo] = useState("");
  const [disponibilidade, setDisponibilidade] = useState("");

  return (
    <FormBase
      titulo="Mentoria Individual Expressa"
      subtitulo="Uma sessão focada no seu maior gargalo. Preencha abaixo e agendaremos em até 48h."
      origem="mentoria-expressa"
      tipoServico="mentoria_expressa"
      dadosExtras={{ gargalo_principal: gargalo, disponibilidade }}
      camposExtras={
        <>
          <div className="space-y-1.5">
            <Label>Principal gargalo (em até 3 linhas) *</Label>
            <textarea
              value={gargalo}
              onChange={(e) => setGargalo(e.target.value)}
              placeholder="Descreva brevemente o que está travando o seu crescimento..."
              rows={3}
              maxLength={500}
              className="flex w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold resize-none"
            />
            <p className="text-xs text-text-muted text-right">{gargalo.length}/500</p>
          </div>

          <div className="space-y-1.5">
            <Label>Disponibilidade de horário</Label>
            <select
              value={disponibilidade}
              onChange={(e) => setDisponibilidade(e.target.value)}
              className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">Selecione...</option>
              {HORARIOS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </>
      }
    />
  );
}
