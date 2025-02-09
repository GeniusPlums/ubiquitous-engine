import OpenAI from "openai";
import { z } from "zod";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

export async function generateFlowFromPrompt(prompt: string): Promise<Flow> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a journey builder assistant. Convert user prompts into a flow diagram with nodes and edges. 
          Return a JSON object with nodes (id, type, position, data) and edges (id, source, target).
          Node types can be: trigger, email, condition, delay, or end.
          Position nodes in a logical layout with x, y coordinates.`
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
    throw error;
  }
}