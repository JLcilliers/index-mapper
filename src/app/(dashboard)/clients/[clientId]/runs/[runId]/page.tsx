import { notFound } from "next/navigation";
import Link from "next/link";
import { getRun, getRunSummary } from "@/server/queries/runs";
import { getUrlRecords } from "@/server/queries/urls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { FileUpload } from "@/components/runs/file-upload";
import { BucketSummary } from "@/components/dashboard/bucket-summary";
import { RunUrlTableClient } from "@/components/runs/run-url-table-client";
import { ClassifyButton } from "@/components/runs/classify-button";

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
    classification: sp.classification as "keep_as_is" | "improve_update" | "redirect_consolidate" | "remove_deindex" | undefined,
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
    draft: "bg-gray-100 text-gray-700",
    processing: "bg-blue-100 text-blue-700",
    classified: "bg-purple-100 text-purple-700",
    in_review: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
  };

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
            <h1 className="text-2xl font-bold">{run.name}</h1>
            <Badge className={statusColors[run.status] || ""}>
              {run.status.replace("_", " ")}
            </Badge>
          </div>
          {run.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {run.description}
            </p>
          )}
          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
            <span>{summary.totalCount.toLocaleString()} URLs</span>
            <span>{run.uploadedFiles.length} files</span>
            <span>{summary.reviewCount} need review</span>
            <span>{summary.reviewedCount} reviewed</span>
          </div>
        </div>

        <div className="flex gap-2">
          {summary.totalCount > 0 && !run.ruleConfig && run.status === "draft" && (
            <ClassifyButton projectRunId={runId} />
          )}
          {summary.totalCount > 0 && (
            <a href={`/api/export?projectRunId=${runId}`}>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </a>
          )}
        </div>
      </div>

      <Tabs defaultValue={summary.totalCount > 0 ? "urls" : "upload"}>
        <TabsList>
          <TabsTrigger value="upload">
            <FileText className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="urls" disabled={summary.totalCount === 0}>
            URLs ({summary.totalCount.toLocaleString()})
          </TabsTrigger>
          <TabsTrigger value="summary" disabled={summary.totalCount === 0}>
            Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <div className="max-w-2xl">
            <FileUpload projectRunId={runId} />

            {run.uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">Uploaded Files</h3>
                <div className="space-y-2">
                  {run.uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
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
