import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Heart, Zap, MessageCircle } from 'lucide-react';
import { AgentService } from '../services/agentService';
import { useAuth } from '../hooks/useAuth';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import { RealtimeMessage } from '../services/realtimeService';

const initialMessages = [
  {
    id: 1,
    sender: 'lumi',
    content: "Hello! I'm Lumi, your empathic companion. I'm here to support you on your journey of growth in fitness, nutrition, and mental strength. How are you feeling today?",
    timestamp: new Date(Date.now() - 5000),
    emotion: 'welcoming'
  }
];

const LandingPage = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  // Set up realtime chat subscription
  useRealtimeChat({
    path: 'main-chat',
    onMessage: (realtimeMessage: RealtimeMessage) => {
      console.log('📨 Received realtime message on landing page:', realtimeMessage);
      
      // Convert realtime message to our message format
      const newMessage = {
        id: realtimeMessage.id,
        sender: realtimeMessage.sender,
        content: realtimeMessage.content,
        timestamp: new Date(realtimeMessage.timestamp),
        emotion: realtimeMessage.emotion
      };

      // Add message to state if it's not already there
      setMessages(prev => {
        const messageExists = prev.some(msg => msg.id === newMessage.id);
        if (!messageExists) {
          return [...prev, newMessage];
        }
        return prev;
      });

      // Stop typing indicator when Lumi responds
      if (realtimeMessage.sender === 'lumi') {
        setIsTyping(false);
        setIsWaitingForResponse(false);
      }
    },
    onError: (error) => {
      console.error('❌ Realtime error on landing page:', error);
    },
    enabled: !!user // Only enable when user is authenticated
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping || isWaitingForResponse) return;

    setInputMessage('');
    setIsTyping(true);
    setIsWaitingForResponse(true);

    try {
      // Send message through AgentService
      // The message will be saved to database and appear via realtime subscription
      await AgentService.sendMessage(
        inputMessage,
        'main',
        {
          userId: user?.id,
          path: 'main-chat', 
          includeContext: true
        }
      );
      
      // Messages will be added via realtime subscription
      // No need to manually add them to state here
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add fallback error message directly (not saved to DB)
      const fallbackMessage = {
        id: Date.now(), // Use timestamp as temporary ID
        sender: 'lumi' as const,
        content: "I'm having trouble connecting right now, but I'm still here with you. Please try again in a moment.", 
        timestamp: new Date(),
        emotion: 'apologetic'
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      setIsWaitingForResponse(false);
    } finally {
      setIsTyping(false);
    }
  };

  const quickReplies = [
    "I'm feeling motivated today!",
    "I need some encouragement",
    "Help me set a goal",
    "I want to start my fitness journey",
    "I'm struggling with consistency",
    "Tell me about nutrition"
  ];

  const handleQuickReply = (reply: string) => {
    setInputMessage(reply);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-[#fef7e0] dark:bg-indigo-900 pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 left-10 w-4 h-4 bg-white/20 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-48 right-20 w-3 h-3 bg-white/15 rounded-full animate-pulse opacity-40" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-20 w-2 h-2 bg-white/25 rounded-full animate-pulse opacity-50" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-72 left-1/3 w-5 h-5 bg-white/10 rounded-full animate-pulse opacity-30" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-60 right-1/3 w-3 h-3 bg-white/20 rounded-full animate-pulse opacity-40" style={{ animationDelay: '4s' }}></div>
        
        {/* Larger orbs */}
        <div className="absolute top-40 right-32 w-8 h-8 bg-white/8 rounded-full animate-pulse opacity-20" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-32 left-32 w-6 h-6 bg-white/12 rounded-full animate-pulse opacity-25" style={{ animationDelay: '2.5s' }}></div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="w-full" style={{ maxWidth: 'calc(1024px + 40px)' }}>
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-amber-400 dark:bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full border-3 border-white animate-pulse shadow-lg"></div>
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-amber-800 dark:text-indigo-100">
                  Meet Lumi
                </h1>
                <p className="text-xl text-amber-600 dark:text-indigo-300 font-medium">
                  Your Empathic Companion
                </p>
              </div>
            </div>
            <p className="text-lg text-amber-700 dark:text-indigo-200 max-w-2xl mx-auto leading-relaxed">
              Start your conversation with Lumi, your AI companion designed to support your growth in fitness, nutrition, and mental strength.
            </p>
          </div>

          {/* Chat Window */}
          <div className="relative">
            {/* Glass morphism background with border */}
            <div className="absolute inset-0 bg-white/10 dark:bg-indigo-900/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-indigo-700/30 shadow-2xl"></div>
            
            {/* Chat Container */}
            <div className="relative bg-gradient-to-br from-white/5 to-white/10 dark:from-indigo-800/5 dark:to-indigo-900/10 backdrop-blur-sm rounded-3xl border border-white/30 dark:border-indigo-600/30 overflow-hidden">
              
              {/* Chat Header */}
              <div className="bg-amber-400/90 dark:bg-indigo-600/90 backdrop-blur-sm text-white p-6 border-b border-white/20 dark:border-indigo-500/30">
                <div className="flex items-center justify-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-xl">Lumi</h3>
                    <div className="text-white/80 text-sm flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span>Always here for you</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-white/5 dark:to-indigo-900/5">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-sm px-6 py-4 rounded-2xl relative ${
                        message.sender === 'user'
                          ? 'bg-amber-400/90 dark:bg-indigo-600/90 text-white shadow-lg backdrop-blur-sm'
                          : 'bg-white/80 dark:bg-indigo-700/80 text-amber-900 dark:text-indigo-100 shadow-xl border border-white/50 dark:border-indigo-600/50 backdrop-blur-sm'
                      }`}
                    >
                      {message.sender === 'lumi' && (
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Lumi</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <div className="text-xs opacity-70 mt-3 text-right">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      
                      {message.sender === 'lumi' && (
                        <div className="absolute -left-1 top-4 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/80 dark:bg-indigo-700/80 px-6 py-4 rounded-2xl shadow-xl border border-white/50 dark:border-indigo-600/50 backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Lumi is thinking</span>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              <div className="px-6 py-4 border-t border-white/20 dark:border-indigo-600/30 bg-white/5 dark:bg-indigo-800/10 backdrop-blur-sm">
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickReply(reply)}
                      disabled={isTyping}
                      className="text-xs px-4 py-2 bg-white/60 dark:bg-indigo-700/60 text-amber-700 dark:text-indigo-200 rounded-full hover:bg-white/80 dark:hover:bg-indigo-600/80 transition-all border border-white/40 dark:border-indigo-600/40 backdrop-blur-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-6 border-t border-white/20 dark:border-indigo-600/30 bg-white/5 dark:bg-indigo-800/10 backdrop-blur-sm">
                <div className="flex space-x-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Share what's on your mind..."
                    disabled={isTyping || isWaitingForResponse}
                    className="flex-1 px-6 py-4 bg-white/70 dark:bg-indigo-700/70 border border-white/40 dark:border-indigo-600/40 rounded-2xl focus:ring-2 focus:ring-amber-400 dark:focus:ring-indigo-400 focus:border-transparent text-amber-900 dark:text-indigo-100 placeholder-amber-600/70 dark:placeholder-indigo-300/70 shadow-lg backdrop-blur-sm text-base disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isTyping || isWaitingForResponse}
                    className="px-6 py-4 bg-amber-400/90 dark:bg-indigo-600/90 text-white rounded-2xl hover:bg-amber-500/90 dark:hover:bg-indigo-500/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-lg backdrop-blur-sm"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Bottom Features */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-6 bg-white/10 dark:bg-indigo-900/20 backdrop-blur-xl rounded-2xl px-8 py-4 border border-white/20 dark:border-indigo-700/30 shadow-lg">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-400" />
                <span className="text-amber-800 dark:text-indigo-200 font-medium">Empathic</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-amber-800 dark:text-indigo-200 font-medium">Personalized</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                <span className="text-amber-800 dark:text-indigo-200 font-medium">Always Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;