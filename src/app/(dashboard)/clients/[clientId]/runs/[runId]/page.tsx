import { notFound } from "next/navigation";
import Link from "next/link";
import { getRun, getRunSummary } from "@/server/queries/runs";
import { getUrlRecords } from "@/server/queries/urls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, FileText, Globe, Search as SearchIcon } from "lucide-react";
import { FileUpload } from "@/components/runs/file-upload";
import { BucketSummary } from "@/components/dashboard/bucket-summary";
import { RunUrlTableClient } from "@/components/runs/run-url-table-client";
import { ClassifyButton } from "@/components/runs/classify-button";
import { CrawlButton } from "@/components/runs/crawl-button";
import { GscFetchButton } from "@/components/runs/gsc-fetch-button";
import type { IndexabilityRecommendation } from "@/types";

export default async function RunDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; runId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { clientId, runId } = await params;
  const sp = await searchParams;

  const run = await getRun(runId);
  if (!run || run.clientId !== clientId) notFound();

  const summary = await getRunSummary(runId);

  const urlParams = {
    projectRunId: runId,
    recommendation: sp.recommendation as IndexabilityRecommendation | undefined,
    pageType: sp.pageType,
    needsReview: sp.needsReview === "true" ? true : sp.needsReview === "false" ? false : undefined,
    search: sp.search,
    page: sp.page ? parseInt(sp.page) : 1,
    pageSize: 50,
    sortBy: sp.sortBy || "url",
    sortOrder: (sp.sortOrder as "asc" | "desc") || "asc",
  };

  const urlRecords = await getUrlRecords(urlParams);

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    crawling: "bg-gp-pool/15 text-gp-pool",
    crawl_complete: "bg-gp-pool/15 text-gp-pool",
    fetching_gsc: "bg-gp-pool/15 text-gp-pool",
    merging: "bg-gp-pool/15 text-gp-pool",
    classifying: "bg-gp-purple/15 text-gp-purple",
    classified: "bg-gp-purple/15 text-gp-purple",
    in_review: "bg-gp-magenta/15 text-gp-magenta",
    completed: "bg-gp-teal/15 text-gp-teal",
  };

  const canCrawl = run.status === "draft";
  const canFetchGsc = ["crawl_complete", "classified", "in_review"].includes(run.status);
  const canClassify = summary.totalCount > 0 && ["crawl_complete", "merging", "fetching_gsc"].includes(run.status);
  const hasData = summary.totalCount > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/clients/${clientId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {run.client.name}
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-light uppercase tracking-wider">{run.name}</h1>
            <Badge className={statusColors[run.status] || ""}>
              {run.status.replace(/_/g, " ")}
            </Badge>
          </div>
          {run.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {run.description}
            </p>
          )}
          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
            <span>{summary.totalCount.toLocaleString()} URLs</span>
            {summary.gscMatchedCount > 0 && (
              <span>{summary.gscMatchedCount} GSC matched</span>
            )}
            <span>{summary.reviewCount} need review</span>
            <span>{summary.reviewedCount} reviewed</span>
          </div>
        </div>

        <div className="flex gap-2">
          {canCrawl && (
            <CrawlButton projectRunId={runId} />
          )}
          {canFetchGsc && run.client.gscProperty && (
            <GscFetchButton projectRunId={runId} />
          )}
          {canClassify && (
            <ClassifyButton projectRunId={runId} />
          )}
          {hasData && (
            <div className="flex gap-1">
              <a href={`/api/export?projectRunId=${runId}&format=full`}>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Full Report
                </Button>
              </a>
              <a href={`/api/export?projectRunId=${runId}&format=noindex`}>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Noindex Sheet
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue={hasData ? "urls" : "crawl"}>
        <TabsList>
          <TabsTrigger value="crawl">
            <Globe className="h-4 w-4 mr-2" />
            Crawl
          </TabsTrigger>
          <TabsTrigger value="upload">
            <FileText className="h-4 w-4 mr-2" />
            CSV Upload
          </TabsTrigger>
          <TabsTrigger value="urls" disabled={!hasData}>
            <SearchIcon className="h-4 w-4 mr-2" />
            URLs ({summary.totalCount.toLocaleString()})
          </TabsTrigger>
          <TabsTrigger value="summary" disabled={!hasData}>
            Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crawl" className="mt-4">
          <div className="max-w-2xl space-y-6">
            <div className="p-6 border bg-card">
              <h3 className="text-base font-semibold mb-2">Crawl Settings</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Domain:</span>
                  <span className="ml-2 font-medium">{run.client.domain}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Pages:</span>
                  <span className="ml-2 font-medium">{run.crawlMaxPages}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Depth:</span>
                  <span className="ml-2 font-medium">{run.crawlMaxDepth}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2 font-medium">{run.status.replace(/_/g, " ")}</span>
                </div>
              </div>
              {run.crawlError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm">
                  Error: {run.crawlError}
                </div>
              )}
              {run.crawlCompleted && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Crawl completed: {new Date(run.crawlCompleted).toLocaleString()}
                </p>
              )}
            </div>

            {run.client.gscProperty ? (
              <div className="p-6 border bg-card">
                <h3 className="text-base font-semibold mb-2">Google Search Console</h3>
                <p className="text-sm text-muted-foreground">
                  Property: <span className="font-medium text-foreground">{run.client.gscProperty}</span>
                </p>
                {run.gscFetchedAt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Last fetched: {new Date(run.gscFetchedAt).toLocaleString()}
                    {run.gscDateRangeStart && run.gscDateRangeEnd && (
                      <span>
                        {" "}({new Date(run.gscDateRangeStart).toLocaleDateString()} – {new Date(run.gscDateRangeEnd).toLocaleDateString()})
                      </span>
                    )}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-6 border bg-card">
                <h3 className="text-base font-semibold mb-2">Google Search Console</h3>
                <p className="text-sm text-muted-foreground">
                  No GSC property linked to this client. Set it in{" "}
                  <Link href={`/clients/${clientId}`} className="text-gp-magenta underline">
                    client settings
                  </Link>.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <div className="max-w-2xl">
            <p className="text-sm text-muted-foreground mb-4">
              Upload CSV files as a fallback or to supplement crawl data with backlinks, analytics, or additional crawl exports.
            </p>
            <FileUpload projectRunId={runId} />

            {run.uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">Uploaded Files</h3>
                <div className="space-y-2">
                  {run.uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{file.fileName}</span>
                        {file.fileType && (
                          <Badge variant="secondary" className="text-xs">
                            {file.fileType}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        {file.rowCount && <span>{file.rowCount} rows</span>}
                        <span>{(file.fileSize / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="urls" className="mt-4">
          <RunUrlTableClient
            records={JSON.parse(JSON.stringify(urlRecords.data))}
            total={urlRecords.total}
            page={urlRecords.page}
            pageSize={urlRecords.pageSize}
            totalPages={urlRecords.totalPages}
            projectRunId={runId}
            clientId={clientId}
          />
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
            <BucketSummary bucketCounts={summary.bucketCounts} />

            <div className="space-y-4">
              <h3 className="text-base font-semibold">By Page Type</h3>
              <div className="space-y-2">
                {Object.entries(summary.pageTypeCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {type?.replace(/_/g, " ") || "unknown"}
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
