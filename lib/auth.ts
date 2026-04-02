import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "votesecure-dev-secret-change-in-production"
);

export async function signAdminToken(payload: { username: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { username: string };
  } catch {
    return null;
  }
}
