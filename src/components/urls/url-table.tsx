"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, ExternalLink } from "lucide-react";
import type { UrlRecord, ReviewDecision } from "@prisma/client";

type UrlRecordWithReview = UrlRecord & {
  reviewDecision: ReviewDecision | null;
};

interface UrlTableProps {
  records: UrlRecordWithReview[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  projectRunId: string;
  clientId: string;
  onUrlClick: (urlRecord: UrlRecordWithReview) => void;
}

const RECOMMENDATION_COLORS: Record<string, string> = {
  KEEP_INDEXED: "bg-gp-teal/15 text-gp-teal border border-gp-teal/30",
  KEEP_INDEXED_IMPROVE: "bg-gp-pool/15 text-gp-pool border border-gp-pool/30",
  CONSIDER_NOINDEX: "bg-gp-magenta/15 text-gp-magenta border border-gp-magenta/30",
  MANUAL_REVIEW_REQUIRED: "bg-gp-purple/15 text-gp-purple border border-gp-purple/30",
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  KEEP_INDEXED: "Keep",
  KEEP_INDEXED_IMPROVE: "Improve",
  CONSIDER_NOINDEX: "Noindex",
  MANUAL_REVIEW_REQUIRED: "Review",
};

export function UrlTable({
  records,
  total,
  page,
  totalPages,
  projectRunId,
  clientId,
  onUrlClick,
}: UrlTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(
      `/clients/${clientId}/runs/${projectRunId}?${params.toString()}`
    );
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search, page: "1" });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search URLs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <Select
          value={searchParams.get("recommendation") || "all"}
          onValueChange={(v) => updateParams({ recommendation: v ?? undefined, page: "1" })}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Recommendation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All recommendations</SelectItem>
            <SelectItem value="KEEP_INDEXED">Keep Indexed</SelectItem>
            <SelectItem value="KEEP_INDEXED_IMPROVE">Keep — Improve</SelectItem>
            <SelectItem value="CONSIDER_NOINDEX">Consider Noindex</SelectItem>
            <SelectItem value="MANUAL_REVIEW_REQUIRED">Manual Review</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("needsReview") || "all"}
          onValueChange={(v) => updateParams({ needsReview: v ?? undefined, page: "1" })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Review Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All URLs</SelectItem>
            <SelectItem value="true">Needs Review</SelectItem>
            <SelectItem value="false">Auto-classified</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("pageType") || "all"}
          onValueChange={(v) => updateParams({ pageType: v ?? undefined, page: "1" })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Page Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All page types</SelectItem>
            <SelectItem value="homepage">Homepage</SelectItem>
            <SelectItem value="core_service_page">Service Page</SelectItem>
            <SelectItem value="service_subpage">Service Subpage</SelectItem>
            <SelectItem value="blog_article">Blog Article</SelectItem>
            <SelectItem value="location_page">Location Page</SelectItem>
            <SelectItem value="category_tag_page">Category/Tag</SelectItem>
            <SelectItem value="legal_page">Legal</SelectItem>
            <SelectItem value="utility_page">Utility</SelectItem>
            <SelectItem value="media_attachment">Media</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {records.length} of {total.toLocaleString()} URLs
      </div>

      {/* Table */}
      <div className="border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[350px]">URL</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Impressions</TableHead>
              <TableHead>Words</TableHead>
              <TableHead>Recommendation</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Review</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No URLs found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => {
                const finalRec =
                  record.reviewDecision?.finalRecommendation ??
                  record.recommendation;
                const isOverridden = !!record.reviewDecision;

                return (
                  <TableRow
                    key={record.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onUrlClick(record)}
                  >
                    <TableCell className="max-w-[350px]">
                      <div className="flex items-center gap-1">
                        <span className="truncate text-sm" title={record.url}>
                          {record.url.replace(/^https?:\/\//, "")}
                        </span>
                        <a
                          href={record.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0"
                        >
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {record.pageType?.replace(/_/g, " ") ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{record.statusCode ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{record.clicks ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{record.impressions ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{record.wordCount ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      {finalRec ? (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            RECOMMENDATION_COLORS[finalRec] || ""
                          } ${isOverridden ? "ring-2 ring-primary/30" : ""}`}
                        >
                          {RECOMMENDATION_LABELS[finalRec] || finalRec}
                          {isOverridden && " *"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {record.confidenceScore
                          ? `${(record.confidenceScore * 100).toFixed(0)}%`
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {record.needsReview && (
                        <Badge variant="outline" className="text-xs bg-gp-purple/10 text-gp-purple border-gp-purple/30">
                          Review
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
