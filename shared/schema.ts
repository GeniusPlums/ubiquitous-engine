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

// New analytics tables
export const journeyMetrics = pgTable("journey_metrics", {
  id: serial("id").primaryKey(),
  journeyId: integer("journey_id").references(() => journeys.id).notNull(),
  totalUsers: integer("total_users").notNull().default(0),
  completionRate: integer("completion_rate").notNull().default(0),
  averageDuration: integer("average_duration").notNull().default(0),
  bounceRate: integer("bounce_rate").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const journeyVariants = pgTable("journey_variants", {
  id: serial("id").primaryKey(),
  journeyId: integer("journey_id").references(() => journeys.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
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
  metrics: jsonb("metrics").$type<{
    conversions: number;
    totalUsers: number;
    completionRate: number;
  }>().notNull().default({ conversions: 0, totalUsers: 0, completionRate: 0 }),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const journeyEvents = pgTable("journey_events", {
  id: serial("id").primaryKey(),
  journeyId: integer("journey_id").references(() => journeys.id).notNull(),
  variantId: integer("variant_id").references(() => journeyVariants.id),
  eventType: text("event_type").notNull(),
  eventData: jsonb("event_data").notNull(),
  userId: text("user_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Existing tables continue...
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

// Email templates table remains unchanged
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  variables: jsonb("variables").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schema validations
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

// Insert schemas for new tables
export const insertJourneyMetricsSchema = createInsertSchema(journeyMetrics)
  .omit({ id: true, updatedAt: true });

export const insertJourneyVariantSchema = createInsertSchema(journeyVariants, {
  status: z.string().default("active"),
  description: z.string().optional(),
  flow: flowSchema,
  metrics: z.object({
    conversions: z.number(),
    totalUsers: z.number(),
    completionRate: z.number()
  }).default({ conversions: 0, totalUsers: 0, completionRate: 0 })
}).omit({ id: true, createdAt: true });

export const insertJourneyEventSchema = createInsertSchema(journeyEvents)
  .omit({ id: true });

// Existing insert schemas remain unchanged
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

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates)
  .extend({
    variables: z.array(z.string()).default([])
  })
  .omit({ id: true, createdAt: true, updatedAt: true });

// Export types
export type Journey = typeof journeys.$inferSelect;
export type InsertJourney = z.infer<typeof insertJourneySchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type JourneyMetrics = typeof journeyMetrics.$inferSelect;
export type InsertJourneyMetrics = z.infer<typeof insertJourneyMetricsSchema>;
export type JourneyVariant = typeof journeyVariants.$inferSelect;
export type InsertJourneyVariant = z.infer<typeof insertJourneyVariantSchema>;
export type JourneyEvent = typeof journeyEvents.$inferSelect;
export type InsertJourneyEvent = z.infer<typeof insertJourneyEventSchema>;