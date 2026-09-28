CREATE TABLE `slug_aliases` (
	`slug` text PRIMARY KEY NOT NULL,
	`invitation_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`invitation_id`) REFERENCES `invitations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `slug_aliases_invitation_idx` ON `slug_aliases` (`invitation_id`);