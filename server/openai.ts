import OpenAI from "openai";
import { z } from "zod";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Existing interfaces and flow schema remain unchanged
export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label: string; [key: string]: any };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Flow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

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

// New campaign generation types
export interface CampaignSuggestion {
  name: string;
  description: string;
  subject: string;
  emailBody: string;
  segmentSuggestion: {
    name: string;
    conditions: Array<{
      field: string;
      operator: string;
      value: string;
    }>;
  };
}

export async function generateCampaignSuggestion(
  prompt: string,
  existingSegments?: Array<{ name: string; conditions: any[] }>
): Promise<CampaignSuggestion> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert marketing campaign assistant. Given a campaign idea, generate a complete campaign suggestion including email content and audience targeting.
          ${existingSegments ? `Consider these existing segments: ${JSON.stringify(existingSegments)}` : ''}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const campaignSchema = z.object({
      name: z.string(),
      description: z.string(),
      subject: z.string(),
      emailBody: z.string(),
      segmentSuggestion: z.object({
        name: z.string(),
        conditions: z.array(z.object({
          field: z.string(),
          operator: z.string(),
          value: z.string()
        }))
      })
    });

    return campaignSchema.parse(JSON.parse(content));
  } catch (error) {
    console.error("Error generating campaign suggestion:", error);
    throw new Error("Failed to generate campaign suggestion: " + (error as Error).message);
  }
}

// Keep existing generateFlowFromPrompt function
export async function generateFlowFromPrompt(prompt: string): Promise<Flow> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a journey builder assistant. Convert user prompts into a flow diagram with nodes and edges. 
          Return a JSON object with nodes (id, type, position, data) and edges (id, source, target).
          Node types can be: trigger, email, condition, delay, or end.
          Position nodes in a logical layout with x, y coordinates between 0 and 1000.
          Each node must have a unique id and descriptive label.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const parsedFlow = flowSchema.parse(JSON.parse(content));
    return parsedFlow;
  } catch (error) {
    console.error("Error generating flow:", error);
    throw new Error("Failed to generate flow: " + (error as Error).message);
  }
}