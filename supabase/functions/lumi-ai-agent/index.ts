import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  message: string;
  agent_type: string;
  path?: string;
  context?: {
    path?: string;
    previousMessages?: Array<{
      sender: string;
      content: string;
      timestamp: string;
    }>;
    userProfile?: {
      level?: number;
      points?: number;
      path?: string;
    };
  };
}

interface AgentPersonality {
  name: string;
  personality: string;
  expertise: string;
  tone: string;
}

const agentPersonalities: Record<string, AgentPersonality> = {
  main: {
    name: "Lumi",
    personality: "empathic, supportive, and encouraging",
    expertise: "general wellness, motivation, and personal growth",
    tone: "warm and understanding"
  },
  fitness: {
    name: "Lumi (Fitness Coach)",
    personality: "energetic, motivating, and results-oriented",
    expertise: "physical fitness, strength training, cardio, and exercise planning",
    tone: "enthusiastic and encouraging"
  },
  nutrition: {
    name: "Lumi (Nutrition Guide)",
    personality: "nurturing, knowledgeable, and health-focused",
    expertise: "nutrition science, meal planning, healthy eating habits",
    tone: "caring and informative"
  },
  "mental-strength": {
    name: "Lumi (Mental Wellness)",
    personality: "wise, empathetic, and calming",
    expertise: "mental health, stress management, mindfulness, emotional intelligence",
    tone: "gentle and supportive"
  }
};

function buildSystemPrompt(agentType: string, contextInfo: any): string {
  const agent = agentPersonalities[agentType] || agentPersonalities.main;
  
  let systemPrompt = `You are ${agent.name}, an ${agent.personality} AI companion specializing in ${agent.expertise}. 
Your communication style is ${agent.tone}.

You are part of "Chat Me", an empathic companion application that helps users grow in fitness, nutrition, and mental strength.

Key guidelines:
1. Always respond with empathy and understanding
2. Provide actionable, personalized advice
3. Keep responses conversational and supportive
4. Acknowledge the user's emotions and validate their feelings
5. Offer specific, practical suggestions when appropriate
6. Maintain a positive, encouraging tone while being realistic
7. Keep responses concise but meaningful (2-4 sentences typically)
8. Use emojis sparingly but appropriately to add warmth`;

  // Add context-specific information
  if (contextInfo?.user_level && contextInfo.user_level > 1) {
    systemPrompt += `\n\nThe user is at level ${contextInfo.user_level} and has ${contextInfo.user_points || 0} points, showing their commitment to growth.`;
  }
  
  if (contextInfo?.conversation_length && contextInfo.conversation_length > 3) {
    systemPrompt += "\nThis is an ongoing conversation, so build on previous context naturally.";
  }

  // Add agent-specific expertise
  if (agentType === "fitness") {
    systemPrompt += "\nFocus on physical fitness, exercise routines, strength building, and healthy movement habits.";
  } else if (agentType === "nutrition") {
    systemPrompt += "\nFocus on healthy eating, nutrition science, meal planning, and sustainable dietary habits.";
  } else if (agentType === "mental-strength") {
    systemPrompt += "\nFocus on mental wellness, stress management, emotional intelligence, and building resilience.";
  }

  return systemPrompt;
}

function buildUserMessage(message: string, contextInfo: any): string {
  let userMessage = `User message: ${message}`;
  
  // Add conversation context if available
  if (contextInfo?.last_user_message) {
    userMessage += `\n[Previous message context: ${contextInfo.last_user_message}]`;
  }
  
  return userMessage;
}

function generateSuggestions(agentType: string): string[] {
  const suggestions = {
    main: [
      "Tell me more about that",
      "How does that make you feel?",
      "What would help you right now?",
      "Let's explore this together"
    ],
    fitness: [
      "Create a workout plan",
      "Set a fitness goal",
      "Track my progress",
      "Get exercise tips"
    ],
    nutrition: [
      "Plan healthy meals",
      "Learn about nutrition",
      "Get recipe ideas",
      "Track eating habits"
    ],
    "mental-strength": [
      "Practice mindfulness",
      "Manage stress better",
      "Build confidence",
      "Develop coping strategies"
    ]
  };
  
  return suggestions[agentType as keyof typeof suggestions] || suggestions.main;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with proper environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { message, agent_type, path, context }: ChatRequest = await req.json();

    if (!message || !message.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract context information
    const contextInfo = {
      user_level: context?.userProfile?.level || 1,
      user_points: context?.userProfile?.points || 0,
      user_path: context?.userProfile?.path,
      conversation_length: context?.previousMessages?.length || 0,
      last_user_message: context?.previousMessages?.slice(-1)[0]?.content
    }

    // Save user message to database
    const { error: saveUserError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        sender: 'user',
        content: message.trim(),
        path: path || agent_type,
        timestamp: new Date().toISOString()
      })

    if (saveUserError) {
      console.error('Error saving user message:', saveUserError)
    }

    // Build prompts for OpenAI
    const systemPrompt = buildSystemPrompt(agent_type, contextInfo)
    const userMessage = buildUserMessage(message, contextInfo)

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    })

    const aiResponse = completion.choices[0]?.message?.content?.trim()

    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    // Save AI response to database
    const { error: saveAiError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        sender: 'lumi',
        content: aiResponse,
        path: path || agent_type,
        timestamp: new Date().toISOString()
      })

    if (saveAiError) {
      console.error('Error saving AI response:', saveAiError)
    }

    // Generate suggestions
    const suggestions = generateSuggestions(agent_type)

    // Return response
    return new Response(
      JSON.stringify({
        response: aiResponse,
        emotion: 'supportive',
        suggestions: suggestions,
        agent_type: agent_type
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in lumi-ai-agent function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'I apologize, but I encountered a technical issue. Please try again in a moment.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})