import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateFlowFromPrompt } from "./openai";
import { insertJourneySchema, insertCampaignSchema, insertEmailTemplateSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import OpenAI from "openai";

// Initialize OpenAI
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

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
      // First validate the basic journey data without flow
      const { prompt, ...journeyData } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Generate flow from the prompt
      const flow = await generateFlowFromPrompt(prompt);

      // Now validate the complete journey data including the generated flow
      const completeJourneyData = {
        ...journeyData,
        prompt,
        flow
      };

      const parsed = insertJourneySchema.safeParse(completeJourneyData);
      if (!parsed.success) {
        const error = fromZodError(parsed.error);
        return res.status(400).json({ message: error.message });
      }

      const journey = await storage.createJourney(parsed.data);
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

  // Email Templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Template fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.getEmailTemplate(parseInt(req.params.id));
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error: any) {
      console.error("Template fetch error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch template" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const parsed = insertEmailTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        const error = fromZodError(parsed.error);
        return res.status(400).json({ message: error.message });
      }

      const template = await storage.createEmailTemplate(parsed.data);
      res.json(template);
    } catch (error: any) {
      console.error("Template creation error:", error);
      res.status(500).json({ message: error.message || "Failed to create template" });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      await storage.deleteEmailTemplate(parseInt(req.params.id));
      res.status(204).end();
    } catch (error: any) {
      console.error("Template deletion error:", error);
      res.status(500).json({ message: error.message || "Failed to delete template" });
    }
  });

  // New route for generating email template from prompt
  app.post("/api/templates/generate", async (req, res) => {
    try {
      if (!openai) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert email template creator. Generate HTML email content based on the given prompt. Include appropriate variables like {{user.name}}, {{user.email}}, {{company.name}}, and {{date}} where relevant."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("Failed to generate template");
      }

      // Parse the response to extract subject and body
      const subjectMatch = response.match(/Subject:(.*?)(?=Body:|$)/s);
      const bodyMatch = response.match(/Body:(.*?)$/s);

      const template = {
        subject: subjectMatch ? subjectMatch[1].trim() : "Generated Email",
        body: bodyMatch ? bodyMatch[1].trim() : response,
      };

      res.json(template);
    } catch (error: any) {
      console.error("Template generation error:", error);
      res.status(500).json({ message: error.message || "Failed to generate template" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}