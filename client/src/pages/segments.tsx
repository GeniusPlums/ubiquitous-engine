import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Brain, Filter, Download, Upload, RefreshCw, X } from "lucide-react";
import type { Segment } from "@shared/schema";

const conditionSchema = z.object({
  field: z.string(),
  operator: z.string(),
  value: z.string(),
  type: z.string().optional(),
  timeframe: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["manual", "ai"]),
  conditions: z.array(conditionSchema).optional(),
  aiPrompt: z.string().optional(),
});

const AVAILABLE_FIELDS = [
  { label: "Email", value: "email" },
  { label: "Country", value: "country" },
  { label: "Sign Up Date", value: "signUpDate" },
  { label: "Last Activity", value: "lastActivity" },
  { label: "Total Purchases", value: "totalPurchases" },
];

const OPERATORS = [
  { label: "Equals", value: "equals" },
  { label: "Contains", value: "contains" },
  { label: "Greater Than", value: "gt" },
  { label: "Less Than", value: "lt" },
  { label: "Between", value: "between" },
];

export default function Segments() {
  const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual");
  const queryClient = useQueryClient();

  const { data: segments } = useQuery<Segment[]>({
    queryKey: ["/api/segments"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "manual",
      conditions: [],
    },
  });

  const createSegment = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("Failed to create segment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
      toast({
        title: "Success",
        description: "Segment created successfully",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create segment",
        variant: "destructive",
      });
    },
  });

  const addCondition = () => {
    const currentConditions = form.getValues("conditions") || [];
    form.setValue("conditions", [
      ...currentConditions,
      {
        field: "",
        operator: "equals",
        value: "",
      },
    ]);
  };

  const removeCondition = (index: number) => {
    const currentConditions = form.getValues("conditions") || [];
    form.setValue("conditions", currentConditions.filter((_, i) => i !== index));
  };

  const handleExport = async (segmentId: number) => {
    const response = await fetch(`/api/segments/${segmentId}/export`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `segment-${segmentId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/segments/import", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
      toast({
        title: "Success",
        description: "Audience list imported successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to import audience list",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Audience Segments</h1>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => document.getElementById("import-file")?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Segment</CardTitle>
            <CardDescription>Create a new audience segment</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "manual" | "ai")}>
              <TabsList className="mb-4">
                <TabsTrigger value="manual">
                  <Filter className="h-4 w-4 mr-2" />
                  Manual
                </TabsTrigger>
                <TabsTrigger value="ai">
                  <Brain className="h-4 w-4 mr-2" />
                  AI-Powered
                </TabsTrigger>
              </TabsList>

              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createSegment.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <TabsContent value="manual">
                    <div className="space-y-4">
                      {form.watch("conditions")?.map((condition, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <FormField
                            control={form.control}
                            name={`conditions.${index}.field`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {AVAILABLE_FIELDS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
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
                            name={`conditions.${index}.operator`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select operator" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {OPERATORS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
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
                            name={`conditions.${index}.value`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input {...field} placeholder="Value" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCondition(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={addCondition}>
                        Add Condition
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai">
                    <FormField
                      control={form.control}
                      name="aiPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Describe your target audience</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="E.g., Find users who are likely to purchase premium plans based on their recent activity"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <Button type="submit" className="w-full">
                    Create Segment
                  </Button>
                </form>
              </Form>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {segments?.map((segment) => (
            <Card key={segment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{segment.name}</CardTitle>
                    <CardDescription>{segment.description}</CardDescription>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => handleExport(segment.id)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Members</p>
                    <p className="text-2xl font-bold">{segment.metrics.totalMembers}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Engagement Rate</p>
                    <p className="text-2xl font-bold">{segment.metrics.engagementRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}