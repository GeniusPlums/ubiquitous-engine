import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Campaign } from "@shared/schema";

export default function Campaigns() {
  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Campaigns</h1>
        <Button>Create Campaign</Button>
      </div>

      <div className="grid gap-4">
        {campaigns?.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <CardTitle>{campaign.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium">Sent</div>
                    <div className="text-2xl font-bold">
                      {campaign.metrics.sent || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Opened</div>
                    <div className="text-2xl font-bold">
                      {campaign.metrics.opened || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Clicked</div>
                    <div className="text-2xl font-bold">
                      {campaign.metrics.clicked || 0}
                    </div>
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
