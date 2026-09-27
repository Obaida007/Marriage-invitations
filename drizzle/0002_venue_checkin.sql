ALTER TABLE `invitations` ADD `checkin_code` text;--> statement-breakpoint
ALTER TABLE `invitations` ADD `self_checkin` integer DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_checkin_code_unique` ON `invitations` (`checkin_code`);