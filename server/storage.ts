import { customers, orders, orderItems, type Customer, type InsertCustomer, 
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem, journeys, 
  campaigns, emailTemplates, journeyMetrics, journeyVariants, journeyEvents,
  type Journey, type InsertJourney, type Campaign, type InsertCampaign,
  type EmailTemplate, type InsertEmailTemplate, type JourneyMetrics, type InsertJourneyMetrics,
  type JourneyVariant, type InsertJourneyVariant, type JourneyEvent, type InsertJourneyEvent
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Customer operations
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomer(id: number): Promise<Customer | undefined>;

  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;

  // Order item operations
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  getOrderItem(id: number): Promise<OrderItem | undefined>;

  // Journey operations
  getJourneys(): Promise<Journey[]>;
  getJourney(id: number): Promise<Journey | undefined>;
  createJourney(journey: InsertJourney): Promise<Journey>;
  updateJourney(id: number, journey: Partial<Journey>): Promise<Journey | undefined>;

  // Journey metrics operations
  getJourneyMetrics(journeyId: number): Promise<JourneyMetrics | undefined>;
  updateJourneyMetrics(journeyId: number, metrics: Partial<JourneyMetrics>): Promise<JourneyMetrics>;

  // Journey variants operations
  getJourneyVariants(journeyId: number): Promise<JourneyVariant[]>;
  createJourneyVariant(variant: InsertJourneyVariant): Promise<JourneyVariant>;
  updateJourneyVariant(id: number, variant: Partial<JourneyVariant>): Promise<JourneyVariant | undefined>;

  // Journey events operations
  getJourneyEvents(journeyId: number): Promise<JourneyEvent[]>;
  createJourneyEvent(event: InsertJourneyEvent): Promise<JourneyEvent>;

  // Campaign operations
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign | undefined>;

  // Email template operations
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  deleteEmailTemplate(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Customer operations
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  // Order operations
  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  // Order item operations
  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    const [orderItem] = await db.select().from(orderItems).where(eq(orderItems.id, id));
    return orderItem;
  }

  // Journey operations
  async getJourneys(): Promise<Journey[]> {
    return await db.select().from(journeys);
  }

  async getJourney(id: number): Promise<Journey | undefined> {
    const [journey] = await db.select().from(journeys).where(eq(journeys.id, id));
    return journey;
  }

  async createJourney(journey: InsertJourney): Promise<Journey> {
    const [newJourney] = await db.insert(journeys).values(journey).returning();
    return newJourney;
  }

  async updateJourney(id: number, update: Partial<Journey>): Promise<Journey | undefined> {
    const [updated] = await db.update(journeys).set(update).where(eq(journeys.id, id)).returning();
    return updated;
  }

  // Journey metrics operations
  async getJourneyMetrics(journeyId: number): Promise<JourneyMetrics | undefined> {
    const [metrics] = await db.select().from(journeyMetrics).where(eq(journeyMetrics.journeyId, journeyId));
    return metrics;
  }

  async updateJourneyMetrics(journeyId: number, metrics: Partial<JourneyMetrics>): Promise<JourneyMetrics> {
    const [existing] = await db.select().from(journeyMetrics).where(eq(journeyMetrics.journeyId, journeyId));

    if (existing) {
      const [updated] = await db.update(journeyMetrics)
        .set({ ...metrics, updatedAt: new Date() })
        .where(eq(journeyMetrics.journeyId, journeyId))
        .returning();
      return updated;
    } else {
      const [newMetrics] = await db.insert(journeyMetrics)
        .values({ ...metrics as InsertJourneyMetrics, journeyId })
        .returning();
      return newMetrics;
    }
  }

  // Journey variants operations
  async getJourneyVariants(journeyId: number): Promise<JourneyVariant[]> {
    return await db.select().from(journeyVariants).where(eq(journeyVariants.journeyId, journeyId));
  }

  async createJourneyVariant(variant: InsertJourneyVariant): Promise<JourneyVariant> {
    const [newVariant] = await db.insert(journeyVariants).values(variant).returning();
    return newVariant;
  }

  async updateJourneyVariant(id: number, update: Partial<JourneyVariant>): Promise<JourneyVariant | undefined> {
    const [updated] = await db.update(journeyVariants).set(update).where(eq(journeyVariants.id, id)).returning();
    return updated;
  }

  // Journey events operations
  async getJourneyEvents(journeyId: number): Promise<JourneyEvent[]> {
    return await db.select().from(journeyEvents).where(eq(journeyEvents.journeyId, journeyId));
  }

  async createJourneyEvent(event: InsertJourneyEvent): Promise<JourneyEvent> {
    const [newEvent] = await db.insert(journeyEvents).values(event).returning();
    return newEvent;
  }

  // Campaign operations
  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns);
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateCampaign(id: number, update: Partial<Campaign>): Promise<Campaign | undefined> {
    const [updated] = await db.update(campaigns).set(update).where(eq(campaigns.id, id)).returning();
    return updated;
  }

  // Email template operations
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates);
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values(template).returning();
    return newTemplate;
  }

  async deleteEmailTemplate(id: number): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }
}

export const storage = new DatabaseStorage();