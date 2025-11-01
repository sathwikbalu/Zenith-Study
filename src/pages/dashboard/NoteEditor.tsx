import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Star, Sparkles, Loader2, Download } from "lucide-react";
import { notesAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Note {
  _id: string;
  id: string;
  title: string;
  subject: string;
  content: string;
  lastEdited: string;
  starred: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const NoteEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    content: "",
  });
  const [starred, setStarred] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (id && id !== "new") {
      fetchNote(id);
    }
  }, [id]);

  const fetchNote = async (noteId: string) => {
    try {
      setLoading(true);
      const note = await notesAPI.getById(noteId);
      setFormData({
        title: note.title,
        subject: note.subject,
        content: note.content,
      });
      setStarred(note.starred);
    } catch (error) {
      console.error("Error fetching note:", error);
      toast({
        title: "Error",
        description: "Failed to fetch note",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!formData.content.trim()) {
      toast({
        title: "Error",
        description: "Please add some content to summarize",
        variant: "destructive",
      });
      return;
    }

    try {
      setSummarizing(true);
      const response = await fetch(
        "http://localhost:5001/api/summarize-notes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: formData.content,
            title: formData.title || "Untitled Note",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to summarize notes");
      }

      const data = await response.json();
      setSummary(data.summary);
      setShowSummary(true);
      toast({
        title: "Success",
        description: "Notes summarized successfully!",
      });
    } catch (error) {
      console.error("Error summarizing notes:", error);
      toast({
        title: "Error",
        description:
          "Failed to summarize notes. Make sure AI backend is running on port 5001.",
        variant: "destructive",
      });
    } finally {
      setSummarizing(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.subject) {
      toast({
        title: "Error",
        description: "Title and subject are required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (id && id !== "new") {
        // Update existing note
        const updatedNote = await notesAPI.update(id, {
          ...formData,
          starred,
        });
        toast({ title: "Success", description: "Note updated successfully" });
      } else {
        // Create new note
        const newNote = await notesAPI.create({
          ...formData,
          starred,
        });
        toast({ title: "Success", description: "Note created successfully" });
      }

      navigate("/dashboard/notes");
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    }
  };

  // PDF generation function
  const generatePDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");
      
      // Create a temporary HTML element for the note content
      const tempElement = document.createElement('div');
      tempElement.style.padding = '20px';
      tempElement.style.backgroundColor = 'white';
      tempElement.style.color = 'black';
      tempElement.style.width = '800px';
      tempElement.style.fontFamily = 'Arial, sans-serif';
      
      // Add note metadata
      tempElement.innerHTML = `
        <div style="margin-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">${formData.title}</h1>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span><strong>Subject:</strong> ${formData.subject}</span>
            <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
          </div>
          <hr style="border: 1px solid #eee; margin: 10px 0;">
        </div>
        <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${formData.content}</div>
      `;
      
      document.body.appendChild(tempElement);
      
      // Generate canvas from the HTML element
      const canvas = await html2canvas(tempElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${formData.title || 'note'}.pdf`);
      
      // Clean up
      document.body.removeChild(tempElement);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  // DOCX generation function
  const generateDOCX = async () => {
    try {
      const docxModule = await import("docx");
      const { saveAs } = await import("file-saver");
      
      // Create document
      const doc = new docxModule.Document({
        sections: [{
          properties: {},
          children: [
            new docxModule.Paragraph({
              text: formData.title,
              heading: docxModule.HeadingLevel.HEADING_1,
            }),
            new docxModule.Paragraph({
              text: `Subject: ${formData.subject}`,
              spacing: { after: 200 },
            }),
            new docxModule.Paragraph({
              text: `Date: ${new Date().toLocaleDateString()}`,
              spacing: { after: 400 },
            }),
            new docxModule.Paragraph({
              children: [new docxModule.TextRun({
                text: formData.content,
                break: 1,
              })],
              spacing: { after: 200 },
            }),
          ],
        }],
      });
      
      // Generate and download
      docxModule.Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${formData.title || 'note'}.docx`);
      });
    } catch (error) {
      console.error("Error generating DOCX:", error);
      toast({
        title: "Error",
        description: "Failed to generate DOCX",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard/notes")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Notes
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSummarize}
            disabled={summarizing || !formData.content}
            className="gap-2"
          >
            {summarizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {summarizing ? "Summarizing..." : "AI Summarizer"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStarred(!starred)}
          >
            <Star
              className={`w-5 h-5 ${starred ? "fill-accent text-accent" : ""}`}
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={generatePDF}>
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={generateDOCX}>
                DOCX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Note
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Enter note title"
            className="text-2xl font-semibold h-auto py-3"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            placeholder="Enter subject"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            placeholder="Start writing your note..."
            rows={20}
            className="resize-none"
          />
        </div>
      </div>

      {/* AI Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Summary
            </DialogTitle>
            <DialogDescription>
              Important concepts, examples, and key points from your notes
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap">{summary}</div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoteEditor;
