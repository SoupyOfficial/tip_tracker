"use client";

import { useRouter } from "next/navigation";
import TipEntryForm from "@/components/tips/TipEntryForm";
import { useTipMutations } from "@/hooks/useTips";
import type { TipEntryFormValues } from "@/lib/validations";

export default function AddTipPage() {
  const router = useRouter();
  const { addTip } = useTipMutations();

  const handleSubmit = async (values: TipEntryFormValues) => {
    await addTip(values);
    router.push("/tips");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Add Tip</h1>
      <TipEntryForm onSubmit={handleSubmit} />
    </div>
  );
}
