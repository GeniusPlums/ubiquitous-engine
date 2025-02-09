import { useState, useCallback } from "react";
import { PromptInput } from "@/components/journey/prompt-input";
import { FlowDiagram } from "@/components/journey/flow-diagram";
import { EmailEditor } from "@/components/journey/email-editor";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, Bell, Clock, AlertCircle, Check, Wand2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Flow } from "@/lib/types";

const NODE_TYPES = [
  { type: 'trigger', label: 'Trigger', icon: AlertCircle },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'sms', label: 'SMS', icon: MessageSquare },
  { type: 'push', label: 'Push', icon: Bell },
  { type: 'condition', label: 'Condition', icon: AlertCircle },
  { type: 'delay', label: 'Delay', icon: Clock },
  { type: 'end', label: 'End', icon: Check },
];

export default function Builder() {
  const [flow, setFlow] = useState<Flow>({ nodes: [], edges: [] });
  const [selectedMode, setSelectedMode] = useState<"manual" | "ai">("manual");

  const addNode = useCallback((type: string) => {
    const position = {
      x: Math.random() * 500,
      y: Math.random() * 500,
    };

    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { label: `New ${type}` },
    };

    setFlow((current) => ({
      ...current,
      nodes: [...current.nodes, newNode],
    }));
  }, []);

  const handleFlowChange = (updatedFlow: Flow) => {
    setFlow(updatedFlow);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Journey Builder</h1>
        <Tabs value={selectedMode} onValueChange={(v) => setSelectedMode(v as "manual" | "ai")}>
          <TabsList>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Manual Builder
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-8">
        {selectedMode === "manual" ? (
          <>
            <div className="flex gap-4 items-center overflow-x-auto p-4 bg-white rounded-lg shadow-sm">
              {NODE_TYPES.map(({ type, label, icon: Icon }) => (
                <Button
                  key={type}
                  variant="outline"
                  className="flex items-center gap-2 whitespace-nowrap"
                  onClick={() => addNode(type)}
                >
                  <Icon className="h-4 w-4" />
                  Add {label}
                </Button>
              ))}
            </div>
            <FlowDiagram flow={flow} onFlowChange={handleFlowChange} />
            {flow.nodes.some(node => node.type === 'email') && (
              <EmailEditor 
                onChange={(template) => {
                  console.log("Email template updated:", template);
                }}
              />
            )}
          </>
        ) : (
          <div className="grid gap-8">
            <PromptInput onFlowGenerated={setFlow} />
            {flow.nodes.length > 0 && (
              <>
                <FlowDiagram flow={flow} onFlowChange={handleFlowChange} />
                {flow.nodes.some(node => node.type === 'email') && (
                  <EmailEditor 
                    onChange={(template) => {
                      console.log("Email template updated:", template);
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}