'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatAction } from '@/app/actions';
import type { ChatMessage } from '@/types';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'bot', text: 'Hello! How can I help you today?' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = { from: 'user', text: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await chatAction({ message: inputValue });
      if (res.error) {
        throw new Error(res.error);
      }
      if(res.data) {
        const botMessage: ChatMessage = { from: 'bot', text: res.data.response };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Sorry, I couldn't get a response.";
      const errorBotMessage: ChatMessage = { from: 'bot', text: errorMessage };
      setMessages((prev) => [...prev, errorBotMessage]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg z-50"
        size="icon"
      >
        {isOpen ? <X size={32} /> : <MessageSquare size={32} />}
      </Button>

      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 h-[28rem] flex flex-col shadow-xl z-50">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Bot />
                Health Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              <div className="p-4 space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-start gap-3',
                      msg.from === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.from === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                        <Bot size={20} />
                      </div>
                    )}
                    <div
                      className={cn(
                        'p-3 rounded-lg max-w-[80%]',
                        msg.from === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-muted rounded-bl-none'
                      )}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                     {msg.from === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
                        <User size={20} />
                      </div>
                    )}
                  </div>
                ))}
                 {loading && (
                    <div className="flex items-start gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                            <Bot size={20} />
                        </div>
                        <div className="p-3 rounded-lg max-w-[80%] bg-muted rounded-bl-none">
                            <Loader2 className="w-5 h-5 animate-spin"/>
                        </div>
                    </div>
                 )}
              </div>
            </ScrollArea>
          </CardContent>
          <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-grow"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={loading}>
              <Send size={20} />
            </Button>
          </form>
        </Card>
      )}
    </>
  );
}
