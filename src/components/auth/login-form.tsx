"use client";
import { useActionState } from "react";
import { loginAction, type LoginFormState } from "@/app/actions/login";
const initialState: LoginFormState = {};
export function LoginForm() { const [state, formAction, isPending] = useActionState(loginAction, initialState); return <form action={formAction} style={{ marginTop:"1rem", display:"grid", gap:"0.75rem" }}><label htmlFor="email">Email or handle</label><input id="email" name="email" type="text" required data-testid="login-email-input" disabled={isPending} /><label htmlFor="betaAccessCode">Beta access code</label><input id="betaAccessCode" name="betaAccessCode" type="password" required data-testid="login-beta-code-input" disabled={isPending} />{state.error ? <p className="form-error" data-testid="login-error" role="alert" aria-live="assertive" aria-atomic="true">{state.error}</p> : null}<button type="submit" data-testid="login-submit-button" disabled={isPending}>{isPending ? "Signing in..." : "Sign in"}</button></form>; }
