ALTER TABLE "users" ADD COLUMN "email_verification_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_verification_token_unique" UNIQUE("email_verification_token");