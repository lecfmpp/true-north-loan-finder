import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChatConfig {
  id: string;
  is_enabled: boolean;
  support_person_name: string;
  support_person_avatar_url: string | null;
  ai_instructions: string;
  widget_position: string;
  primary_color: string;
}

interface ChatQA {
  id: string;
  question: string;
  answer: string;
  related_links: { title: string; url: string }[];
  fallback_action: string;
  is_active: boolean;
  order_index: number;
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  links?: { title: string; url: string }[];
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [qaList, setQaList] = useState<ChatQA[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConfig();
    fetchQA();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_widget_config')
        .select('*')
        .eq('is_enabled', true)
        .single();

      if (error || !data) {
        console.log('Chat widget is disabled or not configured');
        return;
      }

      setConfig(data);
      
      // Add welcome message
      setMessages([{
        id: '1',
        type: 'bot',
        content: `Hi! I'm ${data.support_person_name}. How can I help you today?`,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchQA = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_widget_qa')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) {
        console.error('Error fetching Q&A:', error);
        return;
      }

      setQaList((data || []).map(item => ({
        ...item,
        related_links: Array.isArray(item.related_links) 
          ? item.related_links as { title: string; url: string }[]
          : []
      })));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const findMatchingQA = (userInput: string): ChatQA | null => {
    const input = userInput.toLowerCase();
    return qaList.find(qa => 
      qa.question.toLowerCase().includes(input) || 
      input.includes(qa.question.toLowerCase())
    ) || null;
  };

  const generateAIResponse = async (userInput: string, context: string) => {
    try {
      // This would typically call an AI service
      // For now, we'll return a fallback response
      return `I understand you're asking about "${userInput}". Let me help you with that. Based on our services, you might be interested in our business financing solutions. Would you like me to connect you with a specialist?`;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm sorry, I'm having trouble processing your request right now. Please try again or contact our support team directly.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    const userInput = inputValue;
    setInputValue('');

    // Check for matching Q&A
    const matchingQA = findMatchingQA(userInput);
    
    if (matchingQA) {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: matchingQA.answer,
        timestamp: new Date(),
        links: matchingQA.related_links
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 1000);
    } else {
      // Use AI or fallback response
      try {
        const aiResponse = await generateAIResponse(userInput, config?.ai_instructions || '');
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: aiResponse,
          timestamp: new Date()
        };
        
        setTimeout(() => {
          setMessages(prev => [...prev, botMessage]);
          setIsLoading(false);
        }, 1500);
      } catch (error) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: "I'm sorry, I'm having trouble right now. Please contact our support team for assistance.",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!config) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <div className={`fixed ${positionClasses[config.widget_position as keyof typeof positionClasses]} z-50`}>
      {/* Chat Bubble */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg animate-pulse"
          style={{ backgroundColor: config.primary_color }}
        >
          <MessageCircle size={24} className="text-white" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="w-80 h-96 shadow-xl animate-scale-in">
          <CardHeader 
            className="flex flex-row items-center justify-between p-4 text-white rounded-t-lg"
            style={{ backgroundColor: config.primary_color }}
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={config.support_person_avatar_url || ''} />
                <AvatarFallback className="bg-white text-slate-800">
                  {config.support_person_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">{config.support_person_name}</h3>
                <p className="text-xs opacity-90">Online now</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X size={16} />
            </Button>
          </CardHeader>

          <CardContent className="flex flex-col h-full p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start gap-3 max-w-[80%]">
                    {message.type === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Bot size={14} className="text-white" />
                      </div>
                    )}
                    
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm ${
                        message.type === 'user'
                          ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-md'
                          : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 border border-gray-200 rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      
                      {message.links && message.links.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.links.map((link, index) => (
                            <a
                              key={index}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                                message.type === 'user' 
                                  ? 'bg-white/20 text-white hover:bg-white/30' 
                                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              }`}
                            >
                              🔗 {link.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {message.type === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <User size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                      <Bot size={14} className="text-white" />
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  style={{ backgroundColor: config.primary_color }}
                >
                  <Send size={16} className="text-white" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}