import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart2, PieChartIcon } from "lucide-react";
import type { Journey, JourneyMetrics, JourneyVariant, JourneyEvent } from "@shared/schema";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Analytics() {
  const [selectedJourney, setSelectedJourney] = useState<string>();

  // Fetch journeys
  const { data: journeys = [] } = useQuery<Journey[]>({
    queryKey: ["/api/journeys"],
  });

  // Fetch metrics for selected journey
  const { data: metrics } = useQuery<JourneyMetrics>({
    queryKey: ["/api/journeys", selectedJourney, "metrics"],
    enabled: !!selectedJourney,
  });

  // Fetch variants for selected journey
  const { data: variants = [] } = useQuery<JourneyVariant[]>({
    queryKey: ["/api/journeys", selectedJourney, "variants"],
    enabled: !!selectedJourney,
  });

  // Fetch events for selected journey
  const { data: events = [] } = useQuery<JourneyEvent[]>({
    queryKey: ["/api/journeys", selectedJourney, "events"],
    enabled: !!selectedJourney,
  });

  const handleExport = () => {
    if (!selectedJourney) return;

    const exportData = {
      metrics,
      variants,
      events,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journey-${selectedJourney}-analytics.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format event data for timeline chart
  const timelineData = events.reduce((acc: any[], event) => {
    const date = new Date(event.timestamp).toLocaleDateString();
    const existingDate = acc.find(item => item.date === date);
    if (existingDate) {
      existingDate.count++;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []);

  // Format variant data for comparison chart
  const variantData = variants.map(variant => ({
    name: variant.name,
    conversions: variant.metrics.conversions,
    completionRate: variant.metrics.completionRate,
  }));

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Journey Analytics</h1>
        <div className="flex gap-4">
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
            onClick={handleExport}
            disabled={!selectedJourney}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {selectedJourney ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Overview Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Key journey metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{metrics?.totalUsers || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{metrics?.completionRate || 0}%</p>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{metrics?.averageDuration || 0}m</p>
                  <p className="text-sm text-muted-foreground">Avg. Duration</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{metrics?.bounceRate || 0}%</p>
                  <p className="text-sm text-muted-foreground">Bounce Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* A/B Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>A/B Test Results</CardTitle>
              <CardDescription>Variant performance comparison</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={variantData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="conversions" fill="#0088FE" name="Conversions" />
                  <Bar dataKey="completionRate" fill="#00C49F" name="Completion Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Event Timeline */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Event Timeline</CardTitle>
              <CardDescription>User interaction events over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" name="Events" />
                </LineChart>
              </ResponsiveContainer>
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
    </div>
  );
}
