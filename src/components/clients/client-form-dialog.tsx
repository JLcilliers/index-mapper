"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient, updateClient } from "@/server/actions/clients";
import { toast } from "sonner";

interface GscProperty {
  siteUrl: string;
  permissionLevel: string;
}

interface ClientFormDialogProps {
  children: React.ReactNode;
  client?: {
    id: string;
    name: string;
    domain: string;
    niche: string | null;
    notes: string | null;
    gscProperty: string | null;
  };
}

export function ClientFormDialog({ children, client }: ClientFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gscProperties, setGscProperties] = useState<GscProperty[]>([]);
  const [gscLoading, setGscLoading] = useState(false);
  const [gscError, setGscError] = useState<string | null>(null);
  const [selectedGscProperty, setSelectedGscProperty] = useState(
    client?.gscProperty ?? ""
  );
  const router = useRouter();
  const isEdit = !!client;

  useEffect(() => {
    if (open) {
      setSelectedGscProperty(client?.gscProperty ?? "");
      fetchGscProperties();
    }
  }, [open, client?.gscProperty]);

  async function fetchGscProperties() {
    setGscLoading(true);
    setGscError(null);
    try {
      const res = await fetch("/api/gsc?action=properties");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch GSC properties");
      }
      const data = await res.json();
      setGscProperties(data.properties || []);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load GSC properties";
      setGscError(msg);
      setGscProperties([]);
    } finally {
      setGscLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      domain: formData.get("domain") as string,
      niche: (formData.get("niche") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
      gscProperty: selectedGscProperty || undefined,
    };

    try {
      if (isEdit) {
        await updateClient(client.id, data);
        toast.success("Client updated");
      } else {
        await createClient(data);
        toast.success("Client created");
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        isEdit ? "Failed to update client" : "Failed to create client"
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Client" : "Add Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={client?.name}
              placeholder="Acme Corp"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              name="domain"
              defaultValue={client?.domain}
              placeholder="acmecorp.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="niche">Niche / Industry</Label>
            <Input
              id="niche"
              name="niche"
              defaultValue={client?.niche ?? ""}
              placeholder="e.g., Dental, Legal, SaaS"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gscProperty">GSC Property</Label>
            {gscLoading ? (
              <p className="text-sm text-muted-foreground py-2">
                Loading GSC properties...
              </p>
            ) : gscError ? (
              <div className="space-y-1">
                <p className="text-sm text-red-600">{gscError}</p>
                <p className="text-xs text-muted-foreground">
                  Connect Google in Settings first, then try again.
                </p>
              </div>
            ) : gscProperties.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No GSC properties found for the connected account.
              </p>
            ) : (
              <select
                id="gscProperty"
                value={selectedGscProperty}
                onChange={(e) => setSelectedGscProperty(e.target.value)}
                className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
              >
                <option value="">— None —</option>
                {gscProperties.map((prop) => (
                  <option key={prop.siteUrl} value={prop.siteUrl}>
                    {prop.siteUrl}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={client?.notes ?? ""}
              placeholder="Any relevant notes about this client"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
