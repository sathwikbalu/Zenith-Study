import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { forumsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { Send, ArrowLeft, Users } from 'lucide-react';

interface Message {
  _id: string;
  id: string;
  forumId: string;
  senderId: {
    _id: string;
    name: string;
  };
  text: string;
  createdAt: string;
}

interface OnlineUser {
  userId: string;
  userName: string;
}

const ForumChat = () => {
  const { id: forumId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (forumId) {
      fetchMessages();
      joinForumRoom();
    }

    return () => {
      leaveForumRoom();
    };
  }, [forumId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on("forum-message", (messageData) => {
      setMessages(prev => [...prev, {
        _id: messageData.id,
        id: messageData.id,
        forumId: messageData.forumId,
        senderId: {
          _id: messageData.userId,
          name: messageData.userName
        },
        text: messageData.text,
        createdAt: messageData.timestamp
      }]);
    });

    // Listen for user joining
    socket.on("user-joined-forum", (userData) => {
      setOnlineUsers(prev => {
        if (!prev.some(user => user.userId === userData.userId)) {
          return [...prev, { userId: userData.userId, userName: userData.userName }];
        }
        return prev;
      });
    });

    // Listen for user leaving
    socket.on("user-left-forum", (userData) => {
      setOnlineUsers(prev => prev.filter(user => user.userId !== userData.userId));
    });

    // Receive current online users
    socket.on("forum-users", (users) => {
      setOnlineUsers(users.map((user: any) => ({
        userId: user.userId,
        userName: user.userName
      })));
    });

    return () => {
      socket.off("forum-message");
      socket.off("user-joined-forum");
      socket.off("user-left-forum");
      socket.off("forum-users");
    };
  }, [socket]);

  const joinForumRoom = () => {
    if (socket && forumId && user) {
      socket.emit("join-forum", {
        forumId,
        userId: user._id,
        userName: user.name
      });
    }
  };

  const leaveForumRoom = () => {
    if (socket && forumId) {
      socket.emit("leave-forum", { forumId });
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const fetchedMessages = await forumsAPI.getMessages(forumId!);
      // Map _id to id for frontend compatibility
      const messagesWithId = fetchedMessages.map((message: any) => ({
        ...message,
        id: message._id,
      }));
      setMessages(messagesWithId);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !forumId) return;

    try {
      // Emit message through socket
      if (socket && user) {
        socket.emit("forum-message", {
          forumId,
          message: newMessage,
          userId: user._id,
          userName: user.name
        });
      }

      // Also send to backend
      await forumsAPI.sendMessage(forumId, { text: newMessage });
      setNewMessage('');
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard/forums")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forums
        </Button>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span className="text-sm">{onlineUsers.length} online</span>
        </div>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-0">
          <div className="flex h-full">
            {/* Chat Messages */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId._id === user?._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 ${
                        message.senderId._id === user?._id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.senderId._id !== user?._id && (
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback>
                              {message.senderId.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">
                            {message.senderId.name}
                          </span>
                        </div>
                      )}
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.senderId._id === user?._id
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForumChat;