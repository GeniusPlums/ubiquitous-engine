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

// Updated column definitions
const CSV_COLUMNS = [
  "Name", "Email", "Financial Status", "Paid at", "Fulfillment Status", "Fulfilled at",
  "Accepts Marketing", "Currency", "Subtotal", "Shipping", "Taxes", "Total",
  "Discount Code", "Discount Amount", "Shipping Method", "Created at",
  "Lineitem quantity", "Lineitem name", "Lineitem price", "Lineitem compare at price",
  "Lineitem sku", "Lineitem requires shipping", "Lineitem taxable",
  "Lineitem fulfillment status", "Billing Name", "Billing Street", "Billing Address1",
  "Billing Address2", "Billing Company", "Billing City", "Billing Zip",
  "Billing Province", "Billing Country", "Billing Phone", "Shipping Name",
  "Shipping Street", "Shipping Address1", "Shipping Address2", "Shipping Company",
  "Shipping City", "Shipping Zip", "Shipping Province", "Shipping Country",
  "Shipping Phone", "Notes", "Note Attributes", "Cancelled at", "Payment Method",
  "Payment Reference", "Refunded Amount", "Vendor", "Outstanding Balance",
  "Employee", "Location", "Device ID", "Id", "Tags", "Risk Level", "Source",
  "Lineitem discount", "Tax 1 Name", "Tax 1 Value", "Tax 2 Name", "Tax 2 Value",
  "Tax 3 Name", "Tax 3 Value", "Tax 4 Name", "Tax 4 Value", "Tax 5 Name",
  "Tax 5 Value", "Phone", "Receipt Number", "Duties", "Billing Province Name",
  "Shipping Province Name", "Payment ID", "Payment Terms Name", "Next Payment Due At",
  "Payment References"
];

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
    // Create a sample data row with empty values for all columns
    const sampleData = CSV_COLUMNS.map(() => "");
    sampleData[CSV_COLUMNS.indexOf("Name")] = "John Doe";
    sampleData[CSV_COLUMNS.indexOf("Email")] = "john.doe@example.com";

    const csvContent = [
      CSV_COLUMNS.join(","),
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
    window.URL.revokeObjectURL(url);
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

      // Get and normalize headers
      const headers = lines[0].split(',').map(header => header.trim());

      // Check if required columns exist
      const requiredColumns = ["Name", "Email"];
      const missingColumns = requiredColumns.filter(col =>
        !headers.some(header => header === col)
      );

      if (missingColumns.length > 0) {
        toast({
          title: "Invalid CSV Format",
          description: `Missing required columns: ${missingColumns.join(', ')}`,
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
          const result = await response.json();
          queryClient.invalidateQueries({ queryKey: ["/api/segments"] });
          toast({
            title: "Import Successful",
            description: `Successfully imported ${result.importedCount} customer records.
            ${result.duplicateCount ? `\nSkipped ${result.duplicateCount} duplicate records.` : ''}
            ${result.skippedCount ? `\nSkipped ${result.skippedCount} invalid records.` : ''}`,
          });
          // Reset file input
          event.target.value = '';
        } else {
          const error = await response.json();
          if (error.code === '23505') { // PostgreSQL duplicate key error
            toast({
              title: "Duplicate Records Found",
              description: "Some records already exist in the database. Please review your data and try again.",
              variant: "destructive",
            });
          } else {
            throw new Error(error.message || "Failed to import data");
          }
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: error instanceof Error
            ? `Failed to import data: ${error.message}`
            : "Failed to import customer data. Please check the file format and try again.",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
  };

  // Update the CSV import guidelines in the card
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
            Follow these guidelines to ensure successful import of your customer data:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-2">
            <li>Download and use the template file as a starting point</li>
            <li>Required columns: Name, Email</li>
            <li>Date format: YYYY-MM-DD HH:mm:ss (e.g., 2024-02-12 10:30:00)</li>
            <li>Boolean values should be 'true' or 'false'</li>
            <li>Numeric values should be plain digits (e.g., 99.99)</li>
            <li>First row must contain the exact column headers as in the template</li>
            <li>UTF-8 encoding is required</li>
            <li>Maximum file size: 5MB</li>
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