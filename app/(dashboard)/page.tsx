import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, AlertCircle, ClipboardList, BarChart2 } from "lucide-react";

const stats = [
  { label: "Leads novos (24h)", value: "3", icon: TrendingUp, variant: "default" as const },
  { label: "Clientes ativos", value: "8", icon: Users, variant: "success" as const },
  { label: "MRR", value: "R$ 42.000", icon: DollarSign, variant: "default" as const },
  { label: "Cobranças vencendo (7d)", value: "2", icon: AlertCircle, variant: "warning" as const },
  { label: "OKRs críticos", value: "1", icon: BarChart2, variant: "danger" as const },
  { label: "Pesquisas pendentes", value: "14", icon: ClipboardList, variant: "muted" as const },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-text-main">Dashboard</h1>
        <p className="text-text-muted mt-1">Visão geral da operação Mendonça & Co</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">{stat.label}</p>
                  <p className="font-mono-data text-3xl font-semibold text-text-main mt-1">{stat.value}</p>
                </div>
                <div className="w-12 h-12 rounded-card bg-gold/10 flex items-center justify-center">
                  <Icon size={22} className="text-gold" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Últimos leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["João Silva — Mentoria 3D", "Maria Oliveira — Palestra", "Carlos Souza — Diagnóstico Board"].map((lead) => (
                <div key={lead} className="flex items-center justify-between py-2 border-b border-[#E8D5A3]/30 last:border-0">
                  <span className="text-sm text-text-main">{lead}</span>
                  <Badge variant="default">Novo</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cobranças próximas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { empresa: "Tech Solutions", valor: "R$ 8.000", dias: "3 dias" },
                { empresa: "Grupo Alpha", valor: "R$ 12.000", dias: "5 dias" },
              ].map((c) => (
                <div key={c.empresa} className="flex items-center justify-between py-2 border-b border-[#E8D5A3]/30 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text-main">{c.empresa}</p>
                    <p className="text-xs text-text-muted">Vence em {c.dias}</p>
                  </div>
                  <span className="font-mono-data text-sm font-semibold text-text-main">{c.valor}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
