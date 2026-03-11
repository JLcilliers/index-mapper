"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ClassifyButtonProps {
  projectRunId: string;
}

export function ClassifyButton({ projectRunId }: ClassifyButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClassify() {
    setLoading(true);

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectRunId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Classification failed");
      }

      const result = await response.json();
      toast.success(`Classified ${result.processed} URLs`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Classification failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClassify} disabled={loading} size="sm">
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Classifying...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Classify URLs
        </>
      )}
    </Button>
  );
}
