"use client";

import { useState } from "react";
import { FormBase } from "@/components/forms/form-base";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const FATURAMENTOS = [
  "Até R$ 500 mil/ano",
  "R$ 500 mil a R$ 2 milhões/ano",
  "R$ 2 milhões a R$ 10 milhões/ano",
  "R$ 10 milhões a R$ 50 milhões/ano",
  "Acima de R$ 50 milhões/ano",
];

export default function MentoriaPage() {
  const [desafio, setDesafio] = useState("");
  const [faturamento, setFaturamento] = useState("");
  const [funcionarios, setFuncionarios] = useState("");

  return (
    <FormBase
      titulo="Quero conhecer a Mentoria 3D"
      subtitulo="Preencha os dados abaixo e entraremos em contato para agendar uma conversa."
      origem="mentoria-3d"
      tipoServico="mentoria_3d"
      dadosExtras={{ desafio, faturamento, funcionarios }}
      camposExtras={
        <>
          <div className="space-y-1.5">
            <Label>Qual é o seu maior desafio atual? *</Label>
            <textarea
              value={desafio}
              onChange={(e) => setDesafio(e.target.value)}
              placeholder="Descreva brevemente o seu principal desafio como líder..."
              rows={3}
              className="flex w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Faturamento aproximado</Label>
              <select
                value={faturamento}
                onChange={(e) => setFaturamento(e.target.value)}
                className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="">Selecione...</option>
                {FATURAMENTOS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Número de funcionários</Label>
              <Input
                type="number"
                value={funcionarios}
                onChange={(e) => setFuncionarios(e.target.value)}
                placeholder="Ex: 50"
              />
            </div>
          </div>
        </>
      }
    />
  );
}
