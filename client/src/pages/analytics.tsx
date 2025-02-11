import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart2, PieChartIcon, Mail } from "lucide-react";
import type { Journey, JourneyMetrics, JourneyVariant, JourneyEvent, Campaign } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Analytics() {
  const [selectedJourney, setSelectedJourney] = useState<string>();
  const [selectedCampaign, setSelectedCampaign] = useState<string>();

  // Fetch data
  const { data: journeys = [] } = useQuery<Journey[]>({
    queryKey: ["/api/journeys"],
  });

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  // Journey metrics
  const { data: metrics } = useQuery<JourneyMetrics>({
    queryKey: ["/api/journeys", selectedJourney, "metrics"],
    enabled: !!selectedJourney,
  });

  const { data: variants = [] } = useQuery<JourneyVariant[]>({
    queryKey: ["/api/journeys", selectedJourney, "variants"],
    enabled: !!selectedJourney,
  });

  const { data: events = [] } = useQuery<JourneyEvent[]>({
    queryKey: ["/api/journeys", selectedJourney, "events"],
    enabled: !!selectedJourney,
  });

  // Format campaign data for charts
  const campaignPerformanceData = campaigns.map(campaign => ({
    name: campaign.name,
    sent: campaign.metrics.sent || 0,
    opened: campaign.metrics.opened || 0,
    clicked: campaign.metrics.clicked || 0,
    openRate: campaign.metrics.sent ? ((campaign.metrics.opened / campaign.metrics.sent) * 100).toFixed(1) : '0',
    clickRate: campaign.metrics.opened ? ((campaign.metrics.clicked / campaign.metrics.opened) * 100).toFixed(1) : '0',
  }));

  const handleExport = (type: 'journey' | 'campaign') => {
    const exportData = type === 'journey' 
      ? { metrics, variants, events }
      : { campaignPerformanceData };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-analytics.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="journeys" className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Analytics Center</h1>
            <p className="text-muted-foreground">
              Comprehensive view of journey and campaign performance
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="journeys" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Journey Analytics
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Campaign Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="journeys" className="space-y-6">
          <div className="flex justify-between items-center">
            <Select
              value={selectedJourney}
              onValueChange={setSelectedJourney}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Journey" />
              </SelectTrigger>
              <SelectContent>
                {journeys.map((journey) => (
                  <SelectItem key={journey.id} value={journey.id.toString()}>
                    {journey.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => handleExport('journey')}
              disabled={!selectedJourney}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Journey Data
            </Button>
          </div>

          {selectedJourney ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                  <CardDescription>Key journey metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{metrics?.totalUsers ?? 0}</p>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{metrics?.completionRate ?? 0}%</p>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{metrics?.averageDuration ?? 0}m</p>
                      <p className="text-sm text-muted-foreground">Avg. Duration</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{metrics?.bounceRate ?? 0}%</p>
                      <p className="text-sm text-muted-foreground">Bounce Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>A/B Test Results</CardTitle>
                  <CardDescription>Variant performance comparison</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {variants.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={variants.map(v => ({
                        name: v.name,
                        conversions: v.metrics?.conversions ?? 0,
                        completionRate: v.metrics?.completionRate ?? 0,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="conversions" fill="#0088FE" name="Conversions" />
                        <Bar dataKey="completionRate" fill="#00C49F" name="Completion Rate (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No variant data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Event Timeline</CardTitle>
                  <CardDescription>User interaction events over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {events.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={events.reduce((acc: any[], event) => {
                        const date = new Date(event.timestamp).toLocaleDateString();
                        const existingDate = acc.find(item => item.date === date);
                        if (existingDate) {
                          existingDate.count++;
                        } else {
                          acc.push({ date, count: 1 });
                        }
                        return acc;
                      }, [])}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" name="Events" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No event data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[400px]">
                <p className="text-muted-foreground">Select a journey to view analytics</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex justify-between items-center">
            <Select
              value={selectedCampaign}
              onValueChange={setSelectedCampaign}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id.toString()}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => handleExport('campaign')}
              disabled={campaigns.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Campaign Data
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance Overview</CardTitle>
                <CardDescription>Email metrics across all campaigns</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sent" fill="#0088FE" name="Sent" />
                    <Bar dataKey="opened" fill="#00C49F" name="Opened" />
                    <Bar dataKey="clicked" fill="#FFBB28" name="Clicked" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Rates</CardTitle>
                <CardDescription>Open and click-through rates</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={campaignPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="openRate" stroke="#0088FE" name="Open Rate %" />
                    <Line type="monotone" dataKey="clickRate" stroke="#00C49F" name="Click Rate %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Campaign Performance Details</CardTitle>
                <CardDescription>Detailed metrics for each campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaignPerformanceData.map((campaign) => (
                    <div key={campaign.name} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Sent: {campaign.sent} | Opened: {campaign.opened} | Clicked: {campaign.clicked}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{campaign.openRate}%</p>
                        <p className="text-sm text-muted-foreground">Open Rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}