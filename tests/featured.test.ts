import test from "node:test";
import assert from "node:assert/strict";
import { nextFeaturedRank } from "../lib/catalog/featured.ts";

test("destaques: pega a primeira posição livre e para em 4", () => {
  assert.equal(nextFeaturedRank([]), 1);
  assert.equal(nextFeaturedRank([1, 2]), 3);
  assert.equal(nextFeaturedRank([1, 3, null]), 2);
  assert.equal(nextFeaturedRank([1, 2, 3, 4]), null);
});
