import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient } from "@/server/queries/clients";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe, Plus } from "lucide-react";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { CreateRunDialog } from "@/components/runs/create-run-dialog";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClient(clientId);

  if (!client) notFound();

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
        <Link href="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Clients
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <Globe className="h-4 w-4" />
            {client.domain}
            {client.niche && <span>&middot; {client.niche}</span>}
          </div>
          {client.notes && (
            <p className="text-sm text-muted-foreground mt-2">{client.notes}</p>
          )}
        </div>
        <div className="flex gap-2">
          <ClientFormDialog client={client}>
            <Button variant="outline" size="sm">Edit</Button>
          </ClientFormDialog>
          <CreateRunDialog clientId={client.id}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Run
            </Button>
          </CreateRunDialog>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Project Runs</h2>
        {client.projectRuns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-medium mb-1">No runs yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a new content mapping run for this client.
              </p>
              <CreateRunDialog clientId={client.id}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Run
                </Button>
              </CreateRunDialog>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {client.projectRuns.map((run) => (
              <Link
                key={run.id}
                href={`/clients/${client.id}/runs/${run.id}`}
              >
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{run.name}</CardTitle>
                      <Badge
                        variant="secondary"
                        className={statusColors[run.status] || ""}
                      >
                        {run.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {run.description && (
                      <p className="text-sm text-muted-foreground">
                        {run.description}
                      </p>
                    )}
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span>{run._count.urlRecords} URLs</span>
                      <span>{run._count.uploadedFiles} files</span>
                      <span>
                        Created{" "}
                        {new Date(run.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
