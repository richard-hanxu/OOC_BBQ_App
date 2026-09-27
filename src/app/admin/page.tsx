import type { Metadata } from "next";
import { adminConfigured, isAdmin } from "@/lib/server/auth";
import { AdminDashboard } from "./admin-dashboard";
import { AdminLogin } from "./admin-login";

export const metadata: Metadata = { title: "Organizer" };

export default async function AdminPage() {
  const authed = await isAdmin();
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-6">
      {authed ? <AdminDashboard /> : <AdminLogin configured={adminConfigured()} />}
    </main>
  );
}
