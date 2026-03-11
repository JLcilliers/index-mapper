import { prisma } from "@/lib/db";
import { DEFAULT_RULE_CONFIG } from "@/lib/classification/defaults";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RuleConfigData } from "@/types";

export default async function SettingsPage() {
  const defaultConfig = await prisma.ruleConfig.findFirst({
    where: { isDefault: true },
  });

  const config: RuleConfigData = defaultConfig
    ? {
        hardRules: defaultConfig.hardRules as unknown as RuleConfigData["hardRules"],
        scoreWeights: defaultConfig.scoreWeights as unknown as RuleConfigData["scoreWeights"],
        scoringThresholds: defaultConfig.scoringThresholds as unknown as RuleConfigData["scoringThresholds"],
        manualReviewTriggers: defaultConfig.manualReviewTriggers as unknown as RuleConfigData["manualReviewTriggers"],
        pageTypeModifiers: defaultConfig.pageTypeModifiers as unknown as RuleConfigData["pageTypeModifiers"],
      }
    : DEFAULT_RULE_CONFIG;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-light uppercase tracking-wider">Settings</h1>
        <p className="text-muted-foreground">
          Classification rules and scoring configuration
        </p>
      </div>

      {/* Score Weights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score Weights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(config.scoreWeights).map(([key, weight]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${weight * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {(weight * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scoring Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scoring Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Keep Indexed</span>
              <span className="font-medium">{">="} {config.scoringThresholds.keepIndexed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Keep — Improve</span>
              <span className="font-medium">
                {config.scoringThresholds.keepIndexedImprove} – {config.scoringThresholds.keepIndexed - 1}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Consider Noindex</span>
              <span className="font-medium">{"<"} {config.scoringThresholds.keepIndexedImprove}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hard Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hard Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {config.hardRules.map((rule) => (
              <div key={rule.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{rule.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rule.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {rule.recommendation.replace(/_/g, " ")}
                  </Badge>
                  <Badge variant={rule.enabled ? "default" : "outline"} className="text-xs">
                    {rule.enabled ? "On" : "Off"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Review Triggers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manual Review Triggers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {config.manualReviewTriggers.map((trigger) => (
              <div key={trigger.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{trigger.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{trigger.reason}</p>
                </div>
                <Badge variant={trigger.enabled ? "default" : "outline"} className="text-xs">
                  {trigger.enabled ? "On" : "Off"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Page Type Modifiers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Page Type Score Modifiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(config.pageTypeModifiers)
              .sort(([, a], [, b]) => b - a)
              .map(([type, modifier]) => (
                <div key={type} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                  <span className="capitalize">{type.replace(/_/g, " ")}</span>
                  <span className={`font-medium ${modifier > 0 ? "text-green-600" : modifier < 0 ? "text-red-600" : ""}`}>
                    {modifier > 0 ? `+${modifier}` : modifier}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
