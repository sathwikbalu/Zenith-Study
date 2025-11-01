import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, MessageCircle, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { forumsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Forum {
  _id: string;
  id: string;
  topic: string;
  description: string;
  createdBy: {
    _id: string;
    name: string;
  };
  members: string[]; // Array of member IDs
  memberCount: number;
  unreadCount: number;
  createdAt: string;
}

const ForumList = () => {
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Filter forums based on search query
  const filteredForums = useMemo(() => {
    return forums.filter(forum => 
      forum.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      forum.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [forums, searchQuery]);

  useEffect(() => {
    fetchForums();
  }, []);

  const fetchForums = async () => {
    try {
      setLoading(true);
      const fetchedForums = await forumsAPI.getAll();
      // Map _id to id for frontend compatibility
      const forumsWithId = fetchedForums.map((forum: any) => ({
        ...forum,
        id: forum._id,
      }));
      setForums(forumsWithId);
    } catch (error) {
      console.error("Error fetching forums:", error);
      toast({
        title: "Error",
        description: "Failed to fetch forums",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinForum = async (forumId: string) => {
    try {
      await forumsAPI.join(forumId);
      toast({
        title: "Success",
        description: "Successfully joined the forum",
      });
      fetchForums(); // Refresh the list
    } catch (error: any) {
      console.error("Error joining forum:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to join forum",
        variant: "destructive",
      });
    }
  };

  const isMember = (forum: Forum) => {
    return forum.members.includes(user?._id || '');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
          <h2 className="text-3xl font-display font-bold mb-2">Discussion Forums</h2>
          <p className="text-muted-foreground">
            Join forums to discuss topics with other students
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => navigate("/dashboard/forums/create")}
        >
          <Plus className="w-4 h-4" />
          Create Forum
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Search forums by topic or description..."
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

      {filteredForums.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No forums found' : 'No forums yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? `No forums match your search for "${searchQuery}"` 
                : 'Be the first to create a discussion forum'}
            </p>
            <Button onClick={() => navigate("/dashboard/forums/create")}>
              Create Forum
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredForums.map((forum) => (
            <Card key={forum.id} className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg line-clamp-2">{forum.topic}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {forum.description}
                    </CardDescription>
                  </div>
                  {forum.unreadCount > 0 && (
                    <Badge variant="destructive" className="rounded-full">
                      {forum.unreadCount}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{forum.memberCount} members</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>Created by {forum.createdBy.name}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>Created {formatDate(forum.createdAt)}</span>
                </div>
                <div className="flex gap-2">
                  {isMember(forum) ? (
                    <Button 
                      className="w-full"
                      onClick={() => navigate(`/dashboard/forums/${forum.id}`)}
                    >
                      View Forum
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => handleJoinForum(forum.id)}
                    >
                      Join Forum
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForumList;