-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "trialEndsAt" TIMESTAMP(3),
ADD COLUMN "isTrialExpired" BOOLEAN NOT NULL DEFAULT false;








