import test from "node:test";
import assert from "node:assert/strict";
import { isRecoverySession, recoveryAllowedPath } from "../lib/admin/recovery-session.ts";

test("link de recuperação é reconhecido pelo amr do token", () => {
  assert.equal(isRecoverySession({ amr: [{ method: "recovery", timestamp: 1 }] }), true);
  assert.equal(isRecoverySession({ amr: [{ method: "invite", timestamp: 1 }] }), true);
  assert.equal(isRecoverySession({ amr: ["recovery"] }), true);
});

test("login normal com senha não é recuperação", () => {
  assert.equal(isRecoverySession({ amr: [{ method: "password", timestamp: 1 }] }), false);
  assert.equal(isRecoverySession({}), false);
  assert.equal(isRecoverySession(null), false);
  assert.equal(isRecoverySession({ amr: "recovery" }), false);
});

test("na recuperação só a tela de nova senha e o retorno do link ficam liberados", () => {
  assert.equal(recoveryAllowedPath("/admin/reset-password"), true);
  assert.equal(recoveryAllowedPath("/admin/auth/callback"), true);
  assert.equal(recoveryAllowedPath("/admin"), false);
  assert.equal(recoveryAllowedPath("/admin/products"), false);
});
