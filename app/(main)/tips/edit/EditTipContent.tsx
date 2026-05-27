"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useTips, useTipMutations } from "@/hooks/useTips";
import TipEntryForm from "@/components/tips/TipEntryForm";

export default function EditTipContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { tips, loading } = useTips();
  const { updateTip } = useTipMutations();

  const id = searchParams.get("id");
  const tip = id ? tips.find((t) => t.id === id) : null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!tip) {
    return (
      <div className="mx-auto max-w-md px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Tip not found</h1>
        <p className="mt-2 text-gray-500">The tip you're looking for doesn't exist.</p>
        <button
          onClick={() => router.push("/tips")}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Back to All Tips
        </button>
      </div>
    );
  }

  const handleSubmit = async (values: any) => {
    if (!id) return;
    await updateTip(id, values);
    router.push("/tips");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Edit Tip</h1>
      <TipEntryForm initialData={tip} onSubmit={handleSubmit} />
    </div>
  );
}
