import { pgTable, text, serial, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const journeys = pgTable("journeys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(),
  flow: jsonb("flow").$type<{
    nodes: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: { label: string; [key: string]: any };
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
    }>;
  }>().notNull(),
  status: text("status").notNull().default("draft"),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  journeyId: integer("journey_id").references(() => journeys.id),
  name: text("name").notNull(),
  template: jsonb("template").$type<{
    subject: string;
    body: string;
  }>().notNull(),
  segments: jsonb("segments").$type<Array<{
    name: string;
    conditions: Array<{
      field: string;
      operator: string;
      value: string;
    }>;
  }>>().notNull(),
  metrics: jsonb("metrics").$type<{
    sent: number;
    opened: number;
    clicked: number;
  }>().notNull().default({}),
  status: text("status").notNull().default("draft"),
});

export const insertJourneySchema = createInsertSchema(journeys).omit({ 
  id: true,
  status: true 
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({ 
  id: true,
  status: true,
  metrics: true 
});

export type Journey = typeof journeys.$inferSelect;
export type InsertJourney = z.infer<typeof insertJourneySchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;