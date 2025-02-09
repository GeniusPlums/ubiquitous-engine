import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateFlowFromPrompt } from "./openai";
import { insertJourneySchema, insertCampaignSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export function registerRoutes(app: Express): Server {
  // Journeys
  app.get("/api/journeys", async (req, res) => {
    const journeys = await storage.getJourneys();
    res.json(journeys);
  });

  app.get("/api/journeys/:id", async (req, res) => {
    const journey = await storage.getJourney(parseInt(req.params.id));
    if (!journey) return res.status(404).json({ message: "Journey not found" });
    res.json(journey);
  });

  app.post("/api/journeys", async (req, res) => {
    try {
      const parsed = insertJourneySchema.safeParse(req.body);
      if (!parsed.success) {
        const error = fromZodError(parsed.error);
        return res.status(400).json({ message: error.message });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const flow = await generateFlowFromPrompt(parsed.data.prompt);
      const journey = await storage.createJourney({
        ...parsed.data,
        flow
      });
      res.json(journey);
    } catch (error: any) {
      console.error("Journey creation error:", error);
      res.status(500).json({ message: error.message || "Failed to create journey" });
    }
  });

  // Campaigns
  app.get("/api/campaigns", async (req, res) => {
    const campaigns = await storage.getCampaigns();
    res.json(campaigns);
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    const campaign = await storage.getCampaign(parseInt(req.params.id));
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    res.json(campaign);
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const parsed = insertCampaignSchema.safeParse(req.body);
      if (!parsed.success) {
        const error = fromZodError(parsed.error);
        return res.status(400).json({ message: error.message });
      }

      const campaign = await storage.createCampaign(parsed.data);
      res.json(campaign);
    } catch (error: any) {
      console.error("Campaign creation error:", error);
      res.status(500).json({ message: error.message || "Failed to create campaign" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}