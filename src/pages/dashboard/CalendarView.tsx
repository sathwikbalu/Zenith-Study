import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Clock, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  type: 'session' | 'exam' | 'meeting' | 'lab' | 'workshop' | 'other';
  color: string;
}

const eventColors = {
  session: 'bg-primary',
  exam: 'bg-destructive',
  meeting: 'bg-secondary',
  lab: 'bg-accent',
  workshop: 'bg-primary',
  other: 'bg-muted-foreground',
};

const CalendarView = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', date: new Date(), time: '', type: 'other' as CalendarEvent['type'] });
  const { toast } = useToast();

  useEffect(() => {
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
      const parsed = JSON.parse(savedEvents);
      setEvents(parsed.map((e: any) => ({ ...e, date: new Date(e.date) })));
    }
  }, []);

  const saveEvents = (updatedEvents: CalendarEvent[]) => {
    setEvents(updatedEvents);
    localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.date) {
      toast({ title: 'Error', description: 'Title and date are required', variant: 'destructive' });
      return;
    }

    if (editingEvent) {
      const updatedEvents = events.map(event =>
        event.id === editingEvent.id
          ? { ...event, ...formData, color: eventColors[formData.type] }
          : event
      );
      saveEvents(updatedEvents);
      toast({ title: 'Success', description: 'Event updated successfully' });
    } else {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        ...formData,
        color: eventColors[formData.type],
      };
      saveEvents([...events, newEvent]);
      toast({ title: 'Success', description: 'Event created successfully' });
    }

    setIsDialogOpen(false);
    setEditingEvent(null);
    setFormData({ title: '', description: '', date: new Date(), time: '', type: 'other' });
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({ title: event.title, description: event.description, date: event.date, time: event.time, type: event.type });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    saveEvents(events.filter(event => event.id !== id));
    toast({ title: 'Success', description: 'Event deleted successfully' });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event =>
      format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const upcomingEvents = events
    .filter(event => event.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Calendar</h2>
          <p className="text-muted-foreground">Keep track of your study schedule and deadlines</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => {
              setEditingEvent(null);
              setFormData({ title: '', description: '', date: new Date(), time: '', type: 'other' });
            }}>
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
              <DialogDescription>
                {editingEvent ? 'Update your event details' : 'Add a new event to your calendar'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter event description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={format(formData.date, 'yyyy-MM-dd')}
                  onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as CalendarEvent['type'] })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="session">Study Session</option>
                  <option value="exam">Exam</option>
                  <option value="meeting">Meeting</option>
                  <option value="lab">Lab</option>
                  <option value="workshop">Workshop</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit}>
                {editingEvent ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>Your study schedule at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className={cn("rounded-md border pointer-events-auto")}
                modifiers={{
                  hasEvents: (date) => getEventsForDate(date).length > 0,
                }}
                modifiersClassNames={{
                  hasEvents: 'bg-primary/20 font-bold',
                }}
              />
              {selectedDate && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Events on {format(selectedDate, 'PPP')}</h3>
                  <div className="space-y-2">
                    {getEventsForDate(selectedDate).length > 0 ? (
                      getEventsForDate(selectedDate).map((event) => (
                        <div key={event.id} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{event.title}</p>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {event.time && (
                                  <span className="text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {event.time}
                                  </span>
                                )}
                                <span className={cn("text-xs px-2 py-1 rounded", event.color, "text-white")}>
                                  {event.type}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(event)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(event.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No events scheduled for this day</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Next events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedDate(event.date)}
                  >
                    <div className={cn("w-1 h-full rounded-full", event.color)}></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{event.title}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        {format(event.date, 'PPP')} {event.time && `at ${event.time}`}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
