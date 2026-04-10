import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { query } from "./db";

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const rows = await query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [payload.userId],
    );
    return rows[0] || null;
  } catch {
    return null;
  }
}
