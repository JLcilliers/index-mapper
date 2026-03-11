import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_RULE_CONFIG } from "../src/lib/classification/defaults";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default admin user
  const passwordHash = await bcrypt.hash("admin123", 10);

  const user = await prisma.user.upsert({
    where: { email: "admin@indexmapper.com" },
    update: {},
    create: {
      email: "admin@indexmapper.com",
      name: "Admin",
      passwordHash,
    },
  });

  console.log(`Created user: ${user.email}`);

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
  console.log("Login with: admin@indexmapper.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
