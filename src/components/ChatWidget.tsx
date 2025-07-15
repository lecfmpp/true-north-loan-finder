import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ChatContactForm } from '@/components/ChatContactForm';

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
  const [showContactForm, setShowContactForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Configuration for auto-reset (5 minutes of inactivity)
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

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

  const resetConversation = () => {
    if (config) {
      setMessages([{
        id: '1',
        type: 'bot',
        content: `Hi! I'm ${config.support_person_name}. How can I help you today?`,
        timestamp: new Date()
      }]);
      setInputValue('');
      setIsLoading(false);
      console.log('Conversation reset due to inactivity');
    }
  };

  const resetInactivityTimer = () => {
    // Clear existing timeout
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    
    // Set new timeout only if chat is open and has more than just welcome message
    if (isOpen && messages.length > 1) {
      inactivityTimeoutRef.current = setTimeout(() => {
        resetConversation();
      }, INACTIVITY_TIMEOUT);
    }
  };

  // Reset timer when messages change (new activity)
  useEffect(() => {
    resetInactivityTimer();
    
    // Cleanup timeout on unmount
    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [messages, isOpen]);

  // Clear timer when chat is closed
  useEffect(() => {
    if (!isOpen && inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  }, [isOpen]);

  const findMatchingQA = (userInput: string): ChatQA | null => {
    const input = userInput.toLowerCase();
    return qaList.find(qa => 
      qa.question.toLowerCase().includes(input) || 
      input.includes(qa.question.toLowerCase())
    ) || null;
  };

  const generateAIResponse = async (userInput: string, context: string) => {
    try {
      console.log('Calling AI chat function with:', userInput);
      
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: {
          message: userInput,
          chatHistory: messages.slice(-5), // Send last 5 messages for context
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('AI response:', data);
      return {
        text: data.response || "I'm sorry, I'm having trouble processing your request right now. Please contact our support team for assistance.",
        links: data.links || []
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      return {
        text: "I'm sorry, I'm having trouble right now. Please contact our support team for assistance.",
        links: [{ title: "Contact Us", url: "/contact" }]
      };
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
      // Use AI response
      try {
        const aiResponse = await generateAIResponse(userInput, config?.ai_instructions || '');
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: aiResponse.text,
          timestamp: new Date(),
          links: aiResponse.links
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
        <div 
          onClick={() => setIsOpen(true)}
          className="bg-green-600 hover:bg-green-700 rounded-2xl shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 flex items-center gap-3 p-3 max-w-xs"
        >
          <Avatar className="w-12 h-12 flex-shrink-0">
            <AvatarImage src={config.support_person_avatar_url || ''} />
            <AvatarFallback className="bg-white text-green-600 font-semibold">
              {config.support_person_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="text-white">
            <p className="text-sm font-medium">I can help you here</p>
            <p className="text-xs opacity-90">{config.support_person_name}</p>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="w-80 h-[500px] shadow-xl animate-scale-in flex flex-col">
          <CardHeader 
            className="flex flex-row items-center justify-between p-4 text-white rounded-t-lg flex-shrink-0"
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

          <CardContent className="flex flex-col flex-1 p-0 min-h-0">
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

            {/* Contact Form or Input */}
            {showContactForm ? (
              <div className="p-4 border-t">
                <ChatContactForm
                  onSubmit={() => {
                    setShowContactForm(false);
                    // Add success message to chat
                    const successMessage: Message = {
                      id: (Date.now() + 1).toString(),
                      type: 'bot',
                      content: "Thank you for your contact information! Our team will reach out to you within 24 hours to discuss your financing needs.",
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, successMessage]);
                  }}
                  onCancel={() => setShowContactForm(false)}
                />
              </div>
            ) : (
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
                <div className="mt-2">
                  <Button
                    onClick={() => setShowContactForm(true)}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    Request Personal Contact
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}