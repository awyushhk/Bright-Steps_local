import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

export default async function DashboardPage() {
  const user = await getAuthUser();

  if (!user) redirect("/sign-in");

  const role = user.role;

  if (role === "parent") redirect("/dashboard/parent");
  if (role === "clinician") redirect("/dashboard/clinician");

  // fallback only if truly no role
  redirect("/sign-up?role=parent");
}
