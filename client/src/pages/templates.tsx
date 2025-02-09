import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { EmailEditor } from "@/components/journey/email-editor";
import { TemplateList } from "@/components/journey/template-list";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { EmailTemplate, InsertEmailTemplate } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function Templates() {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();

  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (template: InsertEmailTemplate) => {
      await apiRequest("POST", "/api/templates", template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsEditing(false);
      setCurrentTemplate(null);
      toast({
        title: "Success",
        description: "Email template saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTemplateChange = (template: { subject: string; body: string; variables?: string[] }) => {
    console.log("Template changed:", template);
  };

  const handleTemplateSave = (template: { subject: string; body: string; variables?: string[] }) => {
    createMutation.mutate({
      name: template.subject, // Using subject as name for simplicity
      subject: template.subject,
      body: template.body,
      variables: template.variables || [],
    });
  };

  const handleEdit = (template: EmailTemplate) => {
    setCurrentTemplate(template);
    setIsEditing(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <Button onClick={() => setIsEditing(true)} disabled={isEditing}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {isEditing ? (
        <EmailEditor
          onChange={handleTemplateChange}
          onSave={handleTemplateSave}
        />
      ) : (
        <TemplateList
          templates={templates}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}