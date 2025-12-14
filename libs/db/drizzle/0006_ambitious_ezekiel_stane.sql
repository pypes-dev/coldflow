CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'completed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."email_account_status" AS ENUM('connected', 'disconnected', 'error');--> statement-breakpoint
CREATE TYPE "public"."email_event_type" AS ENUM('sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."email_provider" AS ENUM('gmail', 'outlook', 'imap');--> statement-breakpoint
CREATE TYPE "public"."email_queue_status" AS ENUM('pending', 'processing', 'sent', 'failed', 'bounced');--> statement-breakpoint
CREATE TABLE "email_account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"sub_agency_id" text,
	"email" text NOT NULL,
	"provider" "email_provider" NOT NULL,
	"encrypted_access_token" text,
	"encrypted_refresh_token" text,
	"token_expires_at" timestamp,
	"scopes" text,
	"status" "email_account_status" DEFAULT 'connected' NOT NULL,
	"daily_quota" integer DEFAULT 500 NOT NULL,
	"quota_used_today" integer DEFAULT 0 NOT NULL,
	"quota_reset_at" timestamp,
	"last_synced_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_campaign" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"sub_agency_id" text,
	"name" text NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"open_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"bounce_count" integer DEFAULT 0 NOT NULL,
	"unsubscribe_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_event" (
	"id" text PRIMARY KEY NOT NULL,
	"queue_id" text NOT NULL,
	"tracking_id" text NOT NULL,
	"event_type" "email_event_type" NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "email_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"email_account_id" text NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"subject" text NOT NULL,
	"body_html" text,
	"body_text" text,
	"scheduled_for" timestamp DEFAULT now() NOT NULL,
	"status" "email_queue_status" DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_attempt_at" timestamp,
	"sent_at" timestamp,
	"error_message" text,
	"tracking_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_queue_tracking_id_unique" UNIQUE("tracking_id")
);
--> statement-breakpoint
CREATE TABLE "email_template" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"sub_agency_id" text,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body_html" text,
	"body_text" text,
	"variables" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_unsubscribe" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"reason" text,
	"campaign_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_unsubscribe_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "email_account" ADD CONSTRAINT "email_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_account" ADD CONSTRAINT "email_account_sub_agency_id_sub_agency_id_fk" FOREIGN KEY ("sub_agency_id") REFERENCES "public"."sub_agency"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaign" ADD CONSTRAINT "email_campaign_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaign" ADD CONSTRAINT "email_campaign_sub_agency_id_sub_agency_id_fk" FOREIGN KEY ("sub_agency_id") REFERENCES "public"."sub_agency"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_event" ADD CONSTRAINT "email_event_queue_id_email_queue_id_fk" FOREIGN KEY ("queue_id") REFERENCES "public"."email_queue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_campaign_id_email_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_email_account_id_email_account_id_fk" FOREIGN KEY ("email_account_id") REFERENCES "public"."email_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_template" ADD CONSTRAINT "email_template_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_template" ADD CONSTRAINT "email_template_sub_agency_id_sub_agency_id_fk" FOREIGN KEY ("sub_agency_id") REFERENCES "public"."sub_agency"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_unsubscribe" ADD CONSTRAINT "email_unsubscribe_campaign_id_email_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaign"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_account_userId_idx" ON "email_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_account_subAgencyId_idx" ON "email_account" USING btree ("sub_agency_id");--> statement-breakpoint
CREATE INDEX "email_account_email_idx" ON "email_account" USING btree ("email");--> statement-breakpoint
CREATE INDEX "email_account_status_idx" ON "email_account" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_account_tokenExpiresAt_idx" ON "email_account" USING btree ("token_expires_at");--> statement-breakpoint
CREATE INDEX "email_campaign_userId_idx" ON "email_campaign" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_campaign_subAgencyId_idx" ON "email_campaign" USING btree ("sub_agency_id");--> statement-breakpoint
CREATE INDEX "email_campaign_status_idx" ON "email_campaign" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_event_queueId_idx" ON "email_event" USING btree ("queue_id");--> statement-breakpoint
CREATE INDEX "email_event_trackingId_idx" ON "email_event" USING btree ("tracking_id");--> statement-breakpoint
CREATE INDEX "email_event_eventType_idx" ON "email_event" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "email_event_timestamp_idx" ON "email_event" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "email_queue_campaignId_idx" ON "email_queue" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "email_queue_emailAccountId_idx" ON "email_queue" USING btree ("email_account_id");--> statement-breakpoint
CREATE INDEX "email_queue_status_idx" ON "email_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_queue_scheduledFor_idx" ON "email_queue" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "email_queue_trackingId_idx" ON "email_queue" USING btree ("tracking_id");--> statement-breakpoint
CREATE INDEX "email_queue_status_scheduledFor_idx" ON "email_queue" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "email_template_userId_idx" ON "email_template" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_template_subAgencyId_idx" ON "email_template" USING btree ("sub_agency_id");--> statement-breakpoint
CREATE INDEX "email_unsubscribe_email_idx" ON "email_unsubscribe" USING btree ("email");