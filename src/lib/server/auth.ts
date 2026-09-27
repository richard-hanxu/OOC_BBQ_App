import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getStore } from "../store";
import type { Participant } from "../types";

export const PARTICIPANT_COOKIE = "pp_token";
export const ADMIN_COOKIE = "pp_admin";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken() {
  return randomBytes(24).toString("base64url");
}

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function setParticipantCookie(token: string) {
  (await cookies()).set(PARTICIPANT_COOKIE, token, { ...cookieBase, maxAge: ONE_YEAR });
}

export async function clearParticipantCookie() {
  (await cookies()).set(PARTICIPANT_COOKIE, "", { ...cookieBase, maxAge: 0 });
}

/** Resolve the participant for the current request, or null. */
export async function currentParticipant(): Promise<Participant | null> {
  const token = (await cookies()).get(PARTICIPANT_COOKIE)?.value;
  if (!token) return null;
  const store = await getStore();
  return store.getParticipantByTokenHash(hashToken(token));
}

// --- organizer access ------------------------------------------------------

function adminSecret() {
  return process.env.ADMIN_PASSWORD || "";
}

function adminSignature() {
  return createHmac("sha256", `admin-cookie:${adminSecret()}`).update("ok").digest("hex");
}

export function adminConfigured() {
  return adminSecret().length > 0;
}

export function checkAdminPassword(candidate: string) {
  const secret = adminSecret();
  if (!secret) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setAdminCookie() {
  (await cookies()).set(ADMIN_COOKIE, adminSignature(), { ...cookieBase, maxAge: 60 * 60 * 12 });
}

export async function clearAdminCookie() {
  (await cookies()).set(ADMIN_COOKIE, "", { ...cookieBase, maxAge: 0 });
}

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!value) return false;
  const expected = adminSignature();
  return value.length === expected.length && timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}
