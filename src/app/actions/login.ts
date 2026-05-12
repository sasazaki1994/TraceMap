"use server";

import { redirect } from "next/navigation";

import { loginWithBetaAccess } from "@/server/auth/beta-auth";
import { writeSessionCookie } from "@/server/auth/session";

export type LoginFormState = { error?: string };

export async function loginAction(_prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const email = formData.get("email");
  const code = formData.get("betaAccessCode");
  if (typeof email !== "string" || typeof code !== "string") {
    return { error: "Invalid login credentials." };
  }

  try {
    const user = await loginWithBetaAccess({ email, accessCode: code });
    await writeSessionCookie({ userId: user.id, email: user.email });
  } catch (cause) {
    console.error("[auth] loginAction failed", {
      email: email.trim().toLowerCase(),
      operation: "loginWithBetaAccess/writeSessionCookie",
      cause,
    });
    return { error: "Invalid login credentials." };
  }

  redirect("/");
}
