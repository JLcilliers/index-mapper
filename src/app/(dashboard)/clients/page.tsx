import { getClients } from "@/server/queries/clients";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, FolderOpen } from "lucide-react";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client websites
          </p>
        </div>
        <ClientFormDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </ClientFormDialog>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No clients yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first client to get started with content mapping.
            </p>
            <ClientFormDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </ClientFormDialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{client.name}</CardTitle>
                    <Badge variant={client.isActive ? "secondary" : "outline"}>
                      {client.isActive ? "Active" : "Archived"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                      {client.domain}
                    </div>
                    {client.niche && (
                      <p className="text-muted-foreground">{client.niche}</p>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FolderOpen className="h-3.5 w-3.5" />
                      {client._count.projectRuns} runs
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
