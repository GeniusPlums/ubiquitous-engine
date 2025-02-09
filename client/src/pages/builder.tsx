import { useState } from "react";
import { PromptInput } from "@/components/journey/prompt-input";
import { FlowDiagram } from "@/components/journey/flow-diagram";
import { EmailEditor } from "@/components/journey/email-editor";
import type { Flow } from "@/lib/types";

export default function Builder() {
  const [flow, setFlow] = useState<Flow>({ nodes: [], edges: [] });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Journey Builder</h1>
      
      <div className="grid gap-8">
        <PromptInput onFlowGenerated={setFlow} />
        
        {flow.nodes.length > 0 && (
          <>
            <FlowDiagram flow={flow} />
            <EmailEditor 
              onChange={(template) => {
                console.log("Email template updated:", template);
              }} 
            />
          </>
        )}
      </div>
    </div>
  );
}
