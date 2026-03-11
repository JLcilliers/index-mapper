"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GscConnectionCardProps {
  connection:
    | { connected: true; email: string; tokenExpiry: Date }
    | { connected: false };
}

export function GscConnectionCard({ connection }: GscConnectionCardProps) {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Google Search Console</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <div className="p-3 bg-green-500/10 text-green-700 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-500/10 text-red-700 text-sm">
            {error}
          </div>
        )}

        {connection.connected ? (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">
                  Connected
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {connection.email}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Token expires:{" "}
                {new Date(connection.tokenExpiry).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = "/api/auth/google";
                }}
              >
                Reconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Not connected
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Connect your Google account to pull Search Console data.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                window.location.href = "/api/auth/google";
              }}
            >
              Connect Google
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
