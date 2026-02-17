CREATE TABLE "agents" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "agents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text DEFAULT 'Premium Agent' NOT NULL,
	"role" text DEFAULT 'agent' NOT NULL,
	"subscription_tier" text DEFAULT 'free' NOT NULL,
	"organization_id" integer,
	"is_admin" boolean DEFAULT false NOT NULL,
	CONSTRAINT "agents_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "buyers" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"processed" integer DEFAULT 0 NOT NULL,
	"succeeded" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "leads_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"property_id" integer NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"agent_id" text,
	"buyer_id" text,
	"buyer_vector" json,
	"listing_vector" json,
	"top_buyer_vibes" json,
	"top_listing_vibes" json,
	"match_score" integer DEFAULT 0 NOT NULL,
	"talk_track" text,
	"avoid_list" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"recipient_id" text NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"priority" text NOT NULL,
	"read_status" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organizations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"subscription_tier" text DEFAULT 'free' NOT NULL,
	"logo_url" text,
	"invite_code" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "organizations_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "properties_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price" real NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" integer NOT NULL,
	"sqft" integer NOT NULL,
	"location" text NOT NULL,
	"images" json DEFAULT '[]'::json NOT NULL,
	"agent_id" text DEFAULT 'agent-1' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"vibe" text DEFAULT 'Purist' NOT NULL,
	"vibe_tag" text DEFAULT 'Unclassified' NOT NULL,
	"source_url" text,
	"vibe_vector" json,
	"vibe_top" json,
	"vibe_rationale" json,
	"vibe_version" text,
	"tags" json DEFAULT '[]'::json NOT NULL,
	"organization_id" integer
);
--> statement-breakpoint
CREATE TABLE "staging_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"staging_job_id" text NOT NULL,
	"vibe_id" text NOT NULL,
	"image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "staging_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"batch_id" text NOT NULL,
	"agent_id" text,
	"buyer_id" text,
	"listing_id" integer,
	"vibe_id" text NOT NULL,
	"room_type" text NOT NULL,
	"input_image_url" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"output_image_url" text,
	"prompt_used" text NOT NULL,
	"negative_prompt_used" text NOT NULL,
	"quality_flags" json,
	"error" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "staging_results" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "staging_results_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"property_id" integer NOT NULL,
	"vibe" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"progress_step" text DEFAULT 'Analyzing Room' NOT NULL,
	"image_url" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "swipe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"buyer_id" text NOT NULL,
	"listing_id" integer NOT NULL,
	"action" text NOT NULL,
	"dwell_ms" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "swipes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "swipes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"session_id" text NOT NULL,
	"property_id" integer NOT NULL,
	"direction" text NOT NULL,
	"match_score" integer DEFAULT 0 NOT NULL,
	"dwell_ms" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sync_requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sync_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"website_url" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"imported_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "verification_codes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
