import { journeys, campaigns, type Journey, type InsertJourney, type Campaign, type InsertCampaign } from "@shared/schema";

export interface IStorage {
  // Journey operations
  getJourneys(): Promise<Journey[]>;
  getJourney(id: number): Promise<Journey | undefined>;
  createJourney(journey: InsertJourney): Promise<Journey>;
  updateJourney(id: number, journey: Partial<Journey>): Promise<Journey | undefined>;

  // Campaign operations
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign | undefined>;
}

export class MemStorage implements IStorage {
  private journeys: Map<number, Journey>;
  private campaigns: Map<number, Campaign>;
  private journeyId: number;
  private campaignId: number;

  constructor() {
    this.journeys = new Map();
    this.campaigns = new Map();
    this.journeyId = 1;
    this.campaignId = 1;

    // Add some mock data
    this.createJourney({
      name: "Welcome Flow",
      description: "Onboard new users",
      prompt: "Create a welcome flow that sends an email on signup",
      flow: {
        nodes: [],
        edges: []
      }
    });
  }

  async getJourneys(): Promise<Journey[]> {
    return Array.from(this.journeys.values());
  }

  async getJourney(id: number): Promise<Journey | undefined> {
    return this.journeys.get(id);
  }

  async createJourney(journey: InsertJourney): Promise<Journey> {
    const id = this.journeyId++;
    const newJourney = {
      ...journey,
      id,
      status: "draft",
      description: journey.description || null
    } as Journey;

    this.journeys.set(id, newJourney);
    return newJourney;
  }

  async updateJourney(id: number, update: Partial<Journey>): Promise<Journey | undefined> {
    const journey = this.journeys.get(id);
    if (!journey) return undefined;

    const updatedJourney = { ...journey, ...update };
    this.journeys.set(id, updatedJourney);
    return updatedJourney;
  }

  async getCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const id = this.campaignId++;
    const newCampaign = {
      ...campaign,
      id,
      status: "draft",
      journeyId: campaign.journeyId || null,
      metrics: {
        sent: 0,
        opened: 0,
        clicked: 0
      }
    } as Campaign;

    this.campaigns.set(id, newCampaign);
    return newCampaign;
  }

  async updateCampaign(id: number, update: Partial<Campaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;

    const updatedCampaign = { ...campaign, ...update };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }
}

export const storage = new MemStorage();