import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { parse } from "csv-parse";
import {
  insertJourneySchema, insertCampaignSchema, insertEmailTemplateSchema,
  insertJourneyMetricsSchema, insertJourneyVariantSchema, insertJourneyEventSchema,
  insertCustomerSchema, insertOrderSchema, insertOrderItemSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import OpenAI from "openai";
import { generateFlowFromPrompt, generateCampaignSuggestion } from "./openai";

// Initialize OpenAI
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Configure multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

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

  // Journey metrics routes
  app.get("/api/journeys/:id/metrics", async (req, res) => {
    try {
      const metrics = await storage.getJourneyMetrics(parseInt(req.params.id));
      if (!metrics) {
        return res.status(404).json({ message: "Metrics not found" });
      }
      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/journeys/:id/metrics", async (req, res) => {
    try {
      const journeyId = parseInt(req.params.id);
      const parsed = insertJourneyMetricsSchema.safeParse({ ...req.body, journeyId });
      if (!parsed.success) {
        const error = fromZodError(parsed.error);
        return res.status(400).json({ message: error.message });
      }

      const metrics = await storage.updateJourneyMetrics(journeyId, parsed.data);
      res.json(metrics);
    } catch (error: any) {
      console.error("Error updating metrics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Journey variants routes
  app.get("/api/journeys/:id/variants", async (req, res) => {
    try {
      const variants = await storage.getJourneyVariants(parseInt(req.params.id));
      res.json(variants);
    } catch (error: any) {
      console.error("Error fetching variants:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/journeys/:id/variants", async (req, res) => {
    try {
      const journeyId = parseInt(req.params.id);
      const parsed = insertJourneyVariantSchema.safeParse({ ...req.body, journeyId });
      if (!parsed.success) {
        const error = fromZodError(parsed.error);
        return res.status(400).json({ message: error.message });
      }

      const variant = await storage.createJourneyVariant(parsed.data);
      res.json(variant);
    } catch (error: any) {
      console.error("Error creating variant:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/journeys/variants/:id", async (req, res) => {
    try {
      const variantId = parseInt(req.params.id);
      const variant = await storage.updateJourneyVariant(variantId, req.body);
      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }
      res.json(variant);
    } catch (error: any) {
      console.error("Error updating variant:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Journey events routes
  app.get("/api/journeys/:id/events", async (req, res) => {
    try {
      const events = await storage.getJourneyEvents(parseInt(req.params.id));
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/journeys/:id/events", async (req, res) => {
    try {
      const journeyId = parseInt(req.params.id);
      const parsed = insertJourneyEventSchema.safeParse({ ...req.body, journeyId });
      if (!parsed.success) {
        const error = fromZodError(parsed.error);
        return res.status(400).json({ message: error.message });
      }

      const event = await storage.createJourneyEvent(parsed.data);
      res.json(event);
    } catch (error: any) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/journeys", async (req, res) => {
    try {
      const { prompt, ...journeyData } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const flow = await generateFlowFromPrompt(prompt);

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

  app.post("/api/campaigns/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Get existing segments for context
      const segments = await storage.getSegments();
      const suggestion = await generateCampaignSuggestion(prompt, segments);

      // Create a new email template from the AI suggestion
      const emailTemplate = await storage.createEmailTemplate({
        name: `${suggestion.name} Template`,
        subject: suggestion.subject,
        body: suggestion.emailBody,
        type: "email",
        variables: []
      });

      // Create a new segment from the AI suggestion
      const segment = await storage.createSegment({
        name: suggestion.segmentSuggestion.name,
        description: `AI-generated segment for ${suggestion.name}`,
        conditions: suggestion.segmentSuggestion.conditions,
        type: "ai"
      });

      res.json({
        ...suggestion,
        templateId: emailTemplate.id,
        segmentId: segment.id
      });
    } catch (error: any) {
      console.error("Campaign generation error:", error);
      res.status(500).json({ message: error.message || "Failed to generate campaign" });
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

  // New route for CSV import
  app.post("/api/segments/import", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const fileContent = req.file.buffer.toString();
      const records: any[] = [];

      // Parse CSV with minimal configuration
      const parser = parse(fileContent, {
        columns: true,
        skipEmptyLines: true
      });

      for await (const record of parser) {
        records.push(record);
      }

      // Process records
      let currentOrderId = "";
      let currentOrder = null;

      for (const record of records) {
        // Skip empty rows
        if (!record["Id"]) continue;

        // If this is a new order
        if (record["Id"] !== currentOrderId) {
          currentOrderId = record["Id"];

          // Create customer record with raw data
          const customer = await storage.createCustomer({
            name: record["Name"],
            email: record["Email"],
            phone: record["Phone"],
            acceptsMarketing: record["Accepts Marketing"]?.toLowerCase() === "yes",
            billingName: record["Billing Name"],
            billingStreet: record["Billing Street"],
            billingAddress1: record["Billing Address1"],
            billingAddress2: record["Billing Address2"],
            billingCompany: record["Billing Company"],
            billingCity: record["Billing City"],
            billingZip: record["Billing Zip"],
            billingProvince: record["Billing Province"],
            billingCountry: record["Billing Country"],
            billingPhone: record["Billing Phone"],
            shippingName: record["Shipping Name"],
            shippingStreet: record["Shipping Street"],
            shippingAddress1: record["Shipping Address1"],
            shippingAddress2: record["Shipping Address2"],
            shippingCompany: record["Shipping Company"],
            shippingCity: record["Shipping City"],
            shippingZip: record["Shipping Zip"],
            shippingProvince: record["Shipping Province"],
            shippingCountry: record["Shipping Country"],
            shippingPhone: record["Shipping Phone"]
          });

          // Create order with raw data
          currentOrder = await storage.createOrder({
            orderId: record["Id"],
            customerId: customer.id,
            financialStatus: record["Financial Status"],
            paidAt: record["Paid at"] ? new Date(record["Paid at"]) : null,
            fulfillmentStatus: record["Fulfillment Status"],
            fulfilledAt: record["Fulfilled at"] ? new Date(record["Fulfilled at"]) : null,
            currency: record["Currency"],
            subtotal: record["Subtotal"],
            shipping: record["Shipping"],
            taxes: record["Taxes"],
            total: record["Total"],
            discountCode: record["Discount Code"],
            discountAmount: record["Discount Amount"],
            shippingMethod: record["Shipping Method"],
            createdAt: new Date(record["Created at"]),
            paymentMethod: record["Payment Method"],
            paymentReference: record["Payment Reference"],
            refundedAmount: record["Refunded Amount"],
            outstandingBalance: record["Outstanding Balance"],
            notes: record["Notes"],
            tags: record["Tags"],
            riskLevel: record["Risk Level"],
            source: record["Source"]
          });
        }

        // Create order item if it exists
        if (currentOrder && record["Lineitem name"]) {
          await storage.createOrderItem({
            orderId: currentOrder.id,
            quantity: record["Lineitem quantity"],
            name: record["Lineitem name"],
            price: record["Lineitem price"],
            compareAtPrice: record["Lineitem compare at price"],
            sku: record["Lineitem sku"],
            requiresShipping: record["Lineitem requires shipping"],
            taxable: record["Lineitem taxable"],
            fulfillmentStatus: record["Lineitem fulfillment status"],
            discount: record["Lineitem discount"]
          });
        }
      }

      res.json({
        message: "Import completed successfully",
        recordsProcessed: records.length
      });
    } catch (error: any) {
      console.error("Import error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add export route
  app.get("/api/segments/:id/export", async (req, res) => {
    try {
      const segmentId = parseInt(req.params.id);
      const members = await storage.getSegmentMembers(segmentId);

      if (!members || members.length === 0) {
        return res.status(404).json({ message: "No members found in this segment" });
      }

      // Generate CSV content
      const headers = Object.keys(members[0].attributes).join(",");
      const rows = members.map(member =>
        Object.values(member.attributes).map(value =>
          typeof value === "string" ? `"${value}"` : value
        ).join(",")
      );

      const csvContent = [headers, ...rows].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=segment-${segmentId}-export.csv`);
      res.send(csvContent);
    } catch (error: any) {
      console.error("Export error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}