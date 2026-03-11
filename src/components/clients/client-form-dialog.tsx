"use client";

import { useState } from "react";
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
  const router = useRouter();
  const isEdit = !!client;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      domain: formData.get("domain") as string,
      niche: (formData.get("niche") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
      gscProperty: (formData.get("gscProperty") as string) || undefined,
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
      toast.error(isEdit ? "Failed to update client" : "Failed to create client");
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
