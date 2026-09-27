"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProfileForm } from "@/components/profile-form";
import { useParty } from "@/components/party-provider";
import { Skeleton } from "@/components/ui-bits";

export default function EditProfilePage() {
  const { data, refresh } = useParty();
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  if (!data) return <Skeleton className="h-96" />;

  return (
    <div>
      <Link href="/me" className="text-sm font-bold text-muted-foreground">
        ← Back
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold">Edit profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your quiz answers and party type stay locked. Ask the organizer if you need a reset.</p>
      <div className="mt-5">
        <ProfileForm
          existing={data.me}
          submitLabel={saved ? "Saved ✓" : "Save changes"}
          onSaved={async () => {
            setSaved(true);
            await refresh();
            router.push("/me");
          }}
        />
      </div>
    </div>
  );
}
