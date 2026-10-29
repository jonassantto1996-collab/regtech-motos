import { after } from "next/server";
import { getSiteUrl } from "@/lib/site-url";

/**
 * IndexNow: avisa o Bing (e outros buscadores parceiros) na hora em que uma
 * página do site muda, em vez de esperar o robô passar sozinho. O Bing é a
 * base de busca do ChatGPT, então isso acelera a loja aparecer por lá.
 *
 * A chave pública fica em /public/355e046f65246e72c85052b8216cdae3.txt (exigência do IndexNow para
 * provar que o site é nosso).
 */
export const INDEXNOW_KEY = "355e046f65246e72c85052b8216cdae3";

export function notifySearchEngines(paths: string[]) {
  // Só o site oficial avisa os buscadores. Prévias e testes não.
  if (process.env.VERCEL_ENV !== "production") return;

  const siteUrl = getSiteUrl();
  const host = new URL(siteUrl).host;
  const urlList = [...new Set(paths)].map((path) => `${siteUrl}${path}`);
  if (urlList.length === 0) return;

  // Roda depois da resposta: nunca atrasa nem quebra o painel.
  after(async () => {
    try {
      await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host,
          key: INDEXNOW_KEY,
          keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
          urlList,
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Silencioso: se o aviso falhar, o Bing ainda lê o site pelo mapa do site.
    }
  });
}
