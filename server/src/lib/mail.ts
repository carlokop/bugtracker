interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function getMailConfig() {
  const apiKey = process.env.MAILGUN_API_KEY?.trim();
  const domain = process.env.MAILGUN_DOMAIN?.trim();
  const from = process.env.MAIL_FROM?.trim();
  const apiBase =
    process.env.MAILGUN_API_BASE?.trim() ?? "https://api.eu.mailgun.net";

  return { apiKey, domain, from, apiBase };
}

export function isMailConfigured(): boolean {
  const { apiKey, domain, from } = getMailConfig();
  return Boolean(apiKey && domain && from);
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const { apiKey, domain, from, apiBase } = getMailConfig();

  if (!apiKey || !domain || !from) {
    throw new Error(
      "Mailgun is niet geconfigureerd (MAILGUN_API_KEY, MAILGUN_DOMAIN, MAIL_FROM)",
    );
  }

  const body = new URLSearchParams();
  body.set("from", from);
  body.set("to", input.to);
  body.set("subject", input.subject);
  body.set("text", input.text);
  if (input.html) body.set("html", input.html);

  const response = await fetch(`${apiBase}/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Mailgun verzoek mislukt (${response.status})${detail ? `: ${detail}` : ""}`,
    );
  }
}
