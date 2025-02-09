import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PromptInputProps {
  onFlowGenerated: (flow: any) => void;
}

export function PromptInput({ onFlowGenerated }: PromptInputProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const { toast } = useToast();

  const createJourney = useMutation({
    mutationFn: async (data: { name: string; description?: string; prompt: string }) => {
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
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate journey flow.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !prompt.trim()) {
      toast({
        title: "Validation Error",
        description: "Journey name and prompt are required.",
        variant: "destructive",
      });
      return;
    }
    createJourney.mutate({ name, description: description || undefined, prompt });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create New Journey</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Journey Name</Label>
          <Input
            id="name"
            placeholder="e.g. Welcome Onboarding"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            placeholder="Brief description of the journey"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prompt">Describe Your Journey</Label>
          <Textarea
            id="prompt"
            placeholder="e.g. Create a welcome flow that sends an email when users sign up, wait 2 days, then send a follow-up if they haven't logged in"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
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