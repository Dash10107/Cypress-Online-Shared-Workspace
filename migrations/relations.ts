import { relations } from "drizzle-orm/relations";
import { folders, files, workspaces, users, subscriptions } from "./schema";

export const filesRelations = relations(files, ({one}) => ({
	folder: one(folders, {
		fields: [files.folder_id],
		references: [folders.id]
	}),
	workspace: one(workspaces, {
		fields: [files.workspace_id],
		references: [workspaces.id]
	}),
}));

export const foldersRelations = relations(folders, ({one, many}) => ({
	files: many(files),
	workspace: one(workspaces, {
		fields: [folders.workspace_id],
		references: [workspaces.id]
	}),
}));

export const workspacesRelations = relations(workspaces, ({many}) => ({
	files: many(files),
	folders: many(folders),
}));

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	usersInAuth: one(users, {
		fields: [subscriptions.user_id],
		references: [users.id]
	}),
}));

export const usersInAuthRelations = relations(users, ({many}) => ({
	subscriptions: many(subscriptions),
}));