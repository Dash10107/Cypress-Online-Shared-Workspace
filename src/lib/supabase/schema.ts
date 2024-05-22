
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { prices, products, subscription_status, users } from "../../../migrations/schema";
import { relations, sql } from "drizzle-orm";

export const workspaces = pgTable('workspaces',{
    id:uuid('id').defaultRandom().primaryKey().notNull(),
    created_at:timestamp('created_at',{
        withTimezone:true,
        mode:'string',
    }),
    workspace_owner:uuid('workspace_owner').notNull(),
    title:text('title').notNull(),
    icon_id:text('icon_id').notNull(),
    data:text('data'),
    in_trash:text('in_trash'),
    logo:text('logo'),
    banner_url:text('banner_url')
});

export const folders = pgTable('folders',{
    id:uuid('id').defaultRandom().primaryKey().notNull(),
    created_at:timestamp('created_at',{
        withTimezone:true,
        mode:'string',
    }),
    title:text('title').notNull(),
    icon_id:text('icon_id').notNull(),
    data:text('data'),
    in_trash:text('in_trash'),
    logo:text('logo'),
    banner_url:text('banner_url'),
    workspace_id:uuid('workspace_id').references(()=>workspaces.id,{
        onDelete:'cascade',
    })
});

export const files = pgTable('files',{
    id:uuid('id').defaultRandom().primaryKey().notNull(),
    created_at:timestamp('created_at',{
        withTimezone:true,
        mode:'string',
    }),
    title:text('title').notNull(),
    icon_id:text('icon_id').notNull(),
    data:text('data'),
    in_trash:text('in_trash'),
    logo:text('logo'),
    banner_url:text('banner_url'),
    workspace_id:uuid('workspace_id').references(()=>workspaces.id,{
        onDelete:'cascade',
    }),
    folder_id:uuid('folder_id').references(()=>folders.id,{
        onDelete:'cascade',
    })

});

export const subscriptions = pgTable("subscriptions", {
	id: text("id").primaryKey().notNull(),
	user_id: uuid("user_id").notNull().references(() => users.id),
	status: subscription_status("status"),
	metadata: jsonb("metadata"),
	price_id: text("price_id").references(() => prices.id),
	quantity: integer("quantity"),
	cancel_at_period_end: boolean("cancel_at_period_end"),
	created: timestamp("created", { withTimezone: true, mode: 'string' }).default(sql`now()`).notNull(),
	current_period_start: timestamp("current_period_start", { withTimezone: true, mode: 'string' }).default(sql`now()`).notNull(),
	current_period_end: timestamp("current_period_end", { withTimezone: true, mode: 'string' }).default(sql`now()`).notNull(),
	ended_at: timestamp("ended_at", { withTimezone: true, mode: 'string' }).default(sql`now()`),
	cancel_at: timestamp("cancel_at", { withTimezone: true, mode: 'string' }).default(sql`now()`),
	canceled_at: timestamp("canceled_at", { withTimezone: true, mode: 'string' }).default(sql`now()`),
	trial_start: timestamp("trial_start", { withTimezone: true, mode: 'string' }).default(sql`now()`),
	trial_end: timestamp("trial_end", { withTimezone: true, mode: 'string' }).default(sql`now()`),
});

export const collaborators = pgTable('collaborators', {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    workspace_id: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', {
      withTimezone: true,
      mode: 'string',
    })
      .defaultNow()
      .notNull(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  });
  
  //Dont Delete!!!
  export const productsRelations = relations(products, ({ many }) => ({
    prices: many(prices),
  }));
  
  export const pricesRelations = relations(prices, ({ one }) => ({
    product: one(products, {
      fields: [prices.product_id],
      references: [products.id],
    }),
  }));