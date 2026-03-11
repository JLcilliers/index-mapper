import { getDashboardStats } from "@/server/queries/clients";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { BucketSummary } from "@/components/dashboard/bucket-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light uppercase tracking-wider">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your content mapping projects
        </p>
      </div>

      <StatsCards
        clientCount={stats.clientCount}
        runCount={stats.runCount}
        urlCount={stats.urlCount}
        reviewCount={stats.reviewCount}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <BucketSummary bucketCounts={stats.bucketCounts} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentRuns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No project runs yet. Create a client and start a new run.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentRuns.map((run) => (
                  <Link
                    key={run.id}
                    href={`/clients/${run.clientId}/runs/${run.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{run.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {run.client.name} &middot; {run._count.urlRecords} URLs
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {run.status.replace("_", " ")}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
