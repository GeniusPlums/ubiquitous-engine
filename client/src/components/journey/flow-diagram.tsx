import ReactFlow, { 
  Background, Controls, Edge, Node,
  NodeChange, EdgeChange, Connection,
  applyNodeChanges, applyEdgeChanges,
  addEdge, MiniMap, Panel
} from "reactflow";
import "reactflow/dist/style.css";
import type { Flow } from "@/lib/types";
import { useCallback, useState } from "react";
import { MessageSquare, Mail, Bell, Clock, AlertCircle, Check, ZoomIn, ZoomOut, Move } from "lucide-react";
import { Button } from "@/components/ui/button";

// Custom node components with icons and better styling
const NodeTypes = {
  trigger: ({ data }: any) => (
    <div className="min-w-[180px] p-4 rounded-lg bg-blue-500 text-white shadow-lg transition-transform hover:scale-105 cursor-grab active:cursor-grabbing">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">{data.label}</span>
      </div>
    </div>
  ),
  email: ({ data }: any) => (
    <div className="min-w-[180px] p-4 rounded-lg bg-green-500 text-white shadow-lg transition-transform hover:scale-105 cursor-grab active:cursor-grabbing">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5" />
        <span className="font-medium">{data.label}</span>
      </div>
    </div>
  ),
  sms: ({ data }: any) => (
    <div className="min-w-[180px] p-4 rounded-lg bg-purple-500 text-white shadow-lg transition-transform hover:scale-105 cursor-grab active:cursor-grabbing">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <span className="font-medium">{data.label}</span>
      </div>
    </div>
  ),
  push: ({ data }: any) => (
    <div className="min-w-[180px] p-4 rounded-lg bg-orange-500 text-white shadow-lg transition-transform hover:scale-105 cursor-grab active:cursor-grabbing">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <span className="font-medium">{data.label}</span>
      </div>
    </div>
  ),
  condition: ({ data }: any) => (
    <div className="min-w-[180px] p-4 rounded-lg bg-yellow-500 text-white shadow-lg transition-transform hover:scale-105 cursor-grab active:cursor-grabbing">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">{data.label}</span>
      </div>
    </div>
  ),
  delay: ({ data }: any) => (
    <div className="min-w-[180px] p-4 rounded-lg bg-indigo-500 text-white shadow-lg transition-transform hover:scale-105 cursor-grab active:cursor-grabbing">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        <span className="font-medium">{data.label}</span>
      </div>
    </div>
  ),
  end: ({ data }: any) => (
    <div className="min-w-[180px] p-4 rounded-lg bg-red-500 text-white shadow-lg transition-transform hover:scale-105 cursor-grab active:cursor-grabbing">
      <div className="flex items-center gap-2">
        <Check className="h-5 w-5" />
        <span className="font-medium">{data.label}</span>
      </div>
    </div>
  ),
};

interface FlowDiagramProps {
  flow: Flow;
  onFlowChange?: (flow: Flow) => void;
}

const defaultEdgeOptions = {
  animated: true,
  style: {
    stroke: '#64748b',
    strokeWidth: 2,
  },
};

export function FlowDiagram({ flow, onFlowChange }: FlowDiagramProps) {
  const [nodes, setNodes] = useState<Node[]>(flow.nodes);
  const [edges, setEdges] = useState<Edge[]>(flow.edges);
  const [zoom, setZoom] = useState(1);

  // Handle node changes (position, selection, etc.)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes);
      setNodes(updatedNodes);
      onFlowChange?.({ nodes: updatedNodes, edges });
    },
    [nodes, edges, onFlowChange]
  );

  // Handle edge changes (selection, removal, etc.)
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges);
      setEdges(updatedEdges);
      onFlowChange?.({ nodes, edges: updatedEdges });
    },
    [nodes, edges, onFlowChange]
  );

  // Handle new connections between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      const updatedEdges = addEdge(connection, edges);
      setEdges(updatedEdges);
      onFlowChange?.({ nodes, edges: updatedEdges });
    },
    [nodes, edges, onFlowChange]
  );

  return (
    <div className="h-[600px] w-full border rounded-lg bg-white shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={NodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Control"
        selectionKeyCode="Shift"
        minZoom={0.1}
        maxZoom={4}
        onZoomChange={setZoom}
      >
        <Panel position="top-right" className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((z) => Math.min(z + 0.2, 4))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.1))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(1)}
          >
            <Move className="h-4 w-4" />
          </Button>
        </Panel>
        <Background color="#f8f9fa" gap={16} size={1} />
        <Controls />
        <MiniMap 
          nodeColor={(n) => {
            switch (n.type) {
              case 'trigger': return '#3b82f6';
              case 'email': return '#22c55e';
              case 'sms': return '#a855f7';
              case 'push': return '#f97316';
              case 'condition': return '#eab308';
              case 'delay': return '#6366f1';
              case 'end': return '#ef4444';
              default: return '#64748b';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}