"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink } from "lucide-react";
import { submitReview } from "@/server/actions/reviews";
import { toast } from "sonner";
import type { UrlRecord, ReviewDecision } from "@prisma/client";
import type { ScoreBreakdown } from "@/types";

type UrlRecordWithReview = UrlRecord & {
  reviewDecision: ReviewDecision | null;
};

interface UrlDetailDrawerProps {
  urlRecord: UrlRecordWithReview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BUCKET_COLORS: Record<string, string> = {
  keep_as_is: "bg-green-100 text-green-800",
  improve_update: "bg-blue-100 text-blue-800",
  redirect_consolidate: "bg-yellow-100 text-yellow-800",
  remove_deindex: "bg-red-100 text-red-800",
};

const BUCKET_LABELS: Record<string, string> = {
  keep_as_is: "Keep as is",
  improve_update: "Improve / Update",
  redirect_consolidate: "Redirect / Consolidate",
  remove_deindex: "Remove / Deindex",
};

export function UrlDetailDrawer({
  urlRecord,
  open,
  onOpenChange,
}: UrlDetailDrawerProps) {
  const [finalClassification, setFinalClassification] = useState(
    urlRecord?.reviewDecision?.finalClassification ??
      urlRecord?.classification ??
      ""
  );
  const [reason, setReason] = useState(
    urlRecord?.reviewDecision?.reason ?? ""
  );
  const [notes, setNotes] = useState(
    urlRecord?.reviewDecision?.notes ?? ""
  );
  const [targetUrl, setTargetUrl] = useState(
    urlRecord?.reviewDecision?.targetUrl ??
      urlRecord?.suggestedTargetUrl ??
      ""
  );
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Reset state when URL record changes
  if (urlRecord && finalClassification !== (urlRecord.reviewDecision?.finalClassification ?? urlRecord.classification ?? "")) {
    setFinalClassification(
      urlRecord.reviewDecision?.finalClassification ?? urlRecord.classification ?? ""
    );
    setReason(urlRecord.reviewDecision?.reason ?? "");
    setNotes(urlRecord.reviewDecision?.notes ?? "");
    setTargetUrl(
      urlRecord.reviewDecision?.targetUrl ?? urlRecord.suggestedTargetUrl ?? ""
    );
  }

  async function handleSaveReview() {
    if (!urlRecord) return;
    setSaving(true);

    try {
      await submitReview({
        urlRecordId: urlRecord.id,
        finalClassification,
        reason: reason || undefined,
        notes: notes || undefined,
        targetUrl: targetUrl || undefined,
      });
      toast.success("Review saved");
      router.refresh();
    } catch (error) {
      toast.error("Failed to save review");
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  if (!urlRecord) return null;

  const scoreBreakdown = urlRecord.scoreBreakdown as ScoreBreakdown | null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:max-w-[520px] p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="text-base">URL Detail</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)] px-6 pb-6">
          <div className="space-y-6 py-4">
            {/* URL */}
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium break-all">{urlRecord.url}</p>
                <a
                  href={urlRecord.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              </div>
              {urlRecord.title && (
                <p className="text-sm text-muted-foreground mt-1">
                  {urlRecord.title}
                </p>
              )}
            </div>

            <Separator />

            {/* Classification */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Classification</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Machine Classification</Label>
                  <div className="mt-1">
                    {urlRecord.classification ? (
                      <Badge className={BUCKET_COLORS[urlRecord.classification]}>
                        {BUCKET_LABELS[urlRecord.classification]}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not classified</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Confidence</Label>
                  <p className="text-sm mt-1">
                    {urlRecord.confidenceScore
                      ? `${(urlRecord.confidenceScore * 100).toFixed(0)}%`
                      : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Score</Label>
                  <p className="text-sm mt-1">
                    {urlRecord.totalScore
                      ? `${urlRecord.totalScore.toFixed(1)}/100`
                      : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Page Type</Label>
                  <p className="text-sm mt-1">
                    {urlRecord.pageType?.replace(/_/g, " ") ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Reasons */}
            {(urlRecord.primaryReason || urlRecord.secondaryReason) && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Reasons</h3>
                <div className="space-y-1">
                  {urlRecord.primaryReason && (
                    <p className="text-sm">{urlRecord.primaryReason}</p>
                  )}
                  {urlRecord.secondaryReason && (
                    <p className="text-sm text-muted-foreground">
                      {urlRecord.secondaryReason}
                    </p>
                  )}
                </div>
                {urlRecord.suggestedAction && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    Suggested: {urlRecord.suggestedAction}
                  </p>
                )}
              </div>
            )}

            {/* Review Triggers */}
            {urlRecord.needsReview && urlRecord.reviewTriggers && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Review Triggers</h3>
                <div className="space-y-1">
                  {(urlRecord.reviewTriggers as string[]).map((trigger, i) => (
                    <p key={i} className="text-sm text-amber-700">
                      {trigger}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Score Breakdown */}
            {scoreBreakdown && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Score Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(scoreBreakdown).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <span className="text-xs w-8 text-right">{Math.round(value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Signals */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Signals</h3>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <SignalRow label="Status Code" value={urlRecord.statusCode} />
                <SignalRow label="Indexable" value={urlRecord.isIndexable?.toString()} />
                <SignalRow label="Word Count" value={urlRecord.wordCount} />
                <SignalRow label="Clicks" value={urlRecord.clicks} />
                <SignalRow label="Impressions" value={urlRecord.impressions} />
                <SignalRow label="Sessions" value={urlRecord.sessions} />
                <SignalRow label="Conversions" value={urlRecord.conversions} />
                <SignalRow label="Backlinks" value={urlRecord.backlinks} />
                <SignalRow label="Ref. Domains" value={urlRecord.referringDomains} />
                <SignalRow label="Internal In" value={urlRecord.internalLinksIn} />
                <SignalRow label="Internal Out" value={urlRecord.internalLinksOut} />
                <SignalRow label="H1" value={urlRecord.h1} />
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {urlRecord.isOrphan && <Badge variant="outline" className="text-xs">Orphan</Badge>}
                {urlRecord.isThinContent && <Badge variant="outline" className="text-xs">Thin</Badge>}
                {urlRecord.missingTitle && <Badge variant="outline" className="text-xs">No Title</Badge>}
                {urlRecord.missingH1 && <Badge variant="outline" className="text-xs">No H1</Badge>}
              </div>
            </div>

            <Separator />

            {/* Review Override */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Manual Review</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Final Classification</Label>
                  <Select
                    value={finalClassification}
                    onValueChange={(v) => setFinalClassification(v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep_as_is">Keep as is</SelectItem>
                      <SelectItem value="improve_update">Improve / Update</SelectItem>
                      <SelectItem value="redirect_consolidate">Redirect / Consolidate</SelectItem>
                      <SelectItem value="remove_deindex">Remove / Deindex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Reason for override</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why are you overriding the machine classification?"
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Redirect Target URL</Label>
                  <Input
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="Target URL for redirect"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes"
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleSaveReview}
                  disabled={saving || !finalClassification}
                  className="w-full"
                >
                  {saving ? "Saving..." : "Save Review"}
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function SignalRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">
        {value !== null && value !== undefined ? String(value) : "—"}
      </span>
    </div>
  );
}
