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
import { Brain, Filter, Download, Upload, RefreshCw, X, FileDown, Plus } from "lucide-react";
import type { Segment } from "@shared/schema";

// Enhanced condition schema with type-specific validation
const conditionSchema = z.object({
  field: z.string(),
  operator: z.string(),
  value: z.string(),
  logicOperator: z.enum(["AND", "OR"]).optional(),
  type: z.enum(["string", "number", "date", "boolean"]).default("string"),
  timeframe: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["manual", "ai", "dynamic"]),
  conditions: z.array(z.object({
    group: z.array(conditionSchema),
    logicOperator: z.enum(["AND", "OR"]).default("AND"),
  })).optional(),
  aiPrompt: z.string().optional(),
  behaviorRules: z.array(z.object({
    event: z.string(),
    threshold: z.number(),
    timeframe: z.string(),
  })).optional(),
});

const AVAILABLE_FIELDS = [
  { label: "Email", value: "email", type: "string" },
  { label: "Country", value: "country", type: "string" },
  { label: "Sign Up Date", value: "signUpDate", type: "date" },
  { label: "Last Activity", value: "lastActivity", type: "date" },
  { label: "Total Purchases", value: "totalPurchases", type: "number" },
  { label: "Last Purchase Date", value: "lastPurchaseDate", type: "date" },
  { label: "Average Order Value", value: "averageOrderValue", type: "number" },
  { label: "Email Subscribed", value: "emailSubscribed", type: "boolean" },
  { label: "Engagement Score", value: "engagementScore", type: "number" },
];

const OPERATORS = {
  string: [
    { label: "Equals", value: "equals" },
    { label: "Contains", value: "contains" },
    { label: "Starts with", value: "startsWith" },
    { label: "Ends with", value: "endsWith" },
    { label: "Is empty", value: "isEmpty" },
    { label: "Is not empty", value: "isNotEmpty" },
  ],
  number: [
    { label: "Equals", value: "equals" },
    { label: "Greater than", value: "gt" },
    { label: "Less than", value: "lt" },
    { label: "Between", value: "between" },
    { label: "Is empty", value: "isEmpty" },
  ],
  date: [
    { label: "On", value: "on" },
    { label: "Before", value: "before" },
    { label: "After", value: "after" },
    { label: "Between", value: "between" },
    { label: "In the last", value: "inLast" },
    { label: "Not in the last", value: "notInLast" },
  ],
  boolean: [
    { label: "Is", value: "equals" },
  ],
};

const TIME_UNITS = [
  { label: "Days", value: "days" },
  { label: "Weeks", value: "weeks" },
  { label: "Months", value: "months" },
];

const BEHAVIOR_EVENTS = [
  { label: "Page View", value: "pageView" },
  { label: "Email Open", value: "emailOpen" },
  { label: "Email Click", value: "emailClick" },
  { label: "Purchase", value: "purchase" },
  { label: "Cart Abandon", value: "cartAbandon" },
];

export default function Segments() {
  const [activeTab, setActiveTab] = useState<"manual" | "ai" | "dynamic">("manual");
  const queryClient = useQueryClient();

  const { data: segments } = useQuery<Segment[]>({
    queryKey: ["/api/segments"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "manual",
      conditions: [{ group: [], logicOperator: "AND" }],
      behaviorRules: [],
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

  const addConditionGroup = () => {
    const currentConditions = form.getValues("conditions") || [];
    form.setValue("conditions", [
      ...currentConditions,
      { group: [], logicOperator: "AND" },
    ]);
  };

  const addCondition = (groupIndex: number) => {
    const currentConditions = form.getValues("conditions") || [];
    const updatedConditions = [...currentConditions];
    updatedConditions[groupIndex].group.push({
      field: "",
      operator: "equals",
      value: "",
      type: "string",
    });
    form.setValue("conditions", updatedConditions);
  };

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    const currentConditions = form.getValues("conditions") || [];
    const updatedConditions = [...currentConditions];
    updatedConditions[groupIndex].group.splice(conditionIndex, 1);
    form.setValue("conditions", updatedConditions);
  };

  const addBehaviorRule = () => {
    const currentRules = form.getValues("behaviorRules") || [];
    form.setValue("behaviorRules", [
      ...currentRules,
      {
        event: "",
        threshold: 1,
        timeframe: "7 days",
      },
    ]);
  };

  const removeBehaviorRule = (index: number) => {
    const currentRules = form.getValues("behaviorRules") || [];
    form.setValue(
      "behaviorRules",
      currentRules.filter((_, i) => i !== index)
    );
  };

  const downloadTemplate = () => {
    const headers = ["email", "country", "signUpDate", "lastActivity", "totalPurchases"];
    const sampleData = ["user@example.com", "US", "2024-01-01", "2024-02-09", "5"];

    const csvContent = [
      headers.join(","),
      sampleData.join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "segment-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    // Read and validate CSV content
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');

      // Validate headers
      const headers = lines[0].toLowerCase().trim().split(',');
      const requiredHeaders = ['email', 'country'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        toast({
          title: "Invalid CSV Format",
          description: `Missing required columns: ${missingHeaders.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      // Proceed with upload
      const formData = new FormData();
      formData.append("file", file);

      try {
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
          // Reset file input
          event.target.value = '';
        } else {
          const error = await response.text();
          throw new Error(error);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to import audience list",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Audience Segments</h1>
        <div className="flex gap-4">
          <Button variant="outline" onClick={downloadTemplate}>
            <FileDown className="h-4 w-4 mr-2" />
            Download Template
          </Button>
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

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>CSV Import Guidelines</CardTitle>
          <CardDescription>
            Follow these guidelines to ensure successful import of your audience data:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the template file as a starting point</li>
            <li>Required columns: email, country</li>
            <li>Date format: YYYY-MM-DD (e.g., 2024-02-09)</li>
            <li>Numbers should be plain digits (e.g., 5)</li>
            <li>First row must contain column headers</li>
            <li>UTF-8 encoding is required</li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Segment</CardTitle>
            <CardDescription>Create a new audience segment</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "manual" | "ai" | "dynamic")}>
              <TabsList className="mb-4">
                <TabsTrigger value="manual">
                  <Filter className="h-4 w-4 mr-2" />
                  Manual
                </TabsTrigger>
                <TabsTrigger value="ai">
                  <Brain className="h-4 w-4 mr-2" />
                  AI-Powered
                </TabsTrigger>
                <TabsTrigger value="dynamic">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Dynamic
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
                      {form.watch("conditions")?.map((conditionGroup, groupIndex) => (
                        <Card key={groupIndex}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">
                                Condition Group {groupIndex + 1}
                              </CardTitle>
                              {groupIndex > 0 && (
                                <FormField
                                  control={form.control}
                                  name={`conditions.${groupIndex}.logicOperator`}
                                  render={({ field }) => (
                                    <Select
                                      value={field.value}
                                      onValueChange={field.onChange}
                                    >
                                      <SelectTrigger className="w-24">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="AND">AND</SelectItem>
                                        <SelectItem value="OR">OR</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {conditionGroup.group.map((condition, conditionIndex) => (
                                <div key={conditionIndex} className="flex gap-2 items-start">
                                  <FormField
                                    control={form.control}
                                    name={`conditions.${groupIndex}.group.${conditionIndex}.field`}
                                    render={({ field }) => (
                                      <FormItem className="flex-1">
                                        <Select
                                          value={field.value}
                                          onValueChange={(value) => {
                                            const fieldType = AVAILABLE_FIELDS.find(
                                              (f) => f.value === value
                                            )?.type;
                                            form.setValue(
                                              `conditions.${groupIndex}.group.${conditionIndex}.type`,
                                              fieldType as any
                                            );
                                            field.onChange(value);
                                          }}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select field" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {AVAILABLE_FIELDS.map((option) => (
                                              <SelectItem
                                                key={option.value}
                                                value={option.value}
                                              >
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
                                    name={`conditions.${groupIndex}.group.${conditionIndex}.operator`}
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
                                            {OPERATORS[
                                              form.watch(
                                                `conditions.${groupIndex}.group.${conditionIndex}.type`
                                              ) as keyof typeof OPERATORS
                                            ]?.map((option) => (
                                              <SelectItem
                                                key={option.value}
                                                value={option.value}
                                              >
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
                                    name={`conditions.${groupIndex}.group.${conditionIndex}.value`}
                                    render={({ field }) => (
                                      <FormItem className="flex-1">
                                        <FormControl>
                                          {form.watch(
                                            `conditions.${groupIndex}.group.${conditionIndex}.type`
                                          ) === "date" ? (
                                            <Input
                                              {...field}
                                              type="date"
                                              placeholder="Value"
                                            />
                                          ) : form.watch(
                                              `conditions.${groupIndex}.group.${conditionIndex}.type`
                                            ) === "boolean" ? (
                                            <Select
                                              value={field.value}
                                              onValueChange={field.onChange}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select value" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="true">Yes</SelectItem>
                                                <SelectItem value="false">No</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          ) : (
                                            <Input {...field} placeholder="Value" />
                                          )}
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  {form.watch(
                                    `conditions.${groupIndex}.group.${conditionIndex}.operator`
                                  ) === "inLast" && (
                                    <FormField
                                      control={form.control}
                                      name={`conditions.${groupIndex}.group.${conditionIndex}.timeframe`}
                                      render={({ field }) => (
                                        <FormItem className="flex-1">
                                          <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select timeframe" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {TIME_UNITS.map((unit) => (
                                                <SelectItem
                                                  key={unit.value}
                                                  value={unit.value}
                                                >
                                                  {unit.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </FormItem>
                                      )}
                                    />
                                  )}

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeCondition(groupIndex, conditionIndex)
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addCondition(groupIndex)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Condition
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addConditionGroup}
                      >
                        Add Condition Group
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="dynamic">
                    <div className="space-y-4">
                      {form.watch("behaviorRules")?.map((rule, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <FormField
                            control={form.control}
                            name={`behaviorRules.${index}.event`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select event" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {BEHAVIOR_EVENTS.map((event) => (
                                      <SelectItem
                                        key={event.value}
                                        value={event.value}
                                      >
                                        {event.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`behaviorRules.${index}.threshold`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    min="1"
                                    placeholder="Threshold"
                                    onChange={(e) =>
                                      field.onChange(parseInt(e.target.value))
                                    }
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`behaviorRules.${index}.timeframe`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select timeframe" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TIME_UNITS.map((unit) => (
                                      <SelectItem
                                        key={unit.value}
                                        value={`${7} ${unit.value}`}
                                      >
                                        Last {7} {unit.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBehaviorRule(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addBehaviorRule}
                      >
                        Add Behavior Rule
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Members</p>
                    <p className="text-2xl font-bold">{segment.metrics.totalMembers}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Engagement Rate</p>
                    <p className="text-2xl font-bold">{segment.metrics.engagementRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Growth Rate</p>
                    <p className="text-2xl font-bold">{segment.metrics.growthRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Conversion Rate</p>
                    <p className="text-2xl font-bold">{segment.metrics.conversionRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Avg. Order Value</p>
                    <p className="text-2xl font-bold">${segment.metrics.averageOrderValue}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Churn Risk</p>
                    <p className="text-2xl font-bold">{segment.metrics.churnRisk}%</p>
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