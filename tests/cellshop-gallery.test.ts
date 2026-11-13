import test from "node:test";
import assert from "node:assert/strict";
import { slideFromScroll, stepSlide } from "../lib/cellshop/gallery.ts";

test("galeria: foto pela posição da rolagem", () => {
  assert.equal(slideFromScroll(0, 400, 4), 0);
  assert.equal(slideFromScroll(190, 400, 4), 0);
  assert.equal(slideFromScroll(210, 400, 4), 1);
  assert.equal(slideFromScroll(1200, 400, 4), 3);
  assert.equal(slideFromScroll(5000, 400, 4), 3);
  assert.equal(slideFromScroll(100, 0, 4), 0);
  assert.equal(slideFromScroll(100, 400, 0), 0);
});

test("galeria: setas não passam do começo nem do fim", () => {
  assert.equal(stepSlide(0, -1, 4), 0);
  assert.equal(stepSlide(0, 1, 4), 1);
  assert.equal(stepSlide(3, 1, 4), 3);
  assert.equal(stepSlide(2, -1, 4), 1);
  assert.equal(stepSlide(0, 1, 0), 0);
});
