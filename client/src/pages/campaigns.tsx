import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlayCircle, PauseCircle, Settings } from "lucide-react";
import type { Campaign, Journey, Template, Segment } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";
import { z } from "zod";

const insertCampaignSchema = z.object({
  name: z.string().min(1, { message: "Campaign name is required" }),
  journeyId: z.string().min(1, { message: "Journey is required" }),
  templateId: z.string().min(1, { message: "Template is required" }),
  segmentId: z.string().min(1, { message: "Segment is required" }),
});

type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export default function Campaigns() {
  const { data: campaigns, isLoading: isLoadingCampaigns } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: journeys } = useQuery<Journey[]>({
    queryKey: ["/api/journeys"],
  });

  const { data: templates } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const { data: segments } = useQuery<Segment[]>({
    queryKey: ["/api/segments"],
  });

  const form = useForm({
    resolver: zodResolver(insertCampaignSchema),
    defaultValues: {
      name: "",
      journeyId: "",
      templateId: "",
      segmentId: "",
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (data: InsertCampaign) => {
      await apiRequest("/api/campaigns", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
  });

  const toggleCampaign = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest(`/api/campaigns/${id}/toggle`, {
        method: "POST",
        body: JSON.stringify({ status: status === "active" ? "paused" : "active" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
  });

  if (isLoadingCampaigns) {
    return <div>Loading campaigns...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Campaign Control Center</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create Campaign</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createCampaign.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="journeyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Journey</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select journey" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {journeys?.map((journey) => (
                            <SelectItem key={journey.id} value={journey.id.toString()}>
                              {journey.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Template</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates?.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="segmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audience Segment</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select segment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {segments?.map((segment) => (
                            <SelectItem key={segment.id} value={segment.id.toString()}>
                              {segment.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createCampaign.isPending}>
                  Create Campaign
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {campaigns?.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>{campaign.name}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleCampaign.mutate({ id: campaign.id, status: campaign.status })}
                >
                  {campaign.status === "active" ? (
                    <PauseCircle className="h-4 w-4" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm font-medium">Journey</div>
                    <div className="text-lg">{campaign.journeyId}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Template</div>
                    <div className="text-lg">{campaign.template?.subject}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Segments</div>
                    <div className="text-lg">
                      {campaign.segments.map((s) => s.name).join(", ")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Status</div>
                    <div className="text-lg capitalize">{campaign.status}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium">Sent</div>
                    <div className="text-2xl font-bold">{campaign.metrics.sent || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Opened</div>
                    <div className="text-2xl font-bold">{campaign.metrics.opened || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Clicked</div>
                    <div className="text-2xl font-bold">{campaign.metrics.clicked || 0}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Open Rate</div>
                  <Progress
                    value={
                      campaign.metrics.sent
                        ? (campaign.metrics.opened / campaign.metrics.sent) * 100
                        : 0
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}