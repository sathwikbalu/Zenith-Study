import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Star } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  subject: string;
  content: string;
  lastEdited: string;
  starred: boolean;
}

const NoteEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ title: '', subject: '', content: '' });
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      const savedNotes = localStorage.getItem('notes');
      if (savedNotes) {
        const notes: Note[] = JSON.parse(savedNotes);
        const note = notes.find(n => n.id === id);
        if (note) {
          setFormData({ title: note.title, subject: note.subject, content: note.content });
          setStarred(note.starred);
        }
      }
    }
  }, [id]);

  const handleSave = () => {
    if (!formData.title || !formData.subject) {
      toast({ title: 'Error', description: 'Title and subject are required', variant: 'destructive' });
      return;
    }

    const savedNotes = localStorage.getItem('notes');
    const notes: Note[] = savedNotes ? JSON.parse(savedNotes) : [];

    if (id && id !== 'new') {
      const updatedNotes = notes.map(note =>
        note.id === id
          ? { ...note, ...formData, lastEdited: new Date().toISOString(), starred }
          : note
      );
      localStorage.setItem('notes', JSON.stringify(updatedNotes));
      toast({ title: 'Success', description: 'Note updated successfully' });
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        ...formData,
        lastEdited: new Date().toISOString(),
        starred,
      };
      localStorage.setItem('notes', JSON.stringify([...notes, newNote]));
      toast({ title: 'Success', description: 'Note created successfully' });
    }

    navigate('/dashboard/notes');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/dashboard/notes')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Notes
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStarred(!starred)}
          >
            <Star className={`w-5 h-5 ${starred ? 'fill-accent text-accent' : ''}`} />
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
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter note title"
            className="text-2xl font-semibold h-auto py-3"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Enter subject"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
