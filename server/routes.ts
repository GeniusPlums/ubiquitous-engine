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

      // Parse CSV
      const parser = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      for await (const record of parser) {
        records.push(record);
      }

      // Process records and insert into database
      for (const record of records) {
        // Create customer record
        const customerData = {
          name: record.customer_name || "",
          email: record.email || "",
          phone: record.phone || "",
          acceptsMarketing: record.accepts_marketing === "true",
          billingName: record.billing_name || "",
          billingStreet: record.billing_street || "",
          billingCity: record.billing_city || "",
          billingZip: record.billing_zip || "",
          billingProvince: record.billing_province || "",
          billingCountry: record.billing_country || "",
          billingPhone: record.billing_phone || "",
          shippingName: record.shipping_name || "",
          shippingStreet: record.shipping_street || "",
          shippingCity: record.shipping_city || "",
          shippingZip: record.shipping_zip || "",
          shippingProvince: record.shipping_province || "",
          shippingCountry: record.shipping_country || "",
          shippingPhone: record.shipping_phone || "",
        };

        const customer = await storage.createCustomer(customerData);

        // Create order record if order details exist
        if (record.order_id) {
          const orderData = {
            orderId: record.order_id,
            customerId: customer.id,
            financialStatus: record.financial_status || "pending",
            paidAt: record.paid_at ? new Date(record.paid_at) : null,
            fulfillmentStatus: record.fulfillment_status || "unfulfilled",
            currency: record.currency || "USD",
            total: parseFloat(record.total) || 0,
            createdAt: record.created_at ? new Date(record.created_at) : new Date(),
            paymentMethod: record.payment_method || "",
            source: "csv_import"
          };

          const order = await storage.createOrder(orderData);

          // Create order items if they exist
          if (record.items) {
            const items = JSON.parse(record.items);
            for (const item of items) {
              await storage.createOrderItem({
                orderId: order.id,
                quantity: item.quantity || 1,
                name: item.name || "",
                price: parseFloat(item.price) || 0,
                sku: item.sku || "",
              });
            }
          }
        }
      }

      res.json({ message: "Import completed successfully", recordsProcessed: records.length });
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