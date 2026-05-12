import { prisma } from "@/server/db/prisma";
import { readSessionCookie } from "@/server/auth/session";
export async function getCurrentUser() { const session = await readSessionCookie(); if (!session) return null; return prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, email: true } }); }
