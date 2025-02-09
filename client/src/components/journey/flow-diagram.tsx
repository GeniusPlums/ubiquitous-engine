import ReactFlow, { 
  Background, Controls, Edge, Node,
  NodeChange, EdgeChange, Connection,
  applyNodeChanges, applyEdgeChanges,
  addEdge, MiniMap, Panel, Handle,
  Position
} from "reactflow";
import "reactflow/dist/style.css";
import type { Flow, FlowNode } from "@/lib/types";
import { useCallback, useState, useEffect } from "react";
import { MessageSquare, Mail, Bell, Clock, AlertCircle, Check, ZoomIn, ZoomOut, Move } from "lucide-react";
import { Button } from "@/components/ui/button";

// Custom node components with icons and better styling
const NodeTypes = {
  trigger: ({ data }: any) => (
    <div className="min-w-[180px] p-4 rounded-lg bg-blue-500 text-white shadow-lg transition-transform hover:scale-105 cursor-grab active:cursor-grabbing">
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-200" />
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">{data.label}</span>
      </div>
    </div>
  ),
  email: ({ data }: any) => (
    <div className="min-w-[180px] p-4 rounded-lg bg-green-500 text-white shadow-lg transition-transform hover:scale-105 cursor-grab active:cursor-grabbing">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-green-200" />
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5" />
        <span className="font-medium">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-200" />
    </div>
  ),
  sms: ({ data }: any) => (
    <div className="min-w-[180px] p-4 rounded-lg bg-purple-500 text-white shadow-lg transition-transform hover:scale-105 cursor-grab active:cursor-grabbing">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-200" />
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-4" />
        <span className="font-medium">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-200" />
    </div>
  ),
  push: ({ data }: any) => (
    <div className="min-w-[180px] p-4 rounded-lg bg-orange-500 text-white shadow-lg transition-transform hover:scale-105 cursor-grab active:cursor-grabbing">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-200" />
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <span className="font-medium">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-200" />
    </div>
  ),
  condition: ({ data }: any) => (
    <div className="min-w-[180px] p-4 rounded-lg bg-yellow-500 text-white shadow-lg transition-transform hover:scale-105 cursor-grab active:cursor-grabbing">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-yellow-200" />
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-yellow-200" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-yellow-200" id="yes" />
      <Handle type="source" position={Position.Left} className="w-3 h-3 bg-yellow-200" id="no" />
    </div>
  ),
  delay: ({ data }: any) => (
    <div className="min-w-[180px] p-4 rounded-lg bg-indigo-500 text-white shadow-lg transition-transform hover:scale-105 cursor-grab active:cursor-grabbing">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-200" />
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        <span className="font-medium">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-200" />
    </div>
  ),
  end: ({ data }: any) => (
    <div className="min-w-[180px] p-4 rounded-lg bg-red-500 text-white shadow-lg transition-transform hover:scale-105 cursor-grab active:cursor-grabbing">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-red-200" />
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
  // Initialize nodes with draggable and connectable properties
  const [nodes, setNodes] = useState<FlowNode[]>(() => 
    flow.nodes.map(node => ({
      ...node,
      draggable: true,
      connectable: true,
    }))
  );
  const [edges, setEdges] = useState<Edge[]>(flow.edges);
  const [zoom, setZoom] = useState(1);

  // Update nodes when flow prop changes
  useEffect(() => {
    setNodes(flow.nodes.map(node => ({
      ...node,
      draggable: true,
      connectable: true,
    })));
    setEdges(flow.edges);
  }, [flow]);

  // Handle node changes (position, selection, etc.)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes);
      setNodes(updatedNodes);
      onFlowChange?.({ 
        nodes: updatedNodes, 
        edges 
      });
    },
    [nodes, edges, onFlowChange]
  );

  // Handle edge changes (selection, removal, etc.)
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges);
      setEdges(updatedEdges);
      onFlowChange?.({ 
        nodes, 
        edges: updatedEdges 
      });
    },
    [nodes, edges, onFlowChange]
  );

  // Handle new connections between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      // Validate connection
      if (!connection.source || !connection.target) return;

      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);

      // Don't allow connections to trigger nodes or from end nodes
      if (targetNode?.type === 'trigger' || sourceNode?.type === 'end') return;

      const updatedEdges = addEdge({
        ...connection,
        type: 'smoothstep',
        animated: true,
      }, edges);

      setEdges(updatedEdges);
      onFlowChange?.({ 
        nodes, 
        edges: updatedEdges 
      });
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
        draggable
        panOnDrag
        selectable
        zoomOnScroll
        panOnScroll={false}
        preventScrolling
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