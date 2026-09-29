CREATE TABLE "games" (
	"id" text PRIMARY KEY NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"duration_min" integer NOT NULL,
	"location_name" text NOT NULL,
	"location_address" text NOT NULL,
	"max_players" integer NOT NULL,
	"team_count" integer NOT NULL,
	"notes" text NOT NULL,
	"ball_player_id" text,
	"bibs_player_id" text,
	"teams" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"login" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"skill" smallint NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_login_unique" UNIQUE("login"),
	CONSTRAINT "players_skill_range" CHECK ("players"."skill" between 1 and 5),
	CONSTRAINT "players_role_valid" CHECK ("players"."role" in ('admin', 'player'))
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"game_id" text NOT NULL,
	"player_id" text NOT NULL,
	"status" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "registrations_game_id_player_id_pk" PRIMARY KEY("game_id","player_id"),
	CONSTRAINT "registrations_status_valid" CHECK ("registrations"."status" in ('confirmed', 'maybe'))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_ball_player_id_players_id_fk" FOREIGN KEY ("ball_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_bibs_player_id_players_id_fk" FOREIGN KEY ("bibs_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "games_starts_at_idx" ON "games" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "sessions_player_idx" ON "sessions" USING btree ("player_id");