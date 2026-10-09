import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";

const SESSION_NAME = "laf-admin-session";
const SESSION_MAX_AGE = 60 * 60 * 8;

function getSessionConfig() {
  const password = process.env["SESSION_SECRET"];
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET precisa ter pelo menos 32 caracteres.");
  }

  return {
    name: SESSION_NAME,
    password,
    maxAge: SESSION_MAX_AGE,
    cookie: {
      httpOnly: true,
      sameSite: "strict" as const,
      secure: process.env["NODE_ENV"] === "production",
      path: "/",
    },
  };
}

async function matchesSecret(candidate: string, expected: string) {
  const encoder = new TextEncoder();
  const [candidateHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(candidate)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const candidateBytes = new Uint8Array(candidateHash);
  const expectedBytes = new Uint8Array(expectedHash);
  let difference = 0;

  for (let index = 0; index < candidateBytes.length; index++) {
    difference |= candidateBytes[index]! ^ expectedBytes[index]!;
  }

  return difference === 0;
}

export const loginAdmin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      displayName: z.string().trim().min(1).max(80),
      password: z.string().min(1).max(8),
    }),
  )
  .handler(async ({ data }) => {
    const adminEmail = process.env["ADMIN_EMAIL"];
    const adminPassword = process.env["ADMIN_PASSWORD"];
    if (!adminEmail) {
      throw new Error("Configure ADMIN_EMAIL no ambiente do servidor.");
    }
    if (!adminPassword || adminPassword.length > 8) {
      throw new Error("Configure ADMIN_PASSWORD com no máximo 8 caracteres.");
    }

    const emailMatches = data.email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
    const passwordMatches = await matchesSecret(data.password, adminPassword);
    if (!emailMatches || !passwordMatches) {
      return { authenticated: false };
    }

    const session = await useSession<{ isAdmin: boolean; displayName: string }>(
      getSessionConfig(),
    );
    await session.update({ isAdmin: true, displayName: data.displayName });
    return { authenticated: true };
  });

export const getAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<{ isAdmin: boolean; displayName: string }>(getSessionConfig());
  return session.data.isAdmin === true
    ? { authenticated: true, nome: session.data.displayName || "Administrador" }
    : null;
});

export const requireAdminSession = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<{ isAdmin: boolean }>(getSessionConfig());
  if (session.data.isAdmin !== true) {
    throw new Error("Acesso restrito ao administrador.");
  }
  return { authenticated: true };
});

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<{ isAdmin: boolean }>(getSessionConfig());
  await session.clear();
  return { authenticated: false };
});
