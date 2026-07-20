-- CreateEnum
CREATE TYPE "EmailNotificationType" AS ENUM ('DEADLINE_REMINDER', 'OVERDUE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "email_deadline_reminders" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "email_overdue_notifications" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "email_notification_deliveries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "type" "EmailNotificationType" NOT NULL,
    "due_date_key" VARCHAR(40) NOT NULL,
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_notification_deliveries_user_id_type_idx" ON "email_notification_deliveries"("user_id", "type");

-- CreateIndex
CREATE INDEX "email_notification_deliveries_sent_at_idx" ON "email_notification_deliveries"("sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_notification_deliveries_task_id_type_due_date_key_key" ON "email_notification_deliveries"("task_id", "type", "due_date_key");

-- CreateIndex
CREATE INDEX "tasks_due_date_status_idx" ON "tasks"("due_date", "status");

-- AddForeignKey
ALTER TABLE "email_notification_deliveries" ADD CONSTRAINT "email_notification_deliveries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification_deliveries" ADD CONSTRAINT "email_notification_deliveries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
