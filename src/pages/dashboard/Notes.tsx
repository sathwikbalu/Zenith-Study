import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Star, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useActivity } from '@/contexts/ActivityContext';
import { useAuth } from '@/contexts/AuthContext';

interface Note {
  id: string;
  title: string;
  subject: string;
  content: string;
  lastEdited: string;
  starred: boolean;
}

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addActivity } = useActivity();
  const { user } = useAuth();

  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
    
    // Track activity when student views notes
    if (user?.role === 'student') {
      addActivity();
    }
  }, []);

  const saveNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
  };

  const handleDelete = (id: string) => {
    saveNotes(notes.filter(note => note.id !== id));
    toast({ title: 'Success', description: 'Note deleted successfully' });
  };

  const toggleStar = (id: string) => {
    const updatedNotes = notes.map(note =>
      note.id === id ? { ...note, starred: !note.starred } : note
    );
    saveNotes(updatedNotes);
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
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Notes</h2>
          <p className="text-muted-foreground">Your personal and shared study notes</p>
        </div>
        <Button className="gap-2" onClick={() => navigate('/dashboard/notes/new')}>
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <Card 
            key={note.id} 
            className="hover:shadow-lg transition-all group cursor-pointer"
            onClick={() => navigate(`/dashboard/notes/${note.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileText className="w-8 h-8 text-primary mb-2" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(note.id);
                  }}
                >
                  <Star
                    className={`w-4 h-4 ${note.starred ? 'fill-accent text-accent' : ''}`}
                  />
                </Button>
              </div>
              <CardTitle className="text-lg">{note.title}</CardTitle>
              <CardDescription>{note.subject}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Last edited {formatDate(note.lastEdited)}</p>
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
    </div>
  );
};

export default Notes;
