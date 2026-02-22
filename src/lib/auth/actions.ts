"use server";

import { signIn, signOut } from "@/auth";

export async function loginWithGoogle(callbackUrl?: string) {
  await signIn("google", { redirectTo: callbackUrl || "/" });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
