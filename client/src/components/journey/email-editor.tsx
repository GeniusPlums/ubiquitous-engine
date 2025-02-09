import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EmailEditorProps {
  onChange: (template: { subject: string; body: string }) => void;
}

export function EmailEditor({ onChange }: EmailEditorProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleChange = (field: "subject" | "body", value: string) => {
    if (field === "subject") setSubject(value);
    else setBody(value);
    onChange({ subject, body });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => handleChange("subject", e.target.value)}
            placeholder="Enter email subject"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="body">Body</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => handleChange("body", e.target.value)}
            placeholder="Enter email content"
            className="min-h-[200px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
