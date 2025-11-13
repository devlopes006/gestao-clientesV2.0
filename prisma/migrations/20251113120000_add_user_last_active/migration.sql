-- Add a lastActiveAt column to track user activity timestamps
ALTER TABLE "User" ADD COLUMN "lastActiveAt" TIMESTAMP(3);
