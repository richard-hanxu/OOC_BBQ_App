import { AVATARS } from "@/lib/avatars";
import { QUESTIONS } from "@/lib/questions";
import { isAdmin } from "@/lib/server/auth";
import { getStore } from "@/lib/store";
import { ACTIVITIES } from "@/lib/types";

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const store = await getStore();
  const people = await store.listParticipants();

  const header = [
    "id",
    "first_name",
    "last_name",
    "phone",
    "email",
    "undergraduate_university",
    "graduate_university",
    "cmu_program",
    "avatar",
    "quiz_completed_at",
    "is_seed",
    "created_at",
    ...ACTIVITIES.map((a) => `activity_${a.id}`),
    ...QUESTIONS.flatMap((q) => [`${q.id}_value`, `${q.id}_display`]),
  ];

  const rows = people.map((p) => [
    p.id,
    p.firstName,
    p.lastName,
    p.phone,
    p.email,
    p.undergraduateUniversity,
    p.graduateUniversity,
    p.cmuProgram,
    p.avatarType ? AVATARS[p.avatarType].name : "",
    p.quizCompletedAt,
    p.isSeed ? "yes" : "no",
    p.createdAt,
    ...ACTIVITIES.map((a) => (p.activities.includes(a.id) ? "yes" : "no")),
    ...QUESTIONS.flatMap((q) => [p.answers[q.id]?.normalized ?? "", p.answers[q.id]?.display ?? ""]),
  ]);

  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="party-participants-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
