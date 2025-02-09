import { EmailEditor } from "@/components/journey/email-editor";
import { useToast } from "@/hooks/use-toast";

export default function Templates() {
  const { toast } = useToast();

  const handleTemplateChange = (template: { subject: string; body: string; variables?: string[] }) => {
    console.log("Template changed:", template);
  };

  const handleTemplateSave = (template: { subject: string; body: string; variables?: string[] }) => {
    // TODO: Implement template saving to backend
    console.log("Template saved:", template);
    toast({
      title: "Success",
      description: "Email template saved successfully",
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Email Templates</h1>
      <EmailEditor onChange={handleTemplateChange} onSave={handleTemplateSave} />
    </div>
  );
}
