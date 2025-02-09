import { pgTable, text, serial, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Existing tables remain unchanged
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
  }>().notNull().default({ sent: 0, opened: 0, clicked: 0 }),
  status: text("status").notNull().default("draft"),
});

// New email_templates table
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  variables: jsonb("variables").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Define flow schema explicitly for better validation
const flowSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number()
    }),
    data: z.object({
      label: z.string()
    }).catchall(z.any())
  })),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string()
  }))
});

// Update insert schemas to include flow validation
export const insertJourneySchema = createInsertSchema(journeys, {
  status: z.string().default("draft"),
  description: z.string().optional(),
  flow: flowSchema
}).omit({ id: true });

export const insertCampaignSchema = createInsertSchema(campaigns, {
  status: z.string().default("draft"),
  metrics: z.object({
    sent: z.number(),
    opened: z.number(),
    clicked: z.number()
  }).default({ sent: 0, opened: 0, clicked: 0 }),
  journeyId: z.number().optional()
}).omit({ id: true });

// Email template insert schema
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates)
  .extend({
    variables: z.array(z.string()).default([])
  })
  .omit({ id: true, createdAt: true, updatedAt: true });

export type Journey = typeof journeys.$inferSelect;
export type InsertJourney = z.infer<typeof insertJourneySchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;