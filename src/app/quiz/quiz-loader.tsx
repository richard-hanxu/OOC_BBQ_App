"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui-bits";

/** The quiz reads its draft from localStorage, so it only renders on the client. */
const Quiz = dynamic(() => import("./quiz").then((m) => m.Quiz), {
  ssr: false,
  loading: () => (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-5 pt-5">
      <Skeleton className="h-8 w-24 self-center" />
      <Skeleton className="h-2" />
      <Skeleton className="mt-6 h-24" />
      <Skeleton className="mt-auto mb-6 h-40" />
    </main>
  ),
});

export function QuizLoader({ firstName }: { firstName: string }) {
  return <Quiz firstName={firstName} />;
}
