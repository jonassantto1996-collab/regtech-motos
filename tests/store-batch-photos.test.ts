import test from "node:test";
import assert from "node:assert/strict";
import { matchFileName, normalizeFileBase, planBatch, type BatchProduct } from "../lib/store/batch-photos.ts";

const slugs = new Set(["samsung-galaxy-a17", "xiaomi-redmi-pad-2", "tomate-power-bank-60000-tk6100", "realme-c75-5g"]);

test("normaliza nome do arquivo", () => {
  assert.equal(normalizeFileBase("Samsung Galaxy A17 (1).JPG"), "samsung-galaxy-a17-1");
  assert.equal(normalizeFileBase("xiaomi_redmi_pad_2.png"), "xiaomi-redmi-pad-2");
  assert.equal(normalizeFileBase("Câmera ação.webp"), "camera-acao");
});

test("acha o produto com e sem número da foto", () => {
  assert.deepEqual(matchFileName("samsung-galaxy-a17-1.jpg", slugs), { slug: "samsung-galaxy-a17", order: 1 });
  assert.deepEqual(matchFileName("samsung-galaxy-a17.jpg", slugs), { slug: "samsung-galaxy-a17", order: 0 });
  assert.deepEqual(matchFileName("SAMSUNG-GALAXY-A17-12.jpeg", slugs), { slug: "samsung-galaxy-a17", order: 12 });
});

test("código que já termina em número não é confundido com o número da foto", () => {
  assert.deepEqual(matchFileName("xiaomi-redmi-pad-2.jpg", slugs), { slug: "xiaomi-redmi-pad-2", order: 0 });
  assert.deepEqual(matchFileName("xiaomi-redmi-pad-2-3.jpg", slugs), { slug: "xiaomi-redmi-pad-2", order: 3 });
  assert.deepEqual(matchFileName("realme-c75-5g-2.jpg", slugs), { slug: "realme-c75-5g", order: 2 });
  assert.deepEqual(matchFileName("tomate-power-bank-60000-tk6100-1.jpg", slugs), { slug: "tomate-power-bank-60000-tk6100", order: 1 });
});

test("nome desconhecido fica de fora", () => {
  assert.equal(matchFileName("galaxy-a17.jpg", slugs), null);
  assert.equal(matchFileName("IMG_2024.jpg", slugs), null);
  assert.equal(matchFileName(".jpg", slugs), null);
});

test("agrupa por produto, ordena pelas fotos e respeita o limite de 12", () => {
  const products: BatchProduct[] = [
    { id: "a", slug: "samsung-galaxy-a17", label: "Samsung Galaxy A17", imageCount: 10 },
    { id: "b", slug: "xiaomi-redmi-pad-2", label: "Xiaomi Redmi Pad 2", imageCount: 0 },
  ];
  const files = ["samsung-galaxy-a17-3.jpg", "samsung-galaxy-a17-1.jpg", "samsung-galaxy-a17-2.jpg", "xiaomi-redmi-pad-2-2.jpg", "xiaomi-redmi-pad-2-1.jpg", "foto.jpg"]
    .map((name) => ({ file: name, name }));
  const plan = planBatch(files, products);
  assert.deepEqual(plan.unmatched, ["foto.jpg"]);
  const a17 = plan.groups.find((g) => g.product.id === "a")!;
  assert.deepEqual(a17.items.map((i) => i.fileName), ["samsung-galaxy-a17-1.jpg", "samsung-galaxy-a17-2.jpg"]);
  assert.deepEqual(a17.overflow.map((i) => i.fileName), ["samsung-galaxy-a17-3.jpg"]);
  const pad = plan.groups.find((g) => g.product.id === "b")!;
  assert.deepEqual(pad.items.map((i) => i.fileName), ["xiaomi-redmi-pad-2-1.jpg", "xiaomi-redmi-pad-2-2.jpg"]);
});
