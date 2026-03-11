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
      iconColor: "text-gp-purple",
    },
    {
      title: "Project Runs",
      value: runCount,
      icon: FolderOpen,
      iconColor: "text-gp-magenta",
    },
    {
      title: "Total URLs",
      value: urlCount.toLocaleString(),
      icon: Link2,
      iconColor: "text-gp-pool",
    },
    {
      title: "Pending Review",
      value: reviewCount.toLocaleString(),
      icon: AlertTriangle,
      iconColor: "text-gp-teal",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border-l-2 border-l-gp-purple">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.iconColor}`} />
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
