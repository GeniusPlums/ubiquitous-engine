import { Node, Edge } from 'reactflow';

export interface FlowNode extends Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label: string; [key: string]: any };
  draggable?: boolean;
  connectable?: boolean;
}

export interface FlowEdge extends Edge {
  id: string;
  source: string;
  target: string;
}

export interface Flow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface Template {
  subject: string;
  body: string;
}

export interface Segment {
  name: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
}