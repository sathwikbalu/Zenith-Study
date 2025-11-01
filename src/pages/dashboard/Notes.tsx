import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Star, Trash2, Download, MoreHorizontal, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";
import { notesAPI } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOption, setFilterOption] = useState("all");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addActivity } = useActivity();
  const { user } = useAuth();

  // Filter notes based on search query and filter option
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      // Apply search filter (case insensitive, partial match on subject)
      const matchesSearch = note.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           note.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply filter option
      if (filterOption === "starred") {
        return matchesSearch && note.starred;
      } else if (filterOption === "recent") {
        const noteDate = new Date(note.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return matchesSearch && noteDate >= weekAgo;
      }
      
      return matchesSearch;
    });
  }, [notes, searchQuery, filterOption]);

  useEffect(() => {
    fetchNotes();

    // Track activity when student views notes
    if (user?.role === "student") {
      addActivity();
    }

    // Refetch notes when window regains focus (user comes back from session)
    const handleFocus = () => {
      console.log("Window focused, refetching notes...");
      fetchNotes();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      console.log("Fetching notes from API...");
      const fetchedNotes = await notesAPI.getAll();
      console.log("Fetched notes:", fetchedNotes);
      // Map _id to id for frontend compatibility
      const notesWithId = fetchedNotes.map((note: any) => ({
        ...note,
        id: note._id,
      }));
      setNotes(notesWithId);
      console.log(`Total notes loaded: ${notesWithId.length}`);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notesAPI.delete(id);
      setNotes(notes.filter((note) => note.id !== id));
      toast({ title: "Success", description: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const toggleStar = async (id: string) => {
    try {
      await notesAPI.toggleStar(id);
      setNotes(
        notes.map((note) =>
          note.id === id ? { ...note, starred: !note.starred } : note
        )
      );
    } catch (error) {
      console.error("Error toggling star:", error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  // PDF generation function
  const generatePDF = async (note: Note) => {
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
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">${note.title}</h1>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span><strong>Subject:</strong> ${note.subject}</span>
            <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
          </div>
          <hr style="border: 1px solid #eee; margin: 10px 0;">
        </div>
        <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${note.content}</div>
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
      pdf.save(`${note.title || 'note'}.pdf`);
      
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
  const generateDOCX = async (note: Note) => {
    try {
      const docxModule = await import("docx");
      const { saveAs } = await import("file-saver");
      
      // Create document
      const doc = new docxModule.Document({
        sections: [{
          properties: {},
          children: [
            new docxModule.Paragraph({
              text: note.title,
              heading: docxModule.HeadingLevel.HEADING_1,
            }),
            new docxModule.Paragraph({
              text: `Subject: ${note.subject}`,
              spacing: { after: 200 },
            }),
            new docxModule.Paragraph({
              text: `Date: ${new Date().toLocaleDateString()}`,
              spacing: { after: 400 },
            }),
            new docxModule.Paragraph({
              children: [new docxModule.TextRun({
                text: note.content,
                break: 1,
              })],
              spacing: { after: 200 },
            }),
          ],
        }],
      });
      
      // Generate and download
      docxModule.Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${note.title || 'note'}.docx`);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilterOption("all");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Notes</h2>
          <p className="text-muted-foreground">
            Your personal and shared study notes
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => navigate("/dashboard/notes/new")}
        >
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search notes by subject or title..."
            className="pl-10 pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={clearSearch}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="w-full md:w-48">
          <Select value={filterOption} onValueChange={setFilterOption}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="starred">Starred Notes</SelectItem>
              <SelectItem value="recent">Recently Added</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No notes found</h3>
          <p className="text-muted-foreground">
            {searchQuery 
              ? `No notes match your search for "${searchQuery}"` 
              : "Create your first note to get started"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="hover:shadow-lg transition-all group cursor-pointer"
              onClick={() => navigate(`/dashboard/notes/${note.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="w-8 h-8 text-primary mb-2" />
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(note.id);
                      }}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          note.starred ? "fill-accent text-accent" : ""
                        }`}
                      />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          generatePDF(note);
                        }}>
                          Download as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          generateDOCX(note);
                        }}>
                          Download as DOCX
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardTitle className="text-lg">{note.title}</CardTitle>
                <CardDescription>{note.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Last edited {formatDate(note.updatedAt)}
                </p>
                {note.content && (
                  <p className="text-sm line-clamp-3 mb-4">{note.content}</p>
                )}
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(note.id)}
                    className="gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notes;
