import { AppError } from "./errors.js";
import { validateProxyUrl } from "./proxy.js";

function isAuthError(message: string): boolean {
  return (
    message.includes("ERR_INVALID_AUTH_CREDENTIALS") ||
    message.includes("401") ||
    message.includes("403")
  );
}

export async function capturePageScreenshot(
  rawUrl: string,
  width: number,
  credentials?: { user: string; pass: string } | null,
): Promise<Buffer> {
  const targetUrl = validateProxyUrl(rawUrl);
  const { default: puppeteer } = await import("puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: Math.max(320, Math.min(width, 1920)),
      height: 900,
    });

    if (credentials) {
      await page.authenticate({
        username: credentials.user,
        password: credentials.pass,
      });
    }

    try {
      await page.goto(targetUrl.href, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isAuthError(message)) {
        throw new AppError(
          credentials
            ? "Staging-inloggegevens werden geweigerd. Controleer gebruikersnaam en wachtwoord."
            : "Deze site vereist HTTP Basic Auth. Vul staging-toegang in om een screenshot te maken.",
          401,
        );
      }
      throw error;
    }

    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
    });

    return Buffer.from(screenshot);
  } finally {
    await browser.close();
  }
}
