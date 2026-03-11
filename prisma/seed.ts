import { PrismaClient } from "@prisma/client";
import { DEFAULT_RULE_CONFIG } from "../src/lib/classification/defaults";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const ruleData = {
    hardRules: JSON.parse(JSON.stringify(DEFAULT_RULE_CONFIG.hardRules)),
    scoreWeights: JSON.parse(JSON.stringify(DEFAULT_RULE_CONFIG.scoreWeights)),
    scoringThresholds: JSON.parse(JSON.stringify(DEFAULT_RULE_CONFIG.scoringThresholds)),
    manualReviewTriggers: JSON.parse(JSON.stringify(DEFAULT_RULE_CONFIG.manualReviewTriggers)),
    pageTypeModifiers: JSON.parse(JSON.stringify(DEFAULT_RULE_CONFIG.pageTypeModifiers)),
  };

  // Create default rule config
  const ruleConfig = await prisma.ruleConfig.upsert({
    where: { id: "default-v1" },
    update: ruleData,
    create: {
      id: "default-v1",
      name: "Default v1",
      isDefault: true,
      ...ruleData,
    },
  });

  console.log(`Created rule config: ${ruleConfig.name}`);
  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
