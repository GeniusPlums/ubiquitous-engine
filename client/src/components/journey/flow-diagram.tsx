import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import type { Flow } from "@/lib/types";

const nodeTypes = {
  trigger: ({ data }: any) => (
    <div className="p-4 rounded-lg bg-blue-500 text-white">
      {data.label}
    </div>
  ),
  email: ({ data }: any) => (
    <div className="p-4 rounded-lg bg-green-500 text-white">
      {data.label}
    </div>
  ),
  condition: ({ data }: any) => (
    <div className="p-4 rounded-lg bg-yellow-500 text-white">
      {data.label}
    </div>
  ),
  delay: ({ data }: any) => (
    <div className="p-4 rounded-lg bg-purple-500 text-white">
      {data.label}
    </div>
  ),
  end: ({ data }: any) => (
    <div className="p-4 rounded-lg bg-red-500 text-white">
      {data.label}
    </div>
  ),
};

interface FlowDiagramProps {
  flow: Flow;
}

export function FlowDiagram({ flow }: FlowDiagramProps) {
  return (
    <div className="h-[600px] w-full border rounded-lg">
      <ReactFlow
        nodes={flow.nodes}
        edges={flow.edges}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
