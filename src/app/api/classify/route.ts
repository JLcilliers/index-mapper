import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { classifyUrl } from "@/lib/classification/engine";
import { DEFAULT_RULE_CONFIG } from "@/lib/classification/defaults";
import type { RuleConfigData } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectRunId } = await request.json();

    if (!projectRunId) {
      return NextResponse.json(
        { error: "Project run ID is required" },
        { status: 400 }
      );
    }

    const run = await prisma.projectRun.findUnique({
      where: { id: projectRunId },
      include: { ruleConfig: true },
    });

    if (!run) {
      return NextResponse.json(
        { error: "Project run not found" },
        { status: 404 }
      );
    }

    // Update run status
    await prisma.projectRun.update({
      where: { id: projectRunId },
      data: { status: "processing" },
    });

    // Load rule config
    let config: RuleConfigData;
    if (run.ruleConfig) {
      config = {
        hardRules: run.ruleConfig.hardRules as unknown as RuleConfigData["hardRules"],
        scoreWeights: run.ruleConfig.scoreWeights as unknown as RuleConfigData["scoreWeights"],
        scoringThresholds: run.ruleConfig.scoringThresholds as unknown as RuleConfigData["scoringThresholds"],
        manualReviewTriggers: run.ruleConfig.manualReviewTriggers as unknown as RuleConfigData["manualReviewTriggers"],
        pageTypeModifiers: run.ruleConfig.pageTypeModifiers as unknown as RuleConfigData["pageTypeModifiers"],
      };
    } else {
      config = DEFAULT_RULE_CONFIG;
    }

    // Process URLs in batches
    const batchSize = 100;
    let processed = 0;
    let offset = 0;

    while (true) {
      const records = await prisma.urlRecord.findMany({
        where: { projectRunId },
        skip: offset,
        take: batchSize,
      });

      if (records.length === 0) break;

      for (const record of records) {
        const result = classifyUrl(record, config);

        await prisma.urlRecord.update({
          where: { id: record.id },
          data: {
            classification: result.classification,
            confidenceScore: result.confidenceScore,
            primaryReason: result.primaryReason,
            secondaryReason: result.secondaryReason,
            suggestedAction: result.suggestedAction,
            suggestedTargetUrl: result.suggestedTargetUrl,
            needsReview: result.needsReview,
            reviewTriggers: result.reviewTriggers,
            scoreBreakdown: result.scoreBreakdown as unknown as Record<string, number>,
            totalScore: result.totalScore,
          },
        });

        processed++;
      }

      offset += batchSize;
    }

    // Update run status
    await prisma.projectRun.update({
      where: { id: projectRunId },
      data: { status: "classified" },
    });

    return NextResponse.json({
      success: true,
      processed,
    });
  } catch (error) {
    console.error("Classification error:", error);
    return NextResponse.json(
      { error: "Classification failed" },
      { status: 500 }
    );
  }
}
