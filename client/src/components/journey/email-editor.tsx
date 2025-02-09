import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface EmailTemplate {
  subject: string;
  body: string;
  variables?: string[];
}

interface EmailEditorProps {
  onChange: (template: EmailTemplate) => void;
  onSave?: (template: EmailTemplate) => void;
}

const availableVariables = [
  "{{user.name}}",
  "{{user.email}}",
  "{{company.name}}",
  "{{date}}",
];

export function EmailEditor({ onChange, onSave }: EmailEditorProps) {
  const [subject, setSubject] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Enter email content...",
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange({
        subject,
        body: editor.getHTML(),
        variables: detectVariables(editor.getHTML()),
      });
    },
  });

  const detectVariables = (content: string): string[] => {
    const matches = content.match(/{{[^}]+}}/g) || [];
    return Array.from(new Set(matches));
  };

  const insertVariable = (variable: string) => {
    if (editor) {
      editor.commands.insertContent(variable);
    }
  };

  const handlePreview = () => {
    if (!subject || !editor?.getHTML()) {
      toast({
        title: "Error",
        description: "Please fill in both subject and body before previewing",
        variant: "destructive",
      });
      return;
    }
    setIsPreview(!isPreview);
  };

  const handleSave = () => {
    if (onSave && subject && editor?.getHTML()) {
      onSave({
        subject,
        body: editor.getHTML(),
        variables: detectVariables(editor.getHTML()),
      });
      toast({
        title: "Success",
        description: "Email template saved successfully",
      });
    }
  };

  const generateFromPrompt = async () => {
    if (!prompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/templates/generate", { prompt });
      const data = await response.json();

      if (editor) {
        editor.commands.setContent(data.body);
      }
      setSubject(data.subject);

      toast({
        title: "Success",
        description: "Template generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const previewContent = () => {
    if (!editor) return null;
    let content = editor.getHTML();
    // Replace variables with sample data for preview
    content = content
      .replace(/{{user\.name}}/g, "John Doe")
      .replace(/{{user\.email}}/g, "john@example.com")
      .replace(/{{company\.name}}/g, "ACME Corp")
      .replace(/{{date}}/g, new Date().toLocaleDateString());
    return content;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt-based generation */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Generate from Prompt</Label>
          <div className="flex gap-2">
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the email template you want to generate..."
              className="flex-1"
            />
            <Button 
              onClick={generateFromPrompt}
              disabled={isGenerating}
              className="self-start"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
          />
        </div>

        {!isPreview && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Content</Label>
              <Select onValueChange={insertVariable}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Insert variable" />
                </SelectTrigger>
                <SelectContent>
                  {availableVariables.map((variable) => (
                    <SelectItem key={variable} value={variable}>
                      {variable}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <EditorContent editor={editor} className="min-h-[200px] border rounded-md p-4" />
          </div>
        )}

        {isPreview && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div 
              className="min-h-[200px] border rounded-md p-4 prose"
              dangerouslySetInnerHTML={{ __html: previewContent() || "" }}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handlePreview}>
          {isPreview ? "Edit" : "Preview"}
        </Button>
        {onSave && (
          <Button onClick={handleSave}>
            Save Template
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}