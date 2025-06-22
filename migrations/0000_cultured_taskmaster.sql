-- Add new columns to existing users table
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN "preferred_payment_methods" jsonb;
ALTER TABLE "users" ADD COLUMN "geographic_regions" jsonb;

-- Drop the old payment_methods table if it exists
DROP TABLE IF EXISTS "payment_methods";

-- Create the new user_payment_methods table
CREATE TABLE "user_payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"details" jsonb NOT NULL,
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_payment_methods" ADD CONSTRAINT "user_payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
