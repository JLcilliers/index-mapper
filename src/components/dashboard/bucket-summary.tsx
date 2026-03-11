import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BucketSummaryProps {
  bucketCounts: Record<string, number>;
}

const BUCKET_CONFIG = {
  keep_as_is: {
    label: "Keep as is",
    color: "bg-green-100 text-green-800",
  },
  improve_update: {
    label: "Improve / Update",
    color: "bg-blue-100 text-blue-800",
  },
  redirect_consolidate: {
    label: "Redirect / Consolidate",
    color: "bg-yellow-100 text-yellow-800",
  },
  remove_deindex: {
    label: "Remove / Deindex",
    color: "bg-red-100 text-red-800",
  },
};

export function BucketSummary({ bucketCounts }: BucketSummaryProps) {
  const total = Object.values(bucketCounts).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Classification Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            No URLs have been classified yet.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(BUCKET_CONFIG).map(([key, config]) => {
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
