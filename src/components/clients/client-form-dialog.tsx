"use client";

import { useState, useEffect, useRef } from "react";
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
import { ChevronsUpDown, Check, X } from "lucide-react";

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
              <GscPropertyCombobox
                properties={gscProperties}
                value={selectedGscProperty}
                onChange={setSelectedGscProperty}
              />
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

function GscPropertyCombobox({
  properties,
  value,
  onChange,
}: {
  properties: GscProperty[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = search
    ? properties.filter((p) =>
        p.siteUrl.toLowerCase().includes(search.toLowerCase())
      )
    : properties;

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
        setSearch("");
      }
    }
    if (searchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [searchOpen]);

  return (
    <div ref={containerRef} className="relative">
      {!searchOpen ? (
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-9 w-full items-center justify-between border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value || "Search GSC properties..."}
          </span>
          <div className="flex items-center gap-1">
            {value && (
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                className="hover:text-foreground text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </button>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setSearchOpen(false);
              setSearch("");
            }
          }}
          placeholder="Type to search..."
          className="flex h-9 w-full border border-ring bg-transparent px-3 py-1 text-sm shadow-xs outline-none ring-[3px] ring-ring/50"
        />
      )}

      {searchOpen && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto border bg-popover shadow-md">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setSearchOpen(false);
              setSearch("");
            }}
            className="flex w-full items-center justify-between px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            — None —
            {!value && <Check className="h-3.5 w-3.5" />}
          </button>
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground text-center">
              No properties match &quot;{search}&quot;
            </p>
          ) : (
            filtered.map((prop) => (
              <button
                key={prop.siteUrl}
                type="button"
                onClick={() => {
                  onChange(prop.siteUrl);
                  setSearchOpen(false);
                  setSearch("");
                }}
                className="flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-muted"
              >
                <span className="truncate">{prop.siteUrl}</span>
                {value === prop.siteUrl && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
