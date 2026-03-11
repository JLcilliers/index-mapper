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

const BUCKET_COLORS: Record<string, string> = {
  keep_as_is: "bg-green-100 text-green-800",
  improve_update: "bg-blue-100 text-blue-800",
  redirect_consolidate: "bg-yellow-100 text-yellow-800",
  remove_deindex: "bg-red-100 text-red-800",
};

const BUCKET_LABELS: Record<string, string> = {
  keep_as_is: "Keep",
  improve_update: "Improve",
  redirect_consolidate: "Redirect",
  remove_deindex: "Remove",
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
          value={searchParams.get("classification") || "all"}
          onValueChange={(v) => updateParams({ classification: v ?? undefined, page: "1" })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Classification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classifications</SelectItem>
            <SelectItem value="keep_as_is">Keep as is</SelectItem>
            <SelectItem value="improve_update">Improve / Update</SelectItem>
            <SelectItem value="redirect_consolidate">Redirect / Consolidate</SelectItem>
            <SelectItem value="remove_deindex">Remove / Deindex</SelectItem>
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
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[350px]">URL</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Backlinks</TableHead>
              <TableHead>Words</TableHead>
              <TableHead>Classification</TableHead>
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
                const finalClassification =
                  record.reviewDecision?.finalClassification ??
                  record.classification;
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
                      <span className="text-xs">{record.backlinks ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{record.wordCount ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      {finalClassification ? (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            BUCKET_COLORS[finalClassification] || ""
                          } ${isOverridden ? "ring-2 ring-primary/30" : ""}`}
                        >
                          {BUCKET_LABELS[finalClassification] || finalClassification}
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
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
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
