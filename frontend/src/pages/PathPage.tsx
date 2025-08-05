import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, Dumbbell, Apple, Brain, Heart, Zap, Target, TrendingUp } from 'lucide-react';
import { AgentService, AgentType } from '../services/agentService';
import { useAuth } from '../hooks/useAuth';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import { RealtimeMessage } from '../services/realtimeService';

// Path data with detailed information
const pathMaps = [
  {
    id: 'fitness',
    title: 'Fitness & Körperkraft',
    subtitle: 'Build Physical Strength',
    description: 'Transform your body through structured workouts, strength training, and endurance building. Develop discipline and physical resilience.',
    icon: Dumbbell,
    color: 'bg-red-400',
    lightColor: 'bg-red-50',
    darkColor: 'bg-red-900/30',
    borderColor: 'border-red-300',
    darkBorderColor: 'dark:border-red-600',
    textColor: 'text-red-600',
    darkTextColor: 'dark:text-red-400',
    features: ['Strength Training', 'Cardio Workouts', 'Flexibility', 'Endurance Building'],
    lumiPersonality: 'energetic and motivating',
    welcomeMessage: "Welcome to your Fitness journey! I'm here to help you build incredible physical strength and endurance. Whether you're just starting or looking to push your limits, we'll create a path that challenges and transforms you. What's your current fitness level, and what would you like to achieve?"
  },
  {
    id: 'nutrition',
    title: 'Nutrition & Wellness',
    subtitle: 'Nourish Your Body',
    description: 'Master the art of nutrition with balanced eating, mindful consumption, and sustainable healthy habits that fuel your body and mind.',
    icon: Apple,
    color: 'bg-green-400',
    lightColor: 'bg-green-50',
    darkColor: 'bg-green-900/30',
    borderColor: 'border-green-300',
    darkBorderColor: 'dark:border-green-600',
    textColor: 'text-green-600',
    darkTextColor: 'dark:text-green-400',
    features: ['Meal Planning', 'Mindful Eating', 'Nutritional Balance', 'Healthy Habits'],
    lumiPersonality: 'nurturing and knowledgeable',
    welcomeMessage: "Welcome to your Nutrition journey! I'm excited to help you discover the power of nourishing your body with intention and wisdom. Food is medicine, energy, and joy all in one. Let's explore what healthy eating means for your unique lifestyle and goals. What's your relationship with food like right now?"
  },
  {
    id: 'mental-strength',
    title: 'Mental Strength & Resilience',
    subtitle: 'Strengthen Your Mind',
    description: 'Develop mental fortitude through mindfulness, stress management, emotional intelligence, and cognitive resilience practices.',
    icon: Brain,
    color: 'bg-purple-400',
    lightColor: 'bg-purple-50',
    darkColor: 'bg-purple-900/30',
    borderColor: 'border-purple-300',
    darkBorderColor: 'dark:border-purple-600',
    textColor: 'text-purple-600',
    darkTextColor: 'dark:text-purple-400',
    features: ['Mindfulness', 'Stress Management', 'Emotional Intelligence', 'Cognitive Training'],
    lumiPersonality: 'wise and empathetic',
    welcomeMessage: "Welcome to your Mental Strength journey! This is where we build the most important muscle of all - your mind. Together, we'll develop resilience, clarity, and emotional wisdom that will serve you in every area of life. Mental strength isn't about being tough; it's about being flexible, aware, and grounded. What mental challenges are you facing right now?"
  }
];

const PathPage = () => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{
    id: number;
    sender: 'user' | 'lumi';
    content: string;
    timestamp: Date;
    emotion?: string;
  }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  const currentPath = pathMaps.find(path => path.id === selectedPath);

  // Set up realtime chat subscription for the selected path
  useRealtimeChat({
    path: selectedPath || 'main',
    onMessage: (realtimeMessage: RealtimeMessage) => {
      console.log('📨 Received realtime message on path page:', realtimeMessage);
      
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
      console.error('❌ Realtime error on path page:', error);
    },
    enabled: !!user && !!selectedPath // Only enable when user is authenticated and path is selected
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedPath && currentPath) {
      // Initialize chat with welcome message when path is selected
      setMessages([{
        id: 1,
        sender: 'lumi',
        content: currentPath.welcomeMessage,
        timestamp: new Date(),
        emotion: 'welcoming'
      }]);
    }
  }, [selectedPath, currentPath]);

  const getAgentType = (pathId: string): AgentType => {
    const agentMap: Record<string, AgentType> = {
      'fitness': 'fitness',
      'nutrition': 'nutrition',
      'mental-strength': 'mental-strength'
    };
    return agentMap[pathId] || 'main';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping || isWaitingForResponse || !selectedPath) return;

    setInputMessage('');
    setIsTyping(true);
    setIsWaitingForResponse(true);

    try {
      const agentType = getAgentType(selectedPath);
      
      // Send message through AgentService
      // The message will be saved to database and appear via realtime subscription
      await AgentService.sendMessage(
        inputMessage,
        agentType,
        {
          userId: user?.id,
          path: selectedPath,
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
        content: "I'm having trouble connecting right now, but I'm still here to support your journey. Please try again in a moment.",
        timestamp: new Date(),
        emotion: 'apologetic'
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      setIsWaitingForResponse(false);
    } finally {
      setIsTyping(false);
    }
  };

  const handleBackToOverview = () => {
    setSelectedPath(null);
    setMessages([]);
    setInputMessage('');
    setIsTyping(false);
  };

  const getQuickReplies = (pathId: string) => {
    const quickReplies = {
      fitness: [
        "I want to build strength",
        "Help me with cardio",
        "I'm new to fitness",
        "I need motivation",
        "Create a workout plan",
        "I want to be consistent"
      ],
      nutrition: [
        "Help me eat healthier",
        "I want to meal prep",
        "Teach me about nutrition",
        "I struggle with cravings",
        "Plan balanced meals",
        "I want more energy"
      ],
      'mental-strength': [
        "I need stress relief",
        "Help with anxiety",
        "Build confidence",
        "Improve focus",
        "Develop resilience",
        "Practice mindfulness"
      ]
    };
    return quickReplies[pathId as keyof typeof quickReplies] || [];
  };

  const handleQuickReply = (reply: string) => {
    setInputMessage(reply);
    inputRef.current?.focus();
  };

  if (selectedPath && currentPath) {
    // Full-Screen Chat Interface for Selected Path
    return (
      <div className="fixed top-16 left-0 right-0 bottom-0 bg-[#fef7e0] dark:bg-indigo-900 flex flex-col">
        {/* Chat Header - Fixed */}
        <div className={`${currentPath.color} text-white relative overflow-hidden flex-shrink-0`}>
          <div className="relative flex items-center justify-between p-4 md:p-6">
            <button
              onClick={handleBackToOverview}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-lg md:text-xl">Lumi</h3>
                <p className="text-white/80 text-xs md:text-sm flex items-center justify-center space-x-2">
                  <currentPath.icon className="w-3 h-3 md:w-4 md:h-4" />
                  <span>{currentPath.title} Guide</span>
                </p>
              </div>
            </div>
            
            <div className="w-9"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Chat Messages - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 md:px-6 py-3 md:py-4 rounded-2xl relative ${
                  message.sender === 'user'
                    ? `${currentPath.color} text-white shadow-lg`
                    : 'bg-white dark:bg-indigo-700 text-amber-900 dark:text-indigo-100 shadow-xl border border-amber-200/50 dark:border-indigo-600'
                }`}
              >
                {message.sender === 'lumi' && (
                  <div className="flex items-center space-x-2 mb-3">
                    <div className={`w-4 h-4 md:w-5 md:h-5 ${currentPath.color} rounded-full flex items-center justify-center`}>
                      <Sparkles className="w-2 h-2 md:w-3 md:h-3 text-white" />
                    </div>
                    <span className={`text-xs font-semibold ${currentPath.textColor}`}>Lumi</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{message.content}</p>
                <div className="text-xs opacity-70 mt-3 text-right">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                
                {message.sender === 'lumi' && (
                  <div className={`absolute -left-1 top-4 w-2 h-2 ${currentPath.color} rounded-full animate-pulse`}></div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-indigo-700 px-4 md:px-6 py-3 md:py-4 rounded-2xl shadow-xl border border-amber-200/50 dark:border-indigo-600">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 md:w-5 md:h-5 ${currentPath.color} rounded-full flex items-center justify-center`}>
                    <Sparkles className="w-2 h-2 md:w-3 md:h-3 text-white" />
                  </div>
                  <span className={`text-xs font-semibold ${currentPath.textColor}`}>Lumi is thinking</span>
                  <div className="flex space-x-1">
                    <div className={`w-2 h-2 ${currentPath.color} rounded-full animate-bounce`}></div>
                    <div className={`w-2 h-2 ${currentPath.color} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                    <div className={`w-2 h-2 ${currentPath.color} rounded-full animate-bounce`} style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies - Fixed */}
        <div className="flex-shrink-0 px-4 md:px-6 py-3 border-t border-amber-200/50 dark:border-indigo-600 bg-white/50 dark:bg-indigo-800/50 backdrop-blur-sm">
          <div className="flex flex-wrap gap-2">
            {getQuickReplies(selectedPath).map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply)}
                disabled={isTyping}
                className="text-xs px-3 py-2 bg-white/80 dark:bg-indigo-700 text-amber-700 dark:text-indigo-200 rounded-full hover:bg-white dark:hover:bg-indigo-600 transition-colors border border-amber-200/50 dark:border-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input - Fixed */}
        <form onSubmit={handleSendMessage} className="flex-shrink-0 p-4 md:p-6 border-t border-amber-200/50 dark:border-indigo-600 bg-white/50 dark:bg-indigo-800/50 backdrop-blur-sm">
          <div className="flex space-x-3 md:space-x-4">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Share your ${currentPath.title.toLowerCase()} thoughts...`}
              disabled={isTyping || isWaitingForResponse}
              className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-white dark:bg-indigo-700 border border-amber-200/50 dark:border-indigo-600 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-900 dark:text-indigo-100 placeholder-amber-600/70 dark:placeholder-indigo-300 shadow-lg text-sm md:text-base disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping || isWaitingForResponse}
              className={`px-4 md:px-6 py-3 md:py-4 ${currentPath.color} text-white rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-lg`}
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Path Selection Overview
  return (
    <div className="min-h-screen pt-8 pb-12 px-4 sm:px-6 lg:px-8 bg-[#fef7e0] dark:bg-indigo-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-amber-800 dark:text-indigo-100 mb-4">
            Choose Your Growth Path
          </h1>
          <p className="text-xl text-amber-700 dark:text-indigo-200 max-w-3xl mx-auto">
            Select a path that resonates with your current journey. Each path offers personalized guidance from Lumi, 
            tailored to help you grow in that specific area of your life.
          </p>
        </div>

        {/* Path Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {pathMaps.map((path) => (
            <div
              key={path.id}
              onClick={() => setSelectedPath(path.id)}
              className={`group cursor-pointer bg-white/80 dark:bg-indigo-800 rounded-2xl p-8 shadow-lg border ${path.borderColor} ${path.darkBorderColor} hover:shadow-2xl transition-all duration-300 hover:scale-105`}
            >
              <div className="text-center">
                {/* Icon */}
                <div className={`w-20 h-20 ${path.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  <path.icon className="w-10 h-10 text-white" />
                </div>

                {/* Title */}
                <h3 className="font-bold text-2xl text-amber-900 dark:text-indigo-100 mb-2">
                  {path.title}
                </h3>
                <p className={`font-medium ${path.textColor} ${path.darkTextColor} mb-4`}>
                  {path.subtitle}
                </p>

                {/* Description */}
                <p className="text-amber-700 dark:text-indigo-200 mb-6 leading-relaxed">
                  {path.description}
                </p>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {path.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-center space-x-2">
                      <div className={`w-2 h-2 ${path.color} rounded-full`}></div>
                      <span className="text-sm text-amber-600 dark:text-indigo-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className={`${path.lightColor} ${path.darkColor} rounded-xl p-4 border ${path.borderColor} ${path.darkBorderColor}`}>
                  <p className="text-sm text-amber-700 dark:text-indigo-200 mb-2">
                    Chat with Lumi as your <span className="font-medium">{path.lumiPersonality}</span> guide
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-amber-600 dark:text-indigo-300 font-medium">
                    <span>Start Journey</span>
                    <Target className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Info */}
        <div className="text-center">
          <div className="bg-white/80 dark:bg-indigo-800 rounded-2xl p-8 shadow-lg border border-amber-200/50 dark:border-indigo-600 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Sparkles className="w-8 h-8 text-amber-400" />
              <h3 className="text-2xl font-bold text-amber-900 dark:text-indigo-100">Meet Lumi</h3>
            </div>
            <p className="text-amber-700 dark:text-indigo-200 text-lg leading-relaxed mb-6">
              Lumi adapts to each path, becoming the perfect companion for your journey. Whether you need an energetic fitness coach, 
              a nurturing nutrition guide, or a wise mental strength mentor, Lumi is here to support your growth with empathy and expertise.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Heart className="w-6 h-6 text-red-400" />
                <span className="text-amber-800 dark:text-indigo-200">Empathic Support</span>
              </div>
              <div className="flex items-center space-x-3">
                <Zap className="w-6 h-6 text-yellow-400" />
                <span className="text-amber-800 dark:text-indigo-200">Personalized Guidance</span>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <span className="text-amber-800 dark:text-indigo-200">Growth Focused</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathPage;