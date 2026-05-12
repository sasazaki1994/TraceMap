import { createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { cookies } from "next/headers";
const SESSION_COOKIE_NAME = "tracemap_session";
const DEV_SESSION_SECRET = "tracemap-dev-session-secret";
type SessionPayload = { userId: string; email: string };
function resolveSessionSecret(): string { const secret = process.env.TRACEMAP_SESSION_SECRET?.trim(); if (secret) return secret; if (process.env.NODE_ENV === "production") throw new Error("TRACEMAP_SESSION_SECRET is required in production."); return DEV_SESSION_SECRET; }
function sign(value: string): string { return createHmac("sha256", resolveSessionSecret()).update(value).digest("base64url"); }
function encode(payload: SessionPayload): string { const body = Buffer.from(JSON.stringify(payload)).toString("base64url"); return `${body}.${sign(body)}`; }
function decode(token: string): SessionPayload | null { const [body, signature] = token.split("."); if (!body || !signature) return null; const expected = sign(body); const a = Buffer.from(signature); const b = Buffer.from(expected); if (a.length !== b.length || !timingSafeEqual(a,b)) return null; try { const p = JSON.parse(Buffer.from(body,"base64url").toString("utf8")) as Partial<SessionPayload>; if (typeof p.userId!=="string"||typeof p.email!=="string") return null; return {userId:p.userId,email:p.email}; } catch { return null; } }
export async function writeSessionCookie(payload: SessionPayload): Promise<void> { const jar = await cookies(); jar.set(SESSION_COOKIE_NAME, encode(payload), { httpOnly:true, sameSite:"lax", secure: process.env.NODE_ENV === "production", path:"/" }); }
export async function clearSessionCookie(): Promise<void> { const jar = await cookies(); jar.set(SESSION_COOKIE_NAME, "", { httpOnly:true, sameSite:"lax", secure: process.env.NODE_ENV === "production", path:"/", maxAge:0 }); }
export async function readSessionCookie(): Promise<SessionPayload | null> { const jar = await cookies(); const raw = jar.get(SESSION_COOKIE_NAME)?.value; return raw ? decode(raw) : null; }
