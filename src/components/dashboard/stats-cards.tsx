import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderOpen, Link2, AlertTriangle } from "lucide-react";

interface StatsCardsProps {
  clientCount: number;
  runCount: number;
  urlCount: number;
  reviewCount: number;
}

export function StatsCards({
  clientCount,
  runCount,
  urlCount,
  reviewCount,
}: StatsCardsProps) {
  const stats = [
    {
      title: "Active Clients",
      value: clientCount,
      icon: Users,
    },
    {
      title: "Project Runs",
      value: runCount,
      icon: FolderOpen,
    },
    {
      title: "Total URLs",
      value: urlCount.toLocaleString(),
      icon: Link2,
    },
    {
      title: "Pending Review",
      value: reviewCount.toLocaleString(),
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
