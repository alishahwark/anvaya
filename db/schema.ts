import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const policies = sqliteTable("policies", { id: integer("id").primaryKey({ autoIncrement: true }), slug: text("slug", { length: 120 }).notNull().unique(), title: text("title", { length: 240 }).notNull(), status: text("status", { length: 32 }).notNull(), summary: text("summary").notNull(), updatedAt: text("updated_at").notNull() });
export const milestones = sqliteTable("milestones", { id: integer("id").primaryKey({ autoIncrement: true }), policyId: integer("policy_id").notNull(), label: text("label").notNull(), date: text("date"), detail: text("detail").notNull(), isVerified: integer("is_verified", { mode: "boolean" }).notNull() });
export const evidence = sqliteTable("evidence", { id: integer("id").primaryKey({ autoIncrement: true }), policyId: integer("policy_id").notNull(), title: text("title").notNull(), publisher: text("publisher").notNull(), sourceType: text("source_type").notNull(), url: text("url").notNull(), claim: text("claim").notNull() });
export type Policy = typeof policies.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
