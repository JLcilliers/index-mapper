"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CrawlButtonProps {
  projectRunId: string;
}

export function CrawlButton({ projectRunId }: CrawlButtonProps) {
  const [crawling, setCrawling] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const router = useRouter();

  async function startCrawl() {
    setCrawling(true);
    setProgress(null);

    try {
      // Initialize crawl
      const startRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectRunId, action: "start" }),
      });

      if (!startRes.ok) {
        const err = await startRes.json();
        throw new Error(err.error || "Failed to start crawl");
      }

      const { robotsRules } = await startRes.json();
      toast.info("Crawl started...");

      // Process batches
      let done = false;
      while (!done) {
        const batchRes = await fetch("/api/crawl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectRunId, action: "batch", robotsRules }),
        });

        if (!batchRes.ok) {
          const err = await batchRes.json();
          throw new Error(err.error || "Crawl batch failed");
        }

        const result = await batchRes.json();
        setProgress({ completed: result.progress.completed, total: result.progress.total });

        if (result.done) {
          done = true;
        }
      }

      // Finalize
      const finalRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectRunId, action: "finalize" }),
      });

      if (!finalRes.ok) {
        const err = await finalRes.json();
        throw new Error(err.error || "Crawl finalization failed");
      }

      const finalResult = await finalRes.json();
      toast.success(`Crawl complete! ${finalResult.urlCount} URLs discovered.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Crawl failed");
    } finally {
      setCrawling(false);
    }
  }

  return (
    <Button onClick={startCrawl} disabled={crawling} size="sm">
      {crawling ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {progress ? `Crawling... ${progress.completed}/${progress.total}` : "Starting crawl..."}
        </>
      ) : (
        <>
          <Globe className="h-4 w-4 mr-2" />
          Start Crawl
        </>
      )}
    </Button>
  );
}
