"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GscFetchButtonProps {
  projectRunId: string;
}

export function GscFetchButton({ projectRunId }: GscFetchButtonProps) {
  const [fetching, setFetching] = useState(false);
  const [range, setRange] = useState("6m");
  const router = useRouter();

  async function fetchGscData() {
    setFetching(true);

    try {
      const res = await fetch(
        `/api/gsc?action=fetch&projectRunId=${projectRunId}&range=${range}`
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch GSC data");
      }

      const result = await res.json();
      toast.success(
        `GSC data fetched: ${result.totalGscPages} pages, ${result.matched} matched to crawl`
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "GSC fetch failed");
    } finally {
      setFetching(false);
    }
  }

  return (
    <div className="flex gap-1">
      <Select value={range} onValueChange={(v) => setRange(v ?? "6m")}>
        <SelectTrigger className="w-28 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="3m">Last 3 months</SelectItem>
          <SelectItem value="6m">Last 6 months</SelectItem>
          <SelectItem value="12m">Last 12 months</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={fetchGscData} disabled={fetching} size="sm" variant="outline">
        {fetching ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Fetching GSC...
          </>
        ) : (
          <>
            <BarChart3 className="h-4 w-4 mr-2" />
            Fetch GSC Data
          </>
        )}
      </Button>
    </div>
  );
}
