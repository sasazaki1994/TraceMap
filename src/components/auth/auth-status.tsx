import Link from "next/link";
import { logoutAction } from "@/app/actions/logout";
import { getCurrentUser } from "@/server/auth/current-user";
export async function AuthStatus() { const user = await getCurrentUser(); if (!user) return <p data-testid="auth-status" className="muted">Not signed in. <Link href="/login">Sign in</Link></p>; return <div data-testid="auth-status" style={{ display:"flex", gap:12, alignItems:"center", marginTop:"0.75rem" }}><span className="muted">Signed in as {user.email}</span><form action={logoutAction}><button type="submit" data-testid="logout-button">Logout</button></form></div>; }
