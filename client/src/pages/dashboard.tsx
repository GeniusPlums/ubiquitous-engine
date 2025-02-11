import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricsCard } from "@/components/stats/metrics-card";
import {
  Activity, AlertCircle, BarChart2, Mail, Users, Zap,
  AlertTriangle, CheckCircle, Clock, Radio
} from "lucide-react";
import type { Journey, Campaign, Segment } from "@shared/schema";

export default function Dashboard() {
  const { data: journeys } = useQuery<Journey[]>({ 
    queryKey: ["/api/journeys"]
  });

  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"]
  });

  const { data: segments } = useQuery<Segment[]>({
    queryKey: ["/api/segments"]
  });

  // Calculate system status
  const systemStatus = {
    activeJourneys: journeys?.filter(j => j.status === "active").length || 0,
    activeCampaigns: campaigns?.filter(c => c.status === "active").length || 0,
    totalEmailsSent: campaigns?.reduce((acc, c) => acc + (c.metrics.sent || 0), 0) || 0,
    avgOpenRate: campaigns?.reduce((acc, c) => {
      const rate = c.metrics.sent ? (c.metrics.opened / c.metrics.sent) * 100 : 0;
      return acc + rate;
    }, 0) / (campaigns?.length || 1),
    alertCount: 2, // This would be dynamic based on actual system alerts
  };

  // Get recent events across the system
  const recentEvents = [
    { type: "success", message: "Campaign 'Welcome Series' completed successfully", time: "2 mins ago" },
    { type: "warning", message: "Segment 'High Value Customers' needs update", time: "5 mins ago" },
    { type: "error", message: "Journey 'Onboarding' experiencing high drop-off", time: "10 mins ago" },
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error": return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <Radio className="h-6 w-6 text-red-500 animate-pulse" />
            Command Center
          </h1>
          <p className="text-muted-foreground">Real-time system status and controls</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            Live Status
          </Badge>
          <Button>
            <AlertCircle className="h-4 w-4 mr-2" />
            System Alerts ({systemStatus.alertCount})
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Link href="/campaigns">
          <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center">
            <Mail className="h-6 w-6 mb-2" />
            Launch Campaign
          </Button>
        </Link>
        <Link href="/builder">
          <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center">
            <Zap className="h-6 w-6 mb-2" />
            Create Journey
          </Button>
        </Link>
        <Link href="/segments">
          <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center">
            <Users className="h-6 w-6 mb-2" />
            Manage Segments
          </Button>
        </Link>
        <Link href="/analytics">
          <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center">
            <BarChart2 className="h-6 w-6 mb-2" />
            View Analytics
          </Button>
        </Link>
      </div>

      {/* System Metrics */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <MetricsCard
          title="Active Journeys"
          value={systemStatus.activeJourneys}
          total={journeys?.length || 0}
        />
        <MetricsCard
          title="Active Campaigns"
          value={systemStatus.activeCampaigns}
          total={campaigns?.length || 0}
        />
        <MetricsCard
          title="Emails Delivered"
          value={systemStatus.totalEmailsSent}
          total={10000}
          trend={5.2}
        />
        <MetricsCard
          title="Avg. Open Rate"
          value={Math.round(systemStatus.avgOpenRate)}
          total={100}
          trend={-2.1}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Activity Feed */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>Real-time system events and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.map((event, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                  {getEventIcon(event.type)}
                  <div className="flex-1">
                    <p className="font-medium">{event.message}</p>
                    <p className="text-sm text-muted-foreground">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Operations */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Active Operations</CardTitle>
            <CardDescription>Currently running journeys and campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {journeys?.filter(j => j.status === "active").slice(0, 3).map(journey => (
                <div key={journey.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{journey.name}</h3>
                    <p className="text-sm text-muted-foreground">{journey.description}</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
              ))}
              {campaigns?.filter(c => c.status === "active").slice(0, 3).map(campaign => (
                <div key={campaign.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Sent: {campaign.metrics.sent} | Opened: {campaign.metrics.opened}
                    </p>
                  </div>
                  <Badge>Running</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}