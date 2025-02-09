import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsCard } from "@/components/stats/metrics-card";
import type { Journey, Campaign } from "@shared/schema";

export default function Dashboard() {
  const { data: journeys } = useQuery<Journey[]>({ 
    queryKey: ["/api/journeys"]
  });

  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"]
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricsCard
          title="Active Journeys"
          value={journeys?.filter(j => j.status === "active").length || 0}
          total={journeys?.length || 0}
        />
        <MetricsCard
          title="Active Campaigns"
          value={campaigns?.filter(c => c.status === "active").length || 0}
          total={campaigns?.length || 0}
        />
        <MetricsCard
          title="Emails Sent"
          value={campaigns?.reduce((acc, c) => acc + (c.metrics.sent || 0), 0) || 0}
          total={10000}
          trend={5.2}
        />
        <MetricsCard
          title="Open Rate"
          value={campaigns?.reduce((acc, c) => acc + (c.metrics.opened || 0), 0) || 0}
          total={campaigns?.reduce((acc, c) => acc + (c.metrics.sent || 0), 0) || 0}
          trend={-2.1}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Journeys</CardTitle>
            <CardDescription>Your latest customer journeys</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {journeys?.slice(0, 5).map(journey => (
                <div key={journey.id} className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{journey.name}</h3>
                    <p className="text-sm text-muted-foreground">{journey.description}</p>
                  </div>
                  <span className="capitalize">{journey.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
            <CardDescription>Your latest email campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns?.slice(0, 5).map(campaign => (
                <div key={campaign.id} className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Sent: {campaign.metrics.sent || 0} | 
                      Opened: {campaign.metrics.opened || 0}
                    </p>
                  </div>
                  <span className="capitalize">{campaign.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
