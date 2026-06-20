import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Trocar para "Mendonça & Co <noreply@mendonca.co>" após verificar domínio no Resend
const FROM = "Mendonça & Co <onboarding@resend.dev>";

type TipoFerramenta =
  | "diagnostico_3d"
  | "radar_360"
  | "disc"
  | "q12"
  | "gptw"
  | "canvas_estrategico";

const TITULOS: Record<TipoFerramenta, string> = {
  diagnostico_3d: "Diagnóstico 3D",
  radar_360: "Radar 360",
  disc: "Perfil DISC",
  q12: "Pesquisa de Engajamento Q12",
  gptw: "Trust Index GPTW",
  canvas_estrategico: "Canvas Estratégico",
};

const DESCRICOES: Record<TipoFerramenta, string> = {
  diagnostico_3d:
    "Seu diagnóstico de liderança nas três dimensões — Disciplina, Direção e Domínio — está pronto. O PDF inclui seu radar, a análise da Matriz de Maturidade e um plano de ação com ações concretas para evoluir.",
  radar_360:
    "Seu Radar 360 está pronto. O relatório traz sua pontuação nas 8 dimensões do negócio, sua Porta de Entrada estratégica e as ações prioritárias para cada dimensão crítica.",
  disc:
    "Seu Perfil DISC está pronto. O relatório detalha seu perfil comportamental dominante, seus pontos fortes, pontos de atenção e um plano de desenvolvimento como líder.",
  q12:
    "Sua Pesquisa Q12 está pronta. O relatório mostra seu índice de engajamento por dimensão e as ações prioritárias para construir um ambiente de alta performance.",
  gptw:
    "Seu Trust Index GPTW está pronto. O relatório apresenta o índice de confiança organizacional e um plano de ação cultural por dimensão — Credibilidade, Respeito, Imparcialidade, Orgulho e Camaradagem.",
  canvas_estrategico:
    "Seu Canvas Estratégico está pronto. O documento reúne suas respostas nas 6 dimensões estratégicas e uma análise personalizada para clareza e foco nos próximos movimentos.",
};

function htmlEmail(nome: string, tipo: TipoFerramenta, pdfUrl: string): string {
  const titulo = TITULOS[tipo];
  const descricao = DESCRICOES[tipo];
  const primeiroNome = nome.split(" ")[0];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo} — Mendonça & Co</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0D2B2E;border-radius:12px 12px 0 0;padding:40px 48px;">
              <p style="margin:0 0 4px;color:#C9A84C;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Mendonça & Co</p>
              <p style="margin:0;color:#E8D5A3;font-size:13px;opacity:0.7;">Consultoria de Board e Cultura Organizacional</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#FFFFFF;padding:48px;">
              <p style="margin:0 0 24px;font-size:26px;font-weight:700;color:#0D2B2E;line-height:1.3;">
                ${primeiroNome}, seu ${titulo} está pronto.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#4A4A4A;line-height:1.8;">
                ${descricao}
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td style="background:#C9A84C;border-radius:8px;">
                    <a href="${pdfUrl}" target="_blank"
                      style="display:inline-block;padding:16px 32px;color:#0D2B2E;font-size:15px;font-weight:700;text-decoration:none;font-family:Georgia,serif;">
                      Baixar PDF →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#6B6B6B;line-height:1.7;">
                O link acima abre o PDF diretamente. Se tiver problemas, copie e cole no navegador:
              </p>
              <p style="margin:0 0 32px;font-size:11px;color:#9B9B9B;word-break:break-all;">${pdfUrl}</p>

              <!-- Separator -->
              <hr style="border:none;border-top:1px solid #E8D5A3;margin:32px 0;" />

              <p style="margin:0 0 8px;font-size:14px;color:#0D2B2E;font-weight:700;">
                Quer conversar sobre os resultados?
              </p>
              <p style="margin:0 0 16px;font-size:14px;color:#4A4A4A;line-height:1.7;">
                Estou disponível para uma conversa de 30 minutos sobre o que o diagnóstico revelou e qual seria o próximo passo mais inteligente para o seu negócio.
              </p>
              <p style="margin:0;font-size:14px;color:#0D2B2E;">
                <a href="mailto:guilherme@mendonca.co" style="color:#C9A84C;text-decoration:none;font-weight:700;">guilherme@mendonca.co</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0D2B2E;border-radius:0 0 12px 12px;padding:24px 48px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#E8D5A3;opacity:0.5;">
                © Mendonça & Co · Este documento é confidencial e destinado exclusivamente a ${nome}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function enviarEmailPDF({
  nome,
  email,
  tipo,
  pdfUrl,
}: {
  nome: string;
  email: string;
  tipo: TipoFerramenta;
  pdfUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY não configurada — e-mail não enviado.");
    return { ok: false, error: "RESEND_API_KEY não configurada" };
  }

  const titulo = TITULOS[tipo];

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Seu ${titulo} está pronto — Mendonça & Co`,
      html: htmlEmail(nome, tipo, pdfUrl),
    });

    if (error) {
      console.error("Resend error:", error);
      return { ok: false, error };
    }

    return { ok: true };
  } catch (err) {
    console.error("Falha ao enviar e-mail:", err);
    return { ok: false, error: err };
  }
}
