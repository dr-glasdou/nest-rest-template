CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_active_uq" ON "user" ("username") WHERE "deleted_at" is null;