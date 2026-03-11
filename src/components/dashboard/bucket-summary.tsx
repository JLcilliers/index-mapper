import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BucketSummaryProps {
  bucketCounts: Record<string, number>;
}

const RECOMMENDATION_CONFIG = {
  KEEP_INDEXED: {
    label: "Keep Indexed",
    color: "bg-gp-teal/15 text-gp-teal border border-gp-teal/30",
  },
  KEEP_INDEXED_IMPROVE: {
    label: "Keep — Improve",
    color: "bg-gp-pool/15 text-gp-pool border border-gp-pool/30",
  },
  CONSIDER_NOINDEX: {
    label: "Consider Noindex",
    color: "bg-gp-magenta/15 text-gp-magenta border border-gp-magenta/30",
  },
  MANUAL_REVIEW_REQUIRED: {
    label: "Manual Review",
    color: "bg-gp-purple/15 text-gp-purple border border-gp-purple/30",
  },
};

export function BucketSummary({ bucketCounts }: BucketSummaryProps) {
  const total = Object.values(bucketCounts).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Indexability Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            No URLs have been classified yet.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(RECOMMENDATION_CONFIG).map(([key, config]) => {
              const count = bucketCounts[key] || 0;
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0";

              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={config.color}>
                      {config.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{count.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="border-t pt-2 flex items-center justify-between">
              <span className="text-sm font-medium">Total Classified</span>
              <span className="text-sm font-bold">{total.toLocaleString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
