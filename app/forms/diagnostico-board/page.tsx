"use client";

import { useState } from "react";
import { FormBase } from "@/components/forms/form-base";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const ESTRUTURAS = [
  "Não temos conselho ou board",
  "Board informal (sócios reunidos)",
  "Conselho de administração estruturado",
  "Advisory board / conselheiros externos",
  "Conselho fiscal ativo",
];

const FATURAMENTOS = [
  "Até R$ 5 milhões/ano",
  "R$ 5 milhões a R$ 20 milhões/ano",
  "R$ 20 milhões a R$ 100 milhões/ano",
  "Acima de R$ 100 milhões/ano",
];

export default function DiagnosticoBoardPage() {
  const [estrutura, setEstrutura] = useState("");
  const [socios, setSocios] = useState("");
  const [faturamento, setFaturamento] = useState("");

  return (
    <FormBase
      titulo="Diagnóstico de Board"
      subtitulo="Avalie a maturidade da governança da sua empresa. Preencha os dados abaixo."
      origem="diagnostico-board"
      tipoServico="diagnostico_board"
      dadosExtras={{ estrutura_atual: estrutura, num_socios: socios, faturamento_anual: faturamento }}
      camposExtras={
        <>
          <div className="space-y-1.5">
            <Label>Estrutura atual de governança</Label>
            <select
              value={estrutura}
              onChange={(e) => setEstrutura(e.target.value)}
              className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">Selecione...</option>
              {ESTRUTURAS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Número de sócios</Label>
              <Input
                type="number"
                value={socios}
                onChange={(e) => setSocios(e.target.value)}
                placeholder="Ex: 3"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Faturamento anual</Label>
              <select
                value={faturamento}
                onChange={(e) => setFaturamento(e.target.value)}
                className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="">Selecione...</option>
                {FATURAMENTOS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </>
      }
    />
  );
}
