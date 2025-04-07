import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Send, User, Users } from 'lucide-react';

interface Message {
  type: 'message' | 'notification' | 'status';
  sender: string;
  content: string;
  timestamp: number;
}

interface ChatUser {
  id: string;
  username: string;
}

const Chat: React.FC = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      toast({
        title: 'Connected to chat',
        description: 'You are now connected to the chat server',
      });
      
      // Set username based on authenticated user or generate unique ID
      if (user?.username) {
        setUsername(user.username);
        setTimeout(() => {
          newSocket.send(JSON.stringify({
            type: 'setUsername',
            username: user.username
          }));
        }, 500);
      }
    };
    
    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);
        
        if (message.type === 'userList') {
          setUsers(message.content);
        } else {
          setMessages((prev) => [...prev, message]);
          scrollToBottom();
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    newSocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      toast({
        title: 'Disconnected from chat',
        description: 'You have been disconnected from the chat server',
        variant: 'destructive',
      });
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Connection error',
        description: 'Failed to connect to the chat server',
        variant: 'destructive',
      });
    };
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [toast, user]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !inputValue.trim()) {
      return;
    }
    
    const message = {
      type: 'chat',
      content: inputValue,
    };
    
    socket.send(JSON.stringify(message));
    setInputValue('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <Card className="w-full max-w-4xl shadow-lg">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Внутренний чат</CardTitle>
            <CardDescription>
              {isConnected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Соединение активно
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Отключено
                </Badge>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span className="text-sm text-muted-foreground">{users.length} онлайн</span>
          </div>
        </div>
      </CardHeader>
      <div className="grid md:grid-cols-4 grid-cols-1">
        <div className="md:block hidden border-r p-4">
          <h3 className="text-sm font-medium mb-4">Пользователи онлайн</h3>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">{user.username}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="md:col-span-3 col-span-1">
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-4">
              <div className="space-y-4">
                {messages.map((message, index) => {
                  if (message.type === 'status' || message.type === 'notification') {
                    return (
                      <div key={index} className="text-center text-sm text-muted-foreground py-1">
                        {message.content}
                      </div>
                    );
                  }
                  
                  const isCurrentUser = message.sender === username;
                  
                  return (
                    <div
                      key={index}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} gap-2`}
                    >
                      {!isCurrentUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getInitials(message.sender)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-lg ${
                          isCurrentUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {!isCurrentUser && (
                          <div className="text-xs font-medium mb-1">{message.sender}</div>
                        )}
                        <div>{message.content}</div>
                        <div className="text-xs opacity-70 text-right mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t p-3">
            <div className="flex items-center w-full gap-2">
              <Input
                placeholder="Введите сообщение..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!isConnected}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!isConnected || !inputValue.trim()}
                size="icon"
              >
                <Send size={18} />
              </Button>
            </div>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
};

export default Chat;