"use client";

import { useState } from "react";
import { FormBase } from "@/components/forms/form-base";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const TEMAS = [
  "Liderança e Cultura Organizacional",
  "Governança e Board",
  "Alta Performance",
  "Gestão de Times",
  "Outro",
];

export default function PalestraPage() {
  const [tema, setTema] = useState("");
  const [data, setData] = useState("");
  const [formato, setFormato] = useState("");
  const [participantes, setParticipantes] = useState("");

  return (
    <FormBase
      titulo="Solicitar Palestra"
      subtitulo="Conte-nos sobre o seu evento e entraremos em contato com uma proposta."
      origem="palestra"
      tipoServico="palestra"
      dadosExtras={{ tema, data_evento: data, formato, participantes }}
      camposExtras={
        <>
          <div className="space-y-1.5">
            <Label>Tema de interesse</Label>
            <select
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">Selecione...</option>
              {TEMAS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Data aproximada</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Formato</Label>
              <select
                value={formato}
                onChange={(e) => setFormato(e.target.value)}
                className="flex h-10 w-full rounded-btn border border-[#E8D5A3] bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="">Selecione...</option>
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Nº de participantes</Label>
              <Input
                type="number"
                value={participantes}
                onChange={(e) => setParticipantes(e.target.value)}
                placeholder="Ex: 200"
              />
            </div>
          </div>
        </>
      }
    />
  );
}
