import { EmailTemplate } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";

interface TemplateListProps {
  templates: EmailTemplate[];
  onEdit?: (template: EmailTemplate) => void;
  onDelete?: (id: number) => void;
}

export function TemplateList({ templates, onEdit, onDelete }: TemplateListProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Variables</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell className="font-medium">{template.name}</TableCell>
              <TableCell>{template.subject}</TableCell>
              <TableCell>{template.variables.join(", ")}</TableCell>
              <TableCell>{formatDate(template.updatedAt)}</TableCell>
              <TableCell className="text-right space-x-2">
                {onEdit && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onEdit(template)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
