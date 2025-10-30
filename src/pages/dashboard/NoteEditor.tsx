import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Star } from "lucide-react";
import { notesAPI } from "@/lib/api";

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
            variant="ghost"
            size="icon"
            onClick={() => setStarred(!starred)}
          >
            <Star
              className={`w-5 h-5 ${starred ? "fill-accent text-accent" : ""}`}
            />
          </Button>
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
    </div>
  );
};

export default NoteEditor;
