CREATE TABLE "permission" (
	"id" text PRIMARY KEY,
	"module" text NOT NULL,
	"action" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permission" (
	"role_id" text,
	"permission_id" text,
	CONSTRAINT "role_permission_pkey" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "role" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"user_id" text,
	"role_id" text,
	CONSTRAINT "user_role_pkey" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "permission_module_action_uq" ON "permission" ("module","action");--> statement-breakpoint
CREATE INDEX "role_permission_permission_id_idx" ON "role_permission" ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_name_uq" ON "role" ("name");--> statement-breakpoint
CREATE INDEX "user_role_role_id_idx" ON "user_role" ("role_id");--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE;