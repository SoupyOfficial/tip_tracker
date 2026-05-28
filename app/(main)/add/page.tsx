"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TipEntryForm from "@/components/tips/TipEntryForm";
import { useTipMutations } from "@/hooks/useTips";
import type { TipEntryFormValues } from "@/lib/validations";

export default function AddTipPage() {
  const router = useRouter();
  const { addTip } = useTipMutations();
  const [defaultQuickAdd, setDefaultQuickAdd] = useState(true);

  useEffect(() => {
    const mode = new URL(window.location.href).searchParams.get('mode');
    setDefaultQuickAdd(mode !== 'full');
  }, []);

  const handleSubmit = async (values: TipEntryFormValues) => {
    await addTip(values);
    router.push("/tips");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8">
      <h1 className="mb-6 text-2xl font-bold">Add Tip</h1>
      <TipEntryForm onSubmit={handleSubmit} defaultQuickAdd={defaultQuickAdd} />
    </div>
  );
}
