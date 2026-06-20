import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Mendonça & Co <onboarding@resend.dev>";

const FERRAMENTA_LABEL: Record<string, string> = {
  disc: "Perfil DISC",
  q12: "Pesquisa de Engajamento Q12",
  gptw: "Trust Index GPTW",
  diagnostico_3d: "Diagnóstico 3D",
  radar_360: "Radar de Diagnóstico 360",
  canvas_estrategico: "Canvas Estratégico",
  rodada_q12: "Rodada Q12",
  rodada_gptw: "Rodada GPTW",
};

export async function enviarEmailFollowup({
  nome, email, empresa, tipo, dias, pdfUrl,
}: {
  nome: string;
  email: string;
  empresa?: string | null;
  tipo: string;
  dias: 30 | 60 | 90;
  pdfUrl?: string | null;
}) {
  if (!process.env.RESEND_API_KEY) return { ok: false };

  const ferramenta = FERRAMENTA_LABEL[tipo] ?? tipo;
  const primeiroNome = nome.split(" ")[0];

  const marcos: Record<number, { titulo: string; foco: string; pergunta: string }> = {
    30: {
      titulo: "Primeiros 30 dias — Como está a implementação?",
      foco: "Os primeiros 30 dias são fundamentais para criar o hábito. Pequenas ações consistentes geram grandes resultados.",
      pergunta: "Quais ações do Plano de Ação você já implementou? O que está funcionando bem?",
    },
    60: {
      titulo: "60 dias — Revisão do progresso",
      foco: "Com 60 dias, já é possível ver os primeiros resultados concretos. Hora de ajustar o que não está funcionando.",
      pergunta: "Quais indicadores mudaram? Onde você sente mais resistência?",
    },
    90: {
      titulo: "90 dias — Ciclo completo de melhoria",
      foco: "Três meses é o ciclo ideal para consolidar novos comportamentos. Você completou um ciclo de melhoria contínua.",
      pergunta: "O que mudou na sua empresa nos últimos 90 dias? Está na hora de um novo diagnóstico?",
    },
  };

  const marco = marcos[dias];

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#0D2B2E;padding:32px 40px;">
          <p style="margin:0;color:#C9A84C;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Mendonça & Co</p>
          <h1 style="margin:8px 0 0;color:#FFFFFF;font-size:22px;font-weight:normal;line-height:1.3;">${marco.titulo}</h1>
        </td></tr>

        <!-- Marco badge -->
        <tr><td style="padding:24px 40px 0;">
          <span style="display:inline-block;background:#C9A84C;color:#0D2B2E;font-size:12px;font-weight:bold;padding:6px 14px;border-radius:20px;letter-spacing:1px;">
            ${dias} DIAS · ${ferramenta.toUpperCase()}
          </span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:24px 40px;">
          <p style="color:#1A1A1A;font-size:16px;margin:0 0 16px;">Olá, <strong>${primeiroNome}</strong>${empresa ? ` da <strong>${empresa}</strong>` : ""}!</p>
          <p style="color:#4A4A4A;font-size:15px;line-height:1.7;margin:0 0 20px;">
            Já se passaram <strong>${dias} dias</strong> desde que você realizou o <strong>${ferramenta}</strong> com a Mendonça & Co.
          </p>
          <div style="background:#F5F0E8;border-left:4px solid #C9A84C;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
            <p style="color:#0D2B2E;font-size:14px;line-height:1.6;margin:0 0 8px;font-style:italic;">${marco.foco}</p>
            <p style="color:#6B6B6B;font-size:13px;margin:0;"><strong>Reflexão:</strong> ${marco.pergunta}</p>
          </div>
          <p style="color:#4A4A4A;font-size:15px;line-height:1.7;margin:0 0 20px;">
            Quer conversar sobre os resultados? Agende uma sessão de revisão e vamos ajustar o Plano de Ação juntos.
          </p>
        </td></tr>

        <!-- CTAs -->
        <tr><td style="padding:0 40px 32px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;">
                <a href="https://cal.com/mendonca-co" style="display:inline-block;background:#C9A84C;color:#0D2B2E;padding:14px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:bold;">
                  Agendar sessão de revisão
                </a>
              </td>
              ${pdfUrl ? `<td>
                <a href="${pdfUrl}" style="display:inline-block;border:2px solid #C9A84C;color:#C9A84C;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:bold;">
                  Ver meu relatório
                </a>
              </td>` : ""}
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0D2B2E;padding:20px 40px;">
          <p style="margin:0;color:#FFFFFF60;font-size:12px;">
            Mendonça & Co · guilherme@mendonca.co<br>
            <span style="color:#FFFFFF40;">Você recebe este e-mail por ter realizado um diagnóstico conosco.</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `[${dias} dias] ${marco.titulo} — Mendonça & Co`,
    html,
  });

  return { ok: !error, error };
}
