import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PromptInputProps {
  onFlowGenerated: (flow: any) => void;
}

export function PromptInput({ onFlowGenerated }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const { toast } = useToast();

  const createJourney = useMutation({
    mutationFn: async (data: { prompt: string }) => {
      const res = await apiRequest("POST", "/api/journeys", data);
      return res.json();
    },
    onSuccess: (data) => {
      onFlowGenerated(data.flow);
      toast({
        title: "Journey Created",
        description: "Your journey flow has been generated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate journey flow.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    createJourney.mutate({ prompt });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Describe Your Journey</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="e.g. Create a welcome flow that sends an email when users sign up, wait 2 days, then send a follow-up if they haven't logged in"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px]"
        />
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit}
          disabled={createJourney.isPending}
          className="w-full"
        >
          {createJourney.isPending ? "Generating..." : "Generate Flow"}
        </Button>
      </CardFooter>
    </Card>
  );
}
