"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  CheckCircle,
  Search,
  Heart,
  TrendingDown,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calcularHealthScore, type ClienteRaw, type HealthScore } from "@/lib/cs/health-score";
import Link from "next/link";

type ClienteComScore = ClienteRaw & { score: HealthScore };

export default function CSDashboard() {
  const supabase = createClient();
  const [clientes, setClientes] = useState<ClienteComScore[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "risco" | "atencao" | "saudavel">("todos");
  const [expandido, setExpandido] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    const { data } = await supabase
      .from("clientes")
      .select(`
        id, nome, status, data_inicio_contrato,
        sessoes(data),
        cobrancas(status, vencimento),
        diagnosticos(criado_em),
        radar360(criado_em),
        pesquisas(criado_em),
        plano_acao_itens:itens_plano_acao(status)
      `)
      .eq("status", "ativo")
      .order("nome");

    if (data) {
      const comScore = (data as ClienteRaw[]).map((c) => ({
        ...c,
        score: calcularHealthScore(c),
      }));
      setClientes(comScore);
    }
    setLoading(false);
  }

  const filtrados = clientes.filter((c) => {
    const buscaOk = c.nome.toLowerCase().includes(busca.toLowerCase());
    const filtroOk = filtro === "todos" || c.score.nivel === filtro;
    return buscaOk && filtroOk;
  });

  // Ordenar: risco → atenção → saudável, depois por score crescente dentro de cada grupo
  const ordenados = [...filtrados].sort((a, b) => {
    const ordem = { risco: 0, atencao: 1, saudavel: 2 };
    const diff = ordem[a.score.nivel] - ordem[b.score.nivel];
    return diff !== 0 ? diff : a.score.total - b.score.total;
  });

  const porNivel = {
    risco: clientes.filter((c) => c.score.nivel === "risco").length,
    atencao: clientes.filter((c) => c.score.nivel === "atencao").length,
    saudavel: clientes.filter((c) => c.score.nivel === "saudavel").length,
  };

  const scoresMedio =
    clientes.length > 0
      ? Math.round(clientes.reduce((acc, c) => acc + c.score.total, 0) / clientes.length)
      : 0;

  const totalAlertas = clientes.reduce((acc, c) => acc + c.score.alertas.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        Calculando health scores...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-main">CS Dashboard</h1>
          <p className="text-text-muted mt-1">
            Sucesso do cliente · {clientes.length} ativo{clientes.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-primary/10 flex items-center justify-center">
              <Heart size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-main">{scoresMedio}</p>
              <p className="text-xs text-text-muted">Score médio</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-green-400 transition-colors"
          onClick={() => setFiltro(filtro === "saudavel" ? "todos" : "saudavel")}
        >
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-green-50 flex items-center justify-center">
              <CheckCircle size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{porNivel.saudavel}</p>
              <p className="text-xs text-text-muted">Saudáveis</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-yellow-400 transition-colors"
          onClick={() => setFiltro(filtro === "atencao" ? "todos" : "atencao")}
        >
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-yellow-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{porNivel.atencao}</p>
              <p className="text-xs text-text-muted">Atenção</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-red-400 transition-colors"
          onClick={() => setFiltro(filtro === "risco" ? "todos" : "risco")}
        >
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-red-50 flex items-center justify-center">
              <TrendingDown size={18} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{porNivel.risco}</p>
              <p className="text-xs text-text-muted">Risco churn</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas rápidos */}
      {totalAlertas > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-card p-4 mb-6">
          <p className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
            <AlertTriangle size={15} /> {totalAlertas} alerta{totalAlertas !== 1 ? "s" : ""} ativos
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {clientes
              .filter((c) => c.score.alertas.length > 0)
              .slice(0, 8)
              .map((c) =>
                c.score.alertas.map((a, i) => (
                  <p key={`${c.id}-${i}`} className="text-xs text-yellow-700">
                    <span className="font-medium">{c.nome}:</span> {a}
                  </p>
                ))
              )}
          </div>
        </div>
      )}

      {/* Filtros + busca */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Buscar cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex rounded-btn border border-[#E8D5A3]/50 overflow-hidden text-xs">
          {(["todos", "risco", "atencao", "saudavel"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 transition-all ${filtro === f ? "bg-primary text-gold" : "bg-surface text-text-muted hover:text-text-main"}`}
            >
              {f === "todos" ? "Todos" : f === "risco" ? "Risco" : f === "atencao" ? "Atenção" : "Saudáveis"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de clientes */}
      {ordenados.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum cliente ativo encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ordenados.map((c) => {
            const aberto = expandido === c.id;
            return (
              <Card key={c.id} className={aberto ? "border-gold/50" : ""}>
                <CardContent className="p-0">
                  {/* Linha principal */}
                  <button
                    onClick={() => setExpandido(aberto ? null : c.id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-bg/50 transition-colors rounded-card"
                  >
                    {/* Score badge */}
                    <div
                      className="w-14 h-14 rounded-btn flex items-center justify-center flex-shrink-0 font-bold text-white text-lg"
                      style={{ backgroundColor: c.score.cor }}
                    >
                      {c.score.total}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-text-main truncate">{c.nome}</p>
                        {c.score.alertas.length > 0 && (
                          <span className="flex-shrink-0 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            {c.score.alertas.length} alerta{c.score.alertas.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {c.score.nivel === "saudavel" ? "Cliente saudável" :
                         c.score.nivel === "atencao" ? "Requer atenção" :
                         "Risco de churn"}
                      </p>
                    </div>

                    {/* Barra de score */}
                    <div className="hidden md:flex flex-col items-end gap-1 w-48 flex-shrink-0">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${c.score.total}%`, backgroundColor: c.score.cor }}
                        />
                      </div>
                      <div className="flex gap-3 text-xs text-text-muted">
                        {c.score.dimensoes.map((d) => (
                          <span key={d.nome} title={d.nome}>{d.pontos}</span>
                        ))}
                      </div>
                    </div>

                    <div className="text-text-muted flex-shrink-0">
                      {aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {/* Expandido: detalhes por dimensão + alertas */}
                  {aberto && (
                    <div className="px-4 pb-4 border-t border-[#E8D5A3]/30 pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {c.score.dimensoes.map((d) => (
                          <div key={d.nome} className="bg-bg rounded-btn p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-text-muted">{d.nome}</p>
                              <span
                                className="text-xs font-bold"
                                style={{ color: d.pontos >= 70 ? "#16A34A" : d.pontos >= 40 ? "#D97706" : "#DC2626" }}
                              >
                                {d.pontos}
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${d.pontos}%`,
                                  backgroundColor: d.pontos >= 70 ? "#16A34A" : d.pontos >= 40 ? "#D97706" : "#DC2626",
                                }}
                              />
                            </div>
                            <p className="text-xs text-text-muted mt-1.5">{d.detalhe}</p>
                          </div>
                        ))}
                      </div>

                      {c.score.alertas.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-btn p-3 mb-3">
                          <p className="text-xs font-semibold text-yellow-800 mb-1">Alertas</p>
                          {c.score.alertas.map((a, i) => (
                            <p key={i} className="text-xs text-yellow-700 flex items-center gap-1.5 mt-0.5">
                              <AlertTriangle size={11} /> {a}
                            </p>
                          ))}
                        </div>
                      )}

                      <Link
                        href={`/clientes/${c.id}`}
                        className="text-xs text-gold font-medium hover:underline"
                      >
                        Ver ficha completa →
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
