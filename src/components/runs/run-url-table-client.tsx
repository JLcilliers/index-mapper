"use client";

import { useState } from "react";
import { UrlTable } from "@/components/urls/url-table";
import { UrlDetailDrawer } from "@/components/urls/url-detail-drawer";
import type { UrlRecord, ReviewDecision } from "@prisma/client";

type UrlRecordWithReview = UrlRecord & {
  reviewDecision: ReviewDecision | null;
};

interface RunUrlTableClientProps {
  records: UrlRecordWithReview[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  projectRunId: string;
  clientId: string;
}

export function RunUrlTableClient(props: RunUrlTableClientProps) {
  const [selectedUrl, setSelectedUrl] = useState<UrlRecordWithReview | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleUrlClick(urlRecord: UrlRecordWithReview) {
    setSelectedUrl(urlRecord);
    setDrawerOpen(true);
  }

  return (
    <>
      <UrlTable {...props} onUrlClick={handleUrlClick} />
      <UrlDetailDrawer
        urlRecord={selectedUrl}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}
