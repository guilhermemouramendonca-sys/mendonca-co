"use client";

import { useMemo } from "react";
import type { Funcionario } from "./funcionarios-tab";

type OrgNode = Funcionario & { filhos: OrgNode[] };

function buildTree(employees: Funcionario[]): OrgNode[] {
  const map = new Map<string, OrgNode>();
  for (const e of employees) map.set(e.id, { ...e, filhos: [] });
  const roots: OrgNode[] = [];
  for (const node of Array.from(map.values())) {
    if (node.gestor_id && map.has(node.gestor_id)) {
      map.get(node.gestor_id)!.filhos.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

const STATUS_CORES: Record<string, string> = {
  ativo: "#27AE60", ferias: "#C9A84C", licenca: "#2980B9", inativo: "#95A5A6",
};

function NodeCard({ node }: { node: OrgNode }) {
  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div className="bg-surface border border-[#E8D5A3]/50 rounded-card px-4 py-3 text-center shadow-sm min-w-[140px] max-w-[180px] relative">
        <div
          className="w-2 h-2 rounded-full absolute top-3 right-3"
          style={{ backgroundColor: STATUS_CORES[node.status] }}
        />
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center mx-auto mb-2">
          <span className="text-gold font-display font-bold text-sm">{node.nome.charAt(0)}</span>
        </div>
        <p className="font-semibold text-text-main text-xs leading-tight">{node.nome}</p>
        <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{node.cargo}</p>
        {node.departamento && (
          <p className="text-[10px] text-gold/70 mt-1">{node.departamento}</p>
        )}
      </div>

      {/* Children */}
      {node.filhos.length > 0 && (
        <div className="flex flex-col items-center">
          {/* Vertical line down from parent */}
          <div className="w-px h-6 bg-[#E8D5A3]/60" />

          {node.filhos.length === 1 ? (
            <NodeCard node={node.filhos[0]} />
          ) : (
            <div className="flex flex-col items-center">
              {/* Horizontal connector */}
              <div className="relative flex items-start">
                {/* Left cap */}
                <div
                  className="absolute top-0 border-t border-l border-[#E8D5A3]/60"
                  style={{
                    left: "50%",
                    width: `calc(50% - 70px)`,
                    height: "12px",
                  }}
                />
                {/* Right cap */}
                <div
                  className="absolute top-0 border-t border-r border-[#E8D5A3]/60"
                  style={{
                    right: "50%",
                    width: `calc(50% - 70px)`,
                    height: "12px",
                  }}
                />
              </div>
              <div className="flex items-start gap-6 pt-3">
                {node.filhos.map((filho) => (
                  <div key={filho.id} className="flex flex-col items-center">
                    <div className="w-px h-3 bg-[#E8D5A3]/60" />
                    <NodeCard node={filho} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrganogramaTab({ funcionarios }: { funcionarios: Funcionario[] }) {
  const tree = useMemo(() => buildTree(funcionarios), [funcionarios]);

  if (funcionarios.length === 0) {
    return (
      <div className="text-center py-16 text-text-muted">
        <p className="text-sm">Cadastre funcionários com gestores para visualizar o organograma.</p>
      </div>
    );
  }

  const semGestor = funcionarios.filter((f) => !f.gestor_id || !funcionarios.find((g) => g.id === f.gestor_id));
  const comFilhos = funcionarios.filter((f) => funcionarios.some((g) => g.gestor_id === f.id));

  if (comFilhos.length === 0 && semGestor.length === funcionarios.length) {
    return (
      <div>
        <p className="text-sm text-text-muted mb-6">Defina os gestores de cada funcionário para gerar o organograma hierárquico.</p>
        <div className="flex flex-wrap gap-3">
          {funcionarios.map((f) => (
            <div key={f.id} className="bg-surface border border-[#E8D5A3]/50 rounded-card px-4 py-3 text-center shadow-sm min-w-[140px]">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center mx-auto mb-2">
                <span className="text-gold font-display font-bold text-sm">{f.nome.charAt(0)}</span>
              </div>
              <p className="font-semibold text-text-main text-xs">{f.nome}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{f.cargo}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-6">
      <div className="min-w-max">
        <div className="flex gap-12 justify-center">
          {tree.map((root) => (
            <NodeCard key={root.id} node={root} />
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mt-8 pt-4 border-t border-[#E8D5A3]/30 flex-wrap">
        {Object.entries({ ativo: "Ativo", ferias: "Férias", licenca: "Licença", inativo: "Inativo" }).map(([s, l]) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_CORES[s] }} />
            <span className="text-xs text-text-muted">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
