import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Heart, Target, Brain } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface FamiliarizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onFamiliarizationComplete: () => void;
}

interface FamiliarizationStep {
  lumiQuestion: string;
  aiCategory: string;
  icon: React.ComponentType<any>;
  color: string;
  placeholder: string;
}

const FamiliarizationModal: React.FC<FamiliarizationModalProps> = ({
  isOpen,
  onClose,
  userId,
  onFamiliarizationComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [lumiResponse, setLumiResponse] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Define familiarization steps with enhanced UX
  const familiarizationSteps: FamiliarizationStep[] = [
    {
      lumiQuestion: "Hello! I'm Lumi, your empathic companion on this journey of growth. I'm so excited to meet you! To help me understand you better, could you tell me what brings you here today? What are your main goals or challenges related to fitness, nutrition, or mental strength?",
      aiCategory: 'goals_challenges',
      icon: Target,
      color: 'bg-blue-400',
      placeholder: 'Share what brought you here and your main goals...'
    },
    {
      lumiQuestion: "Thank you for sharing that with me! I can sense your motivation, and that's wonderful. Now, on a scale of 1 to 10, how motivated are you feeling right now to work on these areas? And what do you think might be your biggest obstacle or challenge along the way?",
      aiCategory: 'motivation_obstacles',
      icon: Heart,
      color: 'bg-red-400',
      placeholder: 'Tell me about your motivation level and any challenges...'
    },
    {
      lumiQuestion: "I really appreciate your honesty and openness! Finally, I'd love to know what kind of support or guidance you're hoping to receive from me on your journey. How can I best help you succeed and feel supported along the way?",
      aiCategory: 'support_expectations',
      icon: Brain,
      color: 'bg-purple-400',
      placeholder: 'Describe the kind of support you need from me...'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [lumiResponse, userAnswers]);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setCurrentStep(0);
      setUserAnswers([]);
      setInputMessage('');
      setLumiResponse(familiarizationSteps[0].lumiQuestion);
      setIsTyping(false);
      setIsProcessing(false);
      
      // Focus input after a short delay
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  }, [isOpen]);

  const processUserData = async (answers: string[]) => {
    try {
      // This would typically call a Supabase Edge Function to process the answers with AI
      // For now, we'll create a simple categorization based on keywords
      
      const allAnswersText = answers.join(' ').toLowerCase();
      
      // Simple keyword-based categorization
      let primaryPath = 'general';
      let motivationLevel = 5;
      let mainChallenges: string[] = [];
      let supportNeeds: string[] = [];
      
      // Determine primary path based on keywords
      if (allAnswersText.includes('fitness') || allAnswersText.includes('workout') || allAnswersText.includes('exercise') || allAnswersText.includes('strength')) {
        primaryPath = 'fitness';
      } else if (allAnswersText.includes('nutrition') || allAnswersText.includes('diet') || allAnswersText.includes('eating') || allAnswersText.includes('food')) {
        primaryPath = 'nutrition';
      } else if (allAnswersText.includes('mental') || allAnswersText.includes('stress') || allAnswersText.includes('anxiety') || allAnswersText.includes('mindfulness')) {
        primaryPath = 'mental-strength';
      }
      
      // Extract motivation level from second answer
      const motivationMatch = answers[1]?.match(/(\d+)/);
      if (motivationMatch) {
        motivationLevel = Math.min(10, Math.max(1, parseInt(motivationMatch[1])));
      }
      
      // Identify challenges
      if (allAnswersText.includes('time') || allAnswersText.includes('busy')) {
        mainChallenges.push('time_management');
      }
      if (allAnswersText.includes('motivation') || allAnswersText.includes('consistent')) {
        mainChallenges.push('consistency');
      }
      if (allAnswersText.includes('knowledge') || allAnswersText.includes('know') || allAnswersText.includes('learn')) {
        mainChallenges.push('knowledge_gap');
      }
      
      // Identify support needs
      if (allAnswersText.includes('encourage') || allAnswersText.includes('support') || allAnswersText.includes('motivat')) {
        supportNeeds.push('encouragement');
      }
      if (allAnswersText.includes('plan') || allAnswersText.includes('structure') || allAnswersText.includes('guide')) {
        supportNeeds.push('structured_guidance');
      }
      if (allAnswersText.includes('track') || allAnswersText.includes('progress') || allAnswersText.includes('monitor')) {
        supportNeeds.push('progress_tracking');
      }
      
      // Update user profile in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          familiarization_completed: true,
          primary_path: primaryPath,
          motivation_level: motivationLevel,
          main_challenges: mainChallenges,
          support_needs: supportNeeds,
          familiarization_answers: answers,
          familiarization_completed_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }

      return {
        primaryPath,
        motivationLevel,
        mainChallenges,
        supportNeeds
      };
    } catch (error) {
      console.error('Error processing user data:', error);
      throw error;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping || isProcessing) return;

    const currentQuestion = familiarizationSteps[currentStep];
    const newUserAnswers = [...userAnswers, inputMessage];
    setUserAnswers(newUserAnswers);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Simulate Lumi thinking time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      if (currentStep < familiarizationSteps.length - 1) {
        // Move to next question
        setCurrentStep(prev => prev + 1);
        setLumiResponse(familiarizationSteps[currentStep + 1].lumiQuestion);
      } else {
        // Last question answered, process data and finalize
        setIsProcessing(true);
        setLumiResponse("Thank you so much for sharing all of that with me! I'm processing everything you've told me to create the most personalized experience for you. This will just take a moment...");
        
        try {
          const processedData = await processUserData(newUserAnswers);
          
          // Final personalized message based on processed data
          let finalMessage = "Perfect! I now have a wonderful understanding of who you are and what you're looking for. ";
          
          if (processedData.primaryPath === 'fitness') {
            finalMessage += "I can see that fitness and physical strength are important to you. ";
          } else if (processedData.primaryPath === 'nutrition') {
            finalMessage += "I can see that nutrition and wellness are your focus areas. ";
          } else if (processedData.primaryPath === 'mental-strength') {
            finalMessage += "I can see that mental strength and resilience are your priorities. ";
          }
          
          finalMessage += `With your motivation level and the goals you've shared, I'm excited to be your companion on this journey. Let's begin creating positive change together! 🌟`;
          
          setLumiResponse(finalMessage);
          
          // Complete familiarization after showing final message
          setTimeout(() => {
            onFamiliarizationComplete();
            onClose();
          }, 3000);
          
        } catch (error) {
          setLumiResponse("I encountered a small issue while processing your information, but don't worry! I'll still be here to support you every step of the way. Let's begin your journey!");
          setTimeout(() => {
            onFamiliarizationComplete();
            onClose();
          }, 2000);
        } finally {
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.error('Error during familiarization:', error);
      setLumiResponse("I'm sorry, I encountered an issue. Please try again, and I'll do my best to help you!");
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  const currentQuestion = familiarizationSteps[currentStep];
  const progress = ((currentStep + 1) / familiarizationSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-indigo-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with Progress */}
        <div className="relative bg-gradient-to-r from-amber-400 to-amber-500 dark:from-indigo-600 dark:to-indigo-700 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Getting to Know You</h2>
                <p className="text-white/80 text-sm">Step {currentStep + 1} of {familiarizationSteps.length}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-amber-50/50 to-white dark:from-indigo-900/20 dark:to-indigo-800">
          {/* Current Question */}
          <div className="flex justify-start">
            <div className="bg-white dark:bg-indigo-700 text-amber-900 dark:text-indigo-100 shadow-xl border border-amber-200/50 dark:border-indigo-600 rounded-2xl px-6 py-4 relative max-w-md">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-6 h-6 ${currentQuestion.color} rounded-full flex items-center justify-center`}>
                  <currentQuestion.icon className="w-4 h-4 text-white" />
                </div>
                <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Lumi</span>
              </div>
              <p className="text-sm leading-relaxed">{lumiResponse}</p>
              <div className="absolute -left-2 top-6 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Previous Q&A pairs */}
          {userAnswers.map((answer, index) => {
            const NextIconComponent = familiarizationSteps[index + 1]?.icon;
            return (
              <div key={index} className="space-y-4">
                {/* User's answer */}
                <div className="flex justify-end">
                  <div className="bg-amber-400 dark:bg-indigo-600 text-white shadow-lg rounded-2xl px-6 py-4 relative max-w-md">
                    <p className="text-sm leading-relaxed">{answer}</p>
                  </div>
                </div>
                
                {/* Lumi's follow-up (if not the current step) */}
                {index < currentStep && index < familiarizationSteps.length - 1 && NextIconComponent && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-indigo-700 text-amber-900 dark:text-indigo-100 shadow-xl border border-amber-200/50 dark:border-indigo-600 rounded-2xl px-6 py-4 relative max-w-md">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-6 h-6 ${familiarizationSteps[index + 1].color} rounded-full flex items-center justify-center`}>
                          <NextIconComponent className="w-4 h-4 text-white" />
                        </div>
                        <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Lumi</span>
                      </div>
                      <p className="text-sm leading-relaxed">{familiarizationSteps[index + 1].lumiQuestion}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-indigo-700 px-6 py-4 rounded-2xl shadow-xl border border-amber-200/50 dark:border-indigo-600">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {isProcessing ? 'Lumi is creating your profile...' : 'Lumi is thinking...'}
                  </span>
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

        {/* Input Area */}
        {!isProcessing && (
          <form onSubmit={handleSendMessage} className="p-6 border-t border-amber-200/50 dark:border-indigo-600 bg-white/50 dark:bg-indigo-800/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex space-x-4">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={currentQuestion.placeholder}
                disabled={isTyping}
                className="flex-1 px-6 py-4 bg-white dark:bg-indigo-700 border border-amber-200/50 dark:border-indigo-600 rounded-2xl focus:ring-2 focus:ring-amber-400 dark:focus:ring-indigo-400 focus:border-transparent text-amber-900 dark:text-indigo-100 placeholder-amber-600/70 dark:placeholder-indigo-300 shadow-lg text-base disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="px-6 py-4 bg-amber-400 dark:bg-indigo-600 text-white rounded-2xl hover:bg-amber-500 dark:hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FamiliarizationModal;