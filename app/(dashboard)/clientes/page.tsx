"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building2, Users, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ClienteModal } from "@/components/clientes/cliente-modal";
import { formatDate } from "@/lib/utils";

export type Cliente = {
  id: string;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  setor?: string;
  porte?: string;
  num_funcionarios?: number;
  faturamento_estimado?: string;
  modelo_trabalho?: string;
  data_inicio_contrato?: string;
  status: string;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
};

const PORTE_LABELS: Record<string, string> = {
  micro: "Micro",
  pequena: "Pequena",
  media: "Média",
  grande: "Grande",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "muted"> = {
  ativo: "success",
  pausado: "warning",
  encerrado: "danger",
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroResponsavel, setFiltroResponsavel] = useState<"todos" | "meus">("todos");
  const [userId, setUserId] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    carregar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregar() {
    const { data } = await supabase
      .from("clientes")
      .select("*, usuarios!responsavel_id(nome)")
      .order("criado_em", { ascending: false });
    if (data) setClientes(data as Cliente[]);
  }

  const filtrados = clientes.filter((c) => {
    const buscaOk = c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.setor?.toLowerCase().includes(busca.toLowerCase());
    const responsavelOk = filtroResponsavel === "todos" ||
      (c as unknown as Record<string, unknown>).responsavel_id === userId;
    return buscaOk && responsavelOk;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">Clientes</h1>
          <p className="text-text-muted mt-1">{clientes.length} empresa{clientes.length !== 1 ? "s" : ""} cadastrada{clientes.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-btn border border-[#E8D5A3]/50 overflow-hidden text-xs">
            {(["todos", "meus"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltroResponsavel(f)}
                className={`px-3 py-1.5 transition-all ${filtroResponsavel === f ? "bg-primary text-gold" : "bg-surface text-text-muted hover:text-text-main"}`}
              >
                {f === "todos" ? "Todos" : "Minha carteira"}
              </button>
            ))}
          </div>
          <Button onClick={() => setModalAberto(true)}>
            <Plus size={16} /> Novo Cliente
          </Button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Buscar por nome ou setor..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{busca ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}</p>
          {!busca && (
            <Button variant="secondary" className="mt-4" onClick={() => setModalAberto(true)}>
              Cadastrar primeiro cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map((c) => (
            <Link key={c.id} href={`/clientes/${c.id}`}>
              <Card className="hover:border-gold/50 hover:shadow-sm transition-all cursor-pointer h-full">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-main truncate">{c.nome}</h3>
                      {c.setor && <p className="text-xs text-text-muted mt-0.5">{c.setor}</p>}
                    </div>
                    <Badge variant={STATUS_VARIANT[c.status] ?? "muted"} className="ml-2 flex-shrink-0">
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    {c.porte && (
                      <span className="flex items-center gap-1">
                        <Building2 size={12} />
                        {PORTE_LABELS[c.porte] ?? c.porte}
                      </span>
                    )}
                    {c.num_funcionarios && (
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {c.num_funcionarios} func.
                      </span>
                    )}
                  </div>

                  {c.data_inicio_contrato && (
                    <p className="text-xs text-text-muted">
                      Cliente desde {formatDate(c.data_inicio_contrato)}
                    </p>
                  )}

                  <div className="flex items-center justify-end text-gold text-xs font-medium mt-auto">
                    Ver ficha <ChevronRight size={14} className="ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {modalAberto && (
        <ClienteModal
          cliente={null}
          onClose={() => setModalAberto(false)}
          onSave={carregar}
        />
      )}
    </div>
  );
}
