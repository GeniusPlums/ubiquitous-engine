import { pgTable, text, serial, integer, jsonb, timestamp, boolean, PgArray, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Existing tables remain unchanged until segments table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  acceptsMarketing: boolean("accepts_marketing").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Billing info
  billingName: text("billing_name"),
  billingStreet: text("billing_street"),
  billingAddress1: text("billing_address1"),
  billingAddress2: text("billing_address2"),
  billingCompany: text("billing_company"),
  billingCity: text("billing_city"),
  billingZip: text("billing_zip"),
  billingProvince: text("billing_province"),
  billingCountry: text("billing_country"),
  billingPhone: text("billing_phone"),
  // Shipping info
  shippingName: text("shipping_name"),
  shippingStreet: text("shipping_street"),
  shippingAddress1: text("shipping_address1"),
  shippingAddress2: text("shipping_address2"),
  shippingCompany: text("shipping_company"),
  shippingCity: text("shipping_city"),
  shippingZip: text("shipping_zip"),
  shippingProvince: text("shipping_province"),
  shippingCountry: text("shipping_country"),
  shippingPhone: text("shipping_phone"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(), // e.g. "#1001"
  customerId: integer("customer_id").references(() => customers.id),
  financialStatus: text("financial_status"), // paid, voided, etc.
  paidAt: timestamp("paid_at"),
  fulfillmentStatus: text("fulfillment_status"),
  fulfilledAt: timestamp("fulfilled_at"),
  currency: text("currency"),
  subtotal: numeric("subtotal"),
  shipping: numeric("shipping"),
  taxes: numeric("taxes"),
  total: numeric("total"),
  discountCode: text("discount_code"),
  discountAmount: numeric("discount_amount"),
  shippingMethod: text("shipping_method"),
  createdAt: timestamp("created_at").notNull(),
  paymentMethod: text("payment_method"),
  paymentReference: text("payment_reference"),
  refundedAmount: numeric("refunded_amount"),
  outstandingBalance: numeric("outstanding_balance"),
  notes: text("notes"),
  tags: text("tags"),
  riskLevel: text("risk_level"),
  source: text("source"),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  quantity: integer("quantity"),
  name: text("name"),
  price: numeric("price"),
  compareAtPrice: numeric("compare_at_price"),
  sku: text("sku"),
  requiresShipping: boolean("requires_shipping"),
  taxable: boolean("taxable"),
  fulfillmentStatus: text("fulfillment_status"),
  discount: numeric("discount"),
});

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
  templateId: integer("template_id").references(() => emailTemplates.id),
  active: boolean("active").notNull().default(true),
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

// New tables for audience segmentation
export const segments = pgTable("segments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'manual' or 'ai'
  conditions: jsonb("conditions").$type<Array<{
    field: string;
    operator: string;
    value: any;
    type?: string; // For behavioral conditions
    timeframe?: string;
  }>>().notNull(),
  aiPrompt: text("ai_prompt"), // Used for AI-generated segments
  metrics: jsonb("metrics").$type<{
    totalMembers: number;
    engagementRate: number;
    conversionRate: number;
    lastUpdated: string;
  }>().notNull().default({
    totalMembers: 0,
    engagementRate: 0,
    conversionRate: 0,
    lastUpdated: new Date().toISOString()
  }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const segmentMembers = pgTable("segment_members", {
  id: serial("id").primaryKey(),
  segmentId: integer("segment_id").references(() => segments.id).notNull(),
  userId: text("user_id").notNull(),
  attributes: jsonb("attributes").notNull(), // Store user attributes for faster filtering
  addedAt: timestamp("added_at").notNull().defaultNow(),
  lastEngaged: timestamp("last_engaged"),
});

export const segmentAnalytics = pgTable("segment_analytics", {
  id: serial("id").primaryKey(),
  segmentId: integer("segment_id").references(() => segments.id).notNull(),
  date: timestamp("date").notNull(),
  metrics: jsonb("metrics").$type<{
    memberCount: number;
    engagementRate: number;
    conversionRate: number;
    campaignPerformance: {
      sent: number;
      opened: number;
      clicked: number;
    };
  }>().notNull(),
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
  journeyId: z.number().optional(),
  active: z.boolean().default(true),
  templateId: z.number()
}).omit({ id: true });

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates)
  .extend({
    variables: z.array(z.string()).default([])
  })
  .omit({ id: true, createdAt: true, updatedAt: true });

// Add insert schemas for new tables
export const insertSegmentSchema = createInsertSchema(segments, {
  type: z.enum(["manual", "ai"]),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any(),
    type: z.string().optional(),
    timeframe: z.string().optional()
  })),
  aiPrompt: z.string().optional(),
  isActive: z.boolean().default(true)
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertSegmentMemberSchema = createInsertSchema(segmentMembers)
  .omit({ id: true, addedAt: true, lastEngaged: true });

export const insertSegmentAnalyticsSchema = createInsertSchema(segmentAnalytics)
  .omit({ id: true });

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true
});


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
// Export new types
export type Segment = typeof segments.$inferSelect;
export type InsertSegment = z.infer<typeof insertSegmentSchema>;
export type SegmentMember = typeof segmentMembers.$inferSelect;
export type InsertSegmentMember = z.infer<typeof insertSegmentMemberSchema>;
export type SegmentAnalytics = typeof segmentAnalytics.$inferSelect;
export type InsertSegmentAnalytics = z.infer<typeof insertSegmentAnalyticsSchema>;
// Add Template type alias for EmailTemplate
export type Template = EmailTemplate;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;