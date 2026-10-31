import test from "node:test";
import assert from "node:assert/strict";
import {
  bannerHref,
  bannerKey,
  commonRatio,
  detectDevice,
  guessCategory,
  normalizeBannerLink,
  planBanners,
} from "../lib/store/banners.ts";

const categories = [
  { slug: "iphone", name: "iPhone" },
  { slug: "ipad", name: "iPad e Tablets" },
  { slug: "smartphones", name: "Smartphones" },
  { slug: "bombox", name: "Bombox" },
  { slug: "starlink", name: "Starlink" },
];

test("descobre a tela pelo nome, pela pasta e pela proporção", () => {
  assert.equal(detectDevice("banner-iphone-mobile.jpg", 1920, 700), "mobile");
  assert.equal(detectDevice("Banner iPhone - Desktop.png", 1080, 1350), "desktop");
  assert.equal(detectDevice("banners/tablet/iphone.jpg", 1920, 700), "tablet");
  assert.equal(detectDevice("iphone.jpg", 1920, 700), "desktop");
  assert.equal(detectDevice("iphone.jpg", 1080, 1350), "mobile");
  assert.equal(detectDevice("iphone.jpg", 1536, 1024), "tablet");
  // "iPad" é nome de produto, não a tela.
  assert.equal(detectDevice("banner-ipad-desktop.jpg", 1000, 1000), "desktop");
});

test("junta as versões do mesmo banner", () => {
  assert.equal(bannerKey("Banner iPhone - Mobile 1080x1350.jpg"), "iphone");
  assert.equal(bannerKey("banner-iphone-desktop.png"), "iphone");
  assert.equal(bannerKey("banners/celular/2-jbl.jpg", ["banners"]), "2-jbl");
  assert.equal(bannerKey("iphone/desktop.jpg"), "iphone");
});

test("sugere a categoria do link", () => {
  assert.equal(guessCategory("iphone-17", categories)?.slug, "iphone");
  assert.equal(guessCategory("ipad", categories)?.slug, "ipad");
  assert.equal(guessCategory("jbl-partybox", categories)?.slug, "bombox");
  assert.equal(guessCategory("samsung-galaxy", categories)?.slug, "smartphones");
  assert.equal(guessCategory("promocao", categories), null);
});

test("monta os banners de uma pasta com 3 telas cada", () => {
  const f = (path: string, width: number, height: number) => ({ file: path, path, width, height });
  const plan = planBanners(
    [
      f("Banners/iphone-desktop.jpg", 1920, 700),
      f("Banners/iphone-tablet.jpg", 1536, 1024),
      f("Banners/iphone-mobile.jpg", 1080, 1350),
      f("Banners/jbl-desktop.jpg", 1920, 700),
      f("Banners/jbl-mobile.jpg", 1080, 1350),
      f("Banners/jbl-mobile (1).jpg", 1080, 1350),
    ],
    categories,
  );
  assert.equal(plan.length, 2);
  const iphone = plan.find((g) => g.key === "iphone")!;
  assert.deepEqual(Object.keys(iphone.versions).sort(), ["desktop", "mobile", "tablet"]);
  assert.equal(iphone.link, "?categoria=iphone#vitrine");
  assert.equal(iphone.title, "iPhone");
  const jbl = plan.find((g) => g.key === "jbl")!;
  assert.equal(jbl.link, "?categoria=bombox#vitrine");
  assert.equal(jbl.versions.tablet, undefined);
  assert.equal(jbl.extra.length, 1);
});

test("só aceita link seguro", () => {
  assert.equal(normalizeBannerLink("?categoria=iphone#vitrine"), "?categoria=iphone#vitrine");
  assert.equal(normalizeBannerLink("/produto/apple-iphone-16"), "/produto/apple-iphone-16");
  assert.equal(normalizeBannerLink("https://regtechcellshop.com.br/?q=jbl"), "https://regtechcellshop.com.br/?q=jbl");
  assert.equal(normalizeBannerLink("javascript:alert(1)"), null);
  assert.equal(normalizeBannerLink("//evil.com"), null);
  assert.equal(normalizeBannerLink("http://x.com"), null);
  assert.equal(normalizeBannerLink(""), null);
});

test("endereço final do banner no domínio da loja e no caminho /cellshop", () => {
  assert.equal(bannerHref("?categoria=iphone#vitrine", "/"), "/?categoria=iphone#vitrine");
  assert.equal(bannerHref("?categoria=iphone#vitrine", "/cellshop"), "/cellshop?categoria=iphone#vitrine");
  assert.equal(bannerHref("/produto/x", "/cellshop"), "/cellshop/produto/x");
  assert.equal(bannerHref(null, "/"), null);
});

test("nome de produto não é confundido com a tela", () => {
  const f = (path: string, width: number, height: number) => ({ file: path, path, width, height });
  const plan = planBanners(
    [
      f("banner-smartphone-desktop.jpg", 1920, 700),
      f("banner-smartphone-tablet.jpg", 1536, 1024),
      f("banner-smartphone-mobile.jpg", 1080, 1350),
    ],
    categories,
  );
  assert.equal(plan.length, 1);
  assert.equal(plan[0].key, "smartphone");
  assert.deepEqual(Object.keys(plan[0].versions).sort(), ["desktop", "mobile", "tablet"]);
  assert.equal(plan[0].link, "?categoria=smartphones#vitrine");
  // Sem a tela escrita, a palavra fraca ainda vale.
  assert.equal(detectDevice("iphone-phone.jpg", 1920, 700), "mobile");
});

test("proporção mais comum", () => {
  assert.equal(commonRatio([{ width: 1920, height: 700 }, { width: 1920, height: 700 }, { width: 1080, height: 1350 }]), 2.74);
  assert.equal(commonRatio([{ width: null, height: null }]), null);
});
