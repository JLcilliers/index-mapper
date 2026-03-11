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
import { Checkbox } from "@/components/ui/checkbox";
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

const REC_COLORS: Record<string, string> = {
  KEEP_INDEXED: "bg-gp-teal/15 text-gp-teal",
  KEEP_INDEXED_IMPROVE: "bg-gp-pool/15 text-gp-pool",
  CONSIDER_NOINDEX: "bg-gp-magenta/15 text-gp-magenta",
  MANUAL_REVIEW_REQUIRED: "bg-gp-purple/15 text-gp-purple",
};

const REC_LABELS: Record<string, string> = {
  KEEP_INDEXED: "Keep Indexed",
  KEEP_INDEXED_IMPROVE: "Keep — Improve",
  CONSIDER_NOINDEX: "Consider Noindex",
  MANUAL_REVIEW_REQUIRED: "Manual Review",
};

export function UrlDetailDrawer({
  urlRecord,
  open,
  onOpenChange,
}: UrlDetailDrawerProps) {
  const [finalRecommendation, setFinalRecommendation] = useState(
    urlRecord?.reviewDecision?.finalRecommendation ??
      urlRecord?.recommendation ??
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
  const [approved, setApproved] = useState(
    urlRecord?.reviewDecision?.approved ?? false
  );
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Reset state when URL record changes
  if (urlRecord && finalRecommendation !== (urlRecord.reviewDecision?.finalRecommendation ?? urlRecord.recommendation ?? "")) {
    setFinalRecommendation(
      urlRecord.reviewDecision?.finalRecommendation ?? urlRecord.recommendation ?? ""
    );
    setReason(urlRecord.reviewDecision?.reason ?? "");
    setNotes(urlRecord.reviewDecision?.notes ?? "");
    setTargetUrl(
      urlRecord.reviewDecision?.targetUrl ?? urlRecord.suggestedTargetUrl ?? ""
    );
    setApproved(urlRecord.reviewDecision?.approved ?? false);
  }

  async function handleSaveReview() {
    if (!urlRecord) return;
    setSaving(true);

    try {
      await submitReview({
        urlRecordId: urlRecord.id,
        finalRecommendation,
        reason: reason || undefined,
        notes: notes || undefined,
        targetUrl: targetUrl || undefined,
        approved,
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

            {/* Recommendation */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Indexability Recommendation</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Machine Recommendation</Label>
                  <div className="mt-1">
                    {urlRecord.recommendation ? (
                      <Badge className={REC_COLORS[urlRecord.recommendation] || ""}>
                        {REC_LABELS[urlRecord.recommendation] || urlRecord.recommendation}
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
                {urlRecord.secondaryAction && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Secondary Action</Label>
                    <p className="text-sm mt-1">
                      {urlRecord.secondaryAction.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
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
                    {urlRecord.suggestedAction}
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
                    <p key={i} className="text-sm text-gp-magenta">
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
                        <div className="w-24 h-2 bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary"
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
                <SignalRow label="Meta Robots" value={(urlRecord as Record<string, unknown>).metaRobots as string} />
                <SignalRow label="Word Count" value={urlRecord.wordCount} />
                <SignalRow label="Clicks" value={urlRecord.clicks} />
                <SignalRow label="Impressions" value={urlRecord.impressions} />
                <SignalRow label="Avg Position" value={typeof urlRecord.position === "number" ? urlRecord.position.toFixed(1) : null} />
                <SignalRow label="CTR" value={typeof urlRecord.ctr === "number" ? `${(urlRecord.ctr * 100).toFixed(2)}%` : null} />
                <SignalRow label="Sessions" value={urlRecord.sessions} />
                <SignalRow label="Conversions" value={urlRecord.conversions} />
                <SignalRow label="Backlinks" value={urlRecord.backlinks} />
                <SignalRow label="Ref. Domains" value={urlRecord.referringDomains} />
                <SignalRow label="Internal In" value={urlRecord.internalLinksIn} />
                <SignalRow label="Internal Out" value={urlRecord.internalLinksOut} />
                <SignalRow label="GSC Matched" value={urlRecord.gscMatched?.toString()} />
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {urlRecord.isOrphan && <Badge variant="outline" className="text-xs">Orphan</Badge>}
                {urlRecord.isThinContent && <Badge variant="outline" className="text-xs">Thin</Badge>}
                {urlRecord.missingTitle && <Badge variant="outline" className="text-xs">No Title</Badge>}
                {urlRecord.missingH1 && <Badge variant="outline" className="text-xs">No H1</Badge>}
                {urlRecord.gscMatched === false && <Badge variant="outline" className="text-xs">Not in GSC</Badge>}
              </div>
            </div>

            <Separator />

            {/* Review Override */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Manual Review</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Final Recommendation</Label>
                  <Select
                    value={finalRecommendation}
                    onValueChange={(v) => setFinalRecommendation(v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recommendation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KEEP_INDEXED">Keep Indexed</SelectItem>
                      <SelectItem value="KEEP_INDEXED_IMPROVE">Keep — Improve</SelectItem>
                      <SelectItem value="CONSIDER_NOINDEX">Consider Noindex</SelectItem>
                      <SelectItem value="MANUAL_REVIEW_REQUIRED">Needs More Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {finalRecommendation === "CONSIDER_NOINDEX" && (
                  <div className="flex items-center gap-2 p-3 bg-gp-magenta/10 border border-gp-magenta/20">
                    <Checkbox
                      id="approved"
                      checked={approved}
                      onCheckedChange={(checked) => setApproved(checked === true)}
                    />
                    <Label htmlFor="approved" className="text-sm text-gp-magenta">
                      Approve noindex for this URL
                    </Label>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">Reason</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why are you setting this recommendation?"
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Target URL (for redirect)</Label>
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
                  disabled={saving || !finalRecommendation}
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
