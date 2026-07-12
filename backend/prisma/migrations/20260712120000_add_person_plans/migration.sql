CREATE TYPE "PersonPlanType" AS ENUM ('TASK', 'LONG_TERM_GOAL');
CREATE TYPE "PersonPlanStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PersonPlanPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "PersonGoalProgressMethod" AS ENUM ('MILESTONE', 'FINANCIAL');

CREATE TABLE "PersonPlan" (
  "id" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "type" "PersonPlanType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "PersonPlanStatus" NOT NULL DEFAULT 'PENDING',
  "priority" "PersonPlanPriority",
  "startDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "dueTime" TEXT,
  "targetDate" TIMESTAMP(3),
  "reminderAt" TIMESTAMP(3),
  "reminderFrequency" TEXT,
  "note" TEXT,
  "goalCategory" TEXT,
  "goalIcon" TEXT,
  "needsMoney" BOOLEAN NOT NULL DEFAULT false,
  "targetAmountMinorUnits" BIGINT,
  "currentAmountMinorUnits" BIGINT,
  "currency" TEXT NOT NULL DEFAULT 'RWF',
  "progressMethod" "PersonGoalProgressMethod" NOT NULL DEFAULT 'MILESTONE',
  "completedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonPlanMilestone" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "completedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonPlanMilestone_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PersonPlan_personId_status_idx" ON "PersonPlan"("personId", "status");
CREATE INDEX "PersonPlan_personId_dueDate_idx" ON "PersonPlan"("personId", "dueDate");
CREATE INDEX "PersonPlan_personId_targetDate_idx" ON "PersonPlan"("personId", "targetDate");
CREATE INDEX "PersonPlan_personId_deletedAt_idx" ON "PersonPlan"("personId", "deletedAt");
CREATE INDEX "PersonPlanMilestone_planId_position_idx" ON "PersonPlanMilestone"("planId", "position");
CREATE INDEX "PersonPlanMilestone_planId_deletedAt_idx" ON "PersonPlanMilestone"("planId", "deletedAt");
ALTER TABLE "PersonPlan" ADD CONSTRAINT "PersonPlan_personId_fkey" FOREIGN KEY ("personId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonPlan" ADD CONSTRAINT "PersonPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PersonPlanMilestone" ADD CONSTRAINT "PersonPlanMilestone_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PersonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
