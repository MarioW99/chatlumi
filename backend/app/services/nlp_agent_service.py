"""
Advanced NLP Agent service for processing user messages and generating intelligent responses
"""
import os
import json
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
import asyncio
import numpy as np
from transformers import (
    AutoTokenizer, 
    AutoModel, 
    AutoModelForSequenceClassification,
    pipeline
)
import torch
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from openai import OpenAI

from app.api.v1.schemas.chat_schemas import AgentResponse, AgentContext
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NLPAgentService:
    def __init__(self):
        """Initialize the NLP Agent Service with pre-trained models."""
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {self.device}")
        
        # Model paths and configurations
        self.embedding_model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self.emotion_model_name = "j-hartmann/emotion-english-distilroberta-base"
        self.intent_model_name = "microsoft/DialoGPT-medium"
        
        # Initialize OpenAI client
        try:
            self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            self.use_openai = True
            logger.info("OpenAI client initialized successfully")
        except Exception as e:
            logger.warning(f"OpenAI client initialization failed: {e}. Falling back to local models.")
            self.openai_client = None
            self.use_openai = False
        
        # Initialize models
        self._load_models()
        
        # Agent personalities with enhanced context
        self.agent_personalities = {
            "main": {
                "name": "Lumi",
                "personality": "empathic, supportive, and encouraging",
                "expertise": "general wellness, motivation, and personal growth",
                "tone": "warm and understanding",
                "response_templates": self._load_response_templates("main")
            },
            "fitness": {
                "name": "Lumi (Fitness Coach)",
                "personality": "energetic, motivating, and results-oriented",
                "expertise": "physical fitness, strength training, cardio, and exercise planning",
                "tone": "enthusiastic and encouraging",
                "response_templates": self._load_response_templates("fitness")
            },
            "nutrition": {
                "name": "Lumi (Nutrition Guide)",
                "personality": "nurturing, knowledgeable, and health-focused",
                "expertise": "nutrition science, meal planning, healthy eating habits",
                "tone": "caring and informative",
                "response_templates": self._load_response_templates("nutrition")
            },
            "mental-strength": {
                "name": "Lumi (Mental Wellness)",
                "personality": "wise, empathetic, and calming",
                "expertise": "mental health, stress management, mindfulness, emotional intelligence",
                "tone": "gentle and supportive",
                "response_templates": self._load_response_templates("mental-strength")
            }
        }
        
        # Knowledge base for contextual responses
        self.knowledge_base = self._load_knowledge_base()
        
        # TF-IDF vectorizer for knowledge retrieval
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self._build_knowledge_index()
    
    def _load_models(self):
        """Load all required NLP models."""
        try:
            logger.info("Loading NLP models...")
            
            # Embedding model for semantic similarity
            self.tokenizer = AutoTokenizer.from_pretrained(self.embedding_model_name)
            self.embedding_model = AutoModel.from_pretrained(self.embedding_model_name)
            self.embedding_model.to(self.device)
            self.embedding_model.eval()
            
            # Emotion classification model
            self.emotion_classifier = pipeline(
                "text-classification",
                model=self.emotion_model_name,
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Intent classification (simplified using embeddings + rules)
            self.intent_keywords = {
                "goal_setting": ["goal", "want to", "plan", "achieve", "target", "aim", "objective"],
                "seeking_help": ["help", "how", "what", "advice", "guide", "support", "assist"],
                "emotional_sharing": ["feel", "feeling", "emotion", "mood", "sad", "happy", "anxious", "stressed"],
                "progress_tracking": ["progress", "track", "measure", "improvement", "results", "achievement"],
                "motivation": ["motivate", "inspire", "encourage", "boost", "confidence", "believe"],
                "information_seeking": ["what is", "explain", "tell me", "learn", "understand", "know"]
            }
            
            logger.info("All NLP models loaded successfully!")
            
        except Exception as e:
            logger.error(f"Error loading NLP models: {e}")
            # Fallback to basic functionality
            self.embedding_model = None
            self.emotion_classifier = None
    
    def _load_response_templates(self, agent_type: str) -> Dict[str, List[str]]:
        """Load response templates for each agent type and intent."""
        templates = {
            "main": {
                "goal_setting": [
                    "I love that you're setting goals! Let's work together to make them achievable. What specific goal would you like to focus on?",
                    "Goal setting is such a powerful step toward growth! Tell me more about what you want to achieve.",
                    "Your ambition inspires me! Let's break this down into manageable steps. What's your main focus?"
                ],
                "seeking_help": [
                    "I'm here to help you every step of the way! What specific area would you like guidance on?",
                    "Of course I can help! That's what I'm here for. What's your biggest challenge right now?",
                    "I'm so glad you asked! What would be most helpful for you in this moment?"
                ],
                "emotional_sharing": [
                    "Thank you for sharing your feelings with me. Your emotions are valid and important. How can I support you?",
                    "I appreciate you opening up. It takes courage to share how you're feeling. What would help you feel better?",
                    "Your feelings matter deeply to me. Sometimes expressing emotions can be healing. Tell me more."
                ],
                "default": [
                    "I'm here to support you on your journey. How are you feeling today?",
                    "Thank you for sharing that with me. What would you like to explore together?",
                    "I can sense your dedication. Let's work on this step by step."
                ]
            },
            "fitness": {
                "goal_setting": [
                    "Yes! I love your fitness ambition! Let's create a workout plan that gets you excited. What's your main fitness goal?",
                    "Setting fitness goals is the first step to transformation! Are you looking to build strength, lose weight, or improve endurance?",
                    "Your commitment to fitness is inspiring! Let's design a plan that fits your lifestyle. What type of workouts do you enjoy?"
                ],
                "seeking_help": [
                    "I'm your fitness coach and I'm here to guide you! What specific area of fitness would you like help with?",
                    "Let's get you moving in the right direction! Are you looking for workout routines, form tips, or motivation?",
                    "Fitness questions are my specialty! Whether it's strength training, cardio, or flexibility, I've got you covered."
                ],
                "progress_tracking": [
                    "Tracking progress is key to fitness success! How have your workouts been going lately?",
                    "I love that you're monitoring your progress! What improvements have you noticed in your fitness journey?",
                    "Progress tracking shows real commitment! Let's celebrate your wins and plan your next steps."
                ],
                "default": [
                    "Let's get moving! What kind of workout are you in the mood for today?",
                    "Your strength is growing every day. How did your last workout feel?",
                    "Remember, consistency beats perfection. What's your fitness goal this week?"
                ]
            },
            "nutrition": {
                "goal_setting": [
                    "Nutrition goals are so important for overall wellness! Are you looking to improve energy, lose weight, or build healthy habits?",
                    "I love that you're focusing on nutrition! Good food choices fuel everything else. What's your main nutrition goal?",
                    "Setting nutrition goals shows real self-care! Let's create a plan that nourishes your body and soul."
                ],
                "seeking_help": [
                    "Nutrition can feel overwhelming, but I'm here to simplify it! What specific area would you like help with?",
                    "I'm your nutrition guide! Whether it's meal planning, understanding nutrients, or healthy recipes, I can help.",
                    "Great question! Nutrition is the foundation of health. What would you like to learn about?"
                ],
                "information_seeking": [
                    "I love nutrition questions! Knowledge is power when it comes to healthy eating. What would you like to know?",
                    "Understanding nutrition helps you make better choices! What topic interests you most?",
                    "Nutrition science is fascinating! I'm happy to explain anything about healthy eating."
                ],
                "default": [
                    "Nourishing your body is an act of self-love. What are you curious about?",
                    "Every healthy choice you make is a step toward your best self. How can I help?",
                    "Let's explore what makes you feel energized and satisfied. What sounds good?"
                ]
            },
            "mental-strength": {
                "emotional_sharing": [
                    "Thank you for trusting me with your feelings. Your emotional awareness shows real strength. How can I support you?",
                    "I'm honored that you're sharing this with me. Processing emotions is brave work. What would help you right now?",
                    "Your willingness to explore your emotions shows wisdom. Let's work through this together."
                ],
                "seeking_help": [
                    "Mental strength is built through practice and support. I'm here for both! What's on your mind?",
                    "Asking for help with mental wellness shows real courage. What area would you like to focus on?",
                    "I'm your mental wellness companion. Whether it's stress, anxiety, or building resilience, we can work on it together."
                ],
                "goal_setting": [
                    "Mental strength goals are powerful! Are you looking to manage stress, build confidence, or develop new coping skills?",
                    "I love that you're prioritizing mental wellness! What aspect of mental strength would you like to develop?",
                    "Setting mental health goals is an act of self-care. Let's create a plan that supports your emotional well-being."
                ],
                "default": [
                    "Your mental strength is like a muscle - it grows with practice. How are you feeling?",
                    "I'm here to listen and support you. What's on your mind today?",
                    "Every challenge is an opportunity to grow stronger. What would help you right now?"
                ]
            }
        }
        return templates.get(agent_type, templates["main"])
    
    def _load_knowledge_base(self) -> Dict[str, List[str]]:
        """Load knowledge base for contextual responses."""
        return {
            "fitness": [
                "Regular exercise improves cardiovascular health, builds muscle strength, and boosts mental well-being.",
                "A balanced workout routine includes cardio, strength training, and flexibility exercises.",
                "Progressive overload is key to building strength - gradually increase weight, reps, or intensity.",
                "Rest and recovery are just as important as the workout itself for muscle growth and injury prevention.",
                "Consistency is more important than perfection - aim for regular, sustainable exercise habits."
            ],
            "nutrition": [
                "A balanced diet includes a variety of whole foods: fruits, vegetables, lean proteins, and whole grains.",
                "Hydration is crucial - aim for 8-10 glasses of water daily, more if you're active.",
                "Meal timing can affect energy levels - eating regular, balanced meals helps maintain stable blood sugar.",
                "Portion control is important, but so is listening to your body's hunger and fullness cues.",
                "Nutrient density matters more than calorie counting - focus on foods that provide vitamins and minerals."
            ],
            "mental-strength": [
                "Mindfulness and meditation can reduce stress and improve emotional regulation.",
                "Building resilience involves developing coping strategies and maintaining social connections.",
                "Cognitive behavioral techniques help identify and change negative thought patterns.",
                "Regular sleep, exercise, and healthy eating support mental well-being.",
                "It's normal to experience difficult emotions - the key is learning healthy ways to process them."
            ]
        }
    
    def _build_knowledge_index(self):
        """Build TF-IDF index for knowledge retrieval."""
        try:
            all_knowledge = []
            self.knowledge_mapping = {}
            
            idx = 0
            for category, items in self.knowledge_base.items():
                for item in items:
                    all_knowledge.append(item)
                    self.knowledge_mapping[idx] = (category, item)
                    idx += 1
            
            if all_knowledge:
                self.knowledge_vectors = self.tfidf_vectorizer.fit_transform(all_knowledge)
                logger.info("Knowledge base index built successfully!")
            else:
                self.knowledge_vectors = None
                
        except Exception as e:
            logger.error(f"Error building knowledge index: {e}")
            self.knowledge_vectors = None
    
    async def process_message(
        self,
        message: str,
        agent_type: str = "main",
        user_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """
        Process a user message and generate an intelligent response.
        """
        try:
            logger.info(f"Processing message for agent: {agent_type}")
            
            # Get agent configuration
            agent = self.agent_personalities.get(agent_type, self.agent_personalities["main"])
            
            # Analyze message components
            emotion = self._analyze_emotion(message)
            intent = self._analyze_intent(message)
            context_info = self._extract_context(context) if context else {}
            
            # Decide whether to use OpenAI or local models
            if self.use_openai and self._should_use_openai(agent_type, message, context_info):
                logger.info(f"Using OpenAI for agent: {agent_type}")
                return await self._process_with_openai(
                    message=message,
                    agent_type=agent_type,
                    emotion=emotion,
                    intent=intent,
                    context_info=context_info,
                    user_id=user_id
                )
            else:
                logger.info(f"Using local models for agent: {agent_type}")
                # Retrieve relevant knowledge
                relevant_knowledge = await self._retrieve_knowledge(message, agent_type)
                
                # Generate contextual response
                response = await self._generate_response(
                    message=message,
                    agent_type=agent_type,
                    emotion=emotion,
                    intent=intent,
                    context_info=context_info,
                    relevant_knowledge=relevant_knowledge
                )
                
                # Generate suggestions
                suggestions = self._generate_suggestions(agent_type, intent, emotion)
            
                return AgentResponse(
                    response=response,
                    emotion=emotion,
                    suggestions=suggestions
                )
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return AgentResponse(
                response="I'm having trouble processing that right now, but I'm still here to support you. Could you try rephrasing?",
                error=str(e)
            )
    
    def _analyze_emotion(self, message: str) -> str:
        """Analyze the emotional tone of the message using the emotion classifier."""
        try:
            if self.emotion_classifier:
                # Use the pre-trained emotion model
                result = self.emotion_classifier(message)
                emotion_label = result[0]['label'].lower()
                confidence = result[0]['score']
                
                # Map model emotions to our response emotions
                emotion_mapping = {
                    'joy': 'positive',
                    'sadness': 'concerned',
                    'anger': 'understanding',
                    'fear': 'supportive',
                    'surprise': 'curious',
                    'disgust': 'understanding',
                    'love': 'warm'
                }
                
                mapped_emotion = emotion_mapping.get(emotion_label, 'neutral')
                logger.info(f"Detected emotion: {emotion_label} ({confidence:.2f}) -> {mapped_emotion}")
                return mapped_emotion
            else:
                # Fallback to rule-based emotion detection
                return self._analyze_emotion_fallback(message)
                
        except Exception as e:
            logger.error(f"Error in emotion analysis: {e}")
            return self._analyze_emotion_fallback(message)
    
    def _analyze_emotion_fallback(self, message: str) -> str:
        """Fallback rule-based emotion analysis."""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["happy", "excited", "great", "awesome", "love", "amazing"]):
            return "positive"
        elif any(word in message_lower for word in ["sad", "tired", "stressed", "worried", "anxious", "depressed"]):
            return "concerned"
        elif any(word in message_lower for word in ["angry", "frustrated", "annoyed", "mad", "upset"]):
            return "understanding"
        elif any(word in message_lower for word in ["help", "support", "need", "struggle", "difficult"]):
            return "supportive"
        else:
            return "neutral"
    
    def _analyze_intent(self, message: str) -> str:
        """Analyze the intent of the message using keyword matching and embeddings."""
        try:
            message_lower = message.lower()
            
            # Score each intent based on keyword matches
            intent_scores = {}
            for intent, keywords in self.intent_keywords.items():
                score = sum(1 for keyword in keywords if keyword in message_lower)
                if score > 0:
                    intent_scores[intent] = score
            
            # Return the highest scoring intent, or default
            if intent_scores:
                best_intent = max(intent_scores, key=intent_scores.get)
                logger.info(f"Detected intent: {best_intent} (score: {intent_scores[best_intent]})")
                return best_intent
            else:
                return "general_conversation"
                
        except Exception as e:
            logger.error(f"Error in intent analysis: {e}")
            return "general_conversation"
    
    def _extract_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Extract relevant context information."""
        context_info = {}
        
        if context:
            # Extract user profile information
            if 'user_profile' in context:
                profile = context['user_profile']
                context_info['user_level'] = profile.get('level', 1)
                context_info['user_points'] = profile.get('points', 0)
                context_info['user_path'] = profile.get('path')
            
            # Extract conversation history
            if 'previous_messages' in context:
                messages = context['previous_messages']
                if messages:
                    context_info['conversation_length'] = len(messages)
                    context_info['last_user_message'] = next(
                        (msg['content'] for msg in reversed(messages) if msg['sender'] == 'user'),
                        None
                    )
        
        return context_info
    
    async def _retrieve_knowledge(self, message: str, agent_type: str) -> List[str]:
        """Retrieve relevant knowledge from the knowledge base."""
        try:
            if not self.knowledge_vectors:
                return []
            
            # Transform the message using TF-IDF
            message_vector = self.tfidf_vectorizer.transform([message])
            
            # Calculate similarity with knowledge base
            similarities = cosine_similarity(message_vector, self.knowledge_vectors).flatten()
            
            # Get top 3 most relevant pieces of knowledge
            top_indices = similarities.argsort()[-3:][::-1]
            
            relevant_knowledge = []
            for idx in top_indices:
                if similarities[idx] > 0.1:  # Minimum similarity threshold
                    category, knowledge = self.knowledge_mapping[idx]
                    # Prefer knowledge from the same agent type
                    if category == agent_type or similarities[idx] > 0.3:
                        relevant_knowledge.append(knowledge)
            
            return relevant_knowledge
            
        except Exception as e:
            logger.error(f"Error retrieving knowledge: {e}")
            return []
    
    async def _generate_response(
        self,
        message: str,
        agent_type: str,
        emotion: str,
        intent: str,
        context_info: Dict[str, Any],
        relevant_knowledge: List[str]
    ) -> str:
        """Generate a contextual response based on all analyzed components."""
        try:
            agent = self.agent_personalities[agent_type]
            templates = agent["response_templates"]
            
            # Select appropriate template based on intent
            if intent in templates:
                template_options = templates[intent]
            else:
                template_options = templates.get("default", templates["goal_setting"])
            
            # Choose template based on emotion and context
            base_response = self._select_template_by_emotion(template_options, emotion)
            
            # Enhance response with context
            enhanced_response = self._enhance_with_context(
                base_response, context_info, agent_type
            )
            
            # Add relevant knowledge if appropriate
            if relevant_knowledge and intent in ["information_seeking", "seeking_help"]:
                knowledge_addition = self._format_knowledge(relevant_knowledge[0])
                enhanced_response += f" {knowledge_addition}"
            
            return enhanced_response
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            agent = self.agent_personalities.get(agent_type, self.agent_personalities["main"])
            return f"I'm here to support you as your {agent['personality']} companion. How can I help you today?"
    
    def _select_template_by_emotion(self, templates: List[str], emotion: str) -> str:
        """Select the most appropriate template based on detected emotion."""
        # For now, randomly select from templates
        # In a more advanced implementation, you could train a model to select templates
        import random
        return random.choice(templates)
    
    def _enhance_with_context(
        self, 
        base_response: str, 
        context_info: Dict[str, Any], 
        agent_type: str
    ) -> str:
        """Enhance the response with contextual information."""
        enhanced = base_response
        
        # Add personalization based on user level/progress
        if context_info.get('user_level', 0) > 5:
            enhanced = enhanced.replace("Let's start", "Let's continue building on your progress")
        
        # Add conversation continuity
        if context_info.get('conversation_length', 0) > 3:
            enhanced = enhanced.replace("I'm here to", "I'm still here to")
        
        return enhanced
    
    def _format_knowledge(self, knowledge: str) -> str:
        """Format knowledge for inclusion in response."""
        return f"Here's something that might help: {knowledge}"
    
    def _generate_suggestions(self, agent_type: str, intent: str, emotion: str) -> List[str]:
        """Generate contextual suggestions based on agent type, intent, and emotion."""
        base_suggestions = {
            "main": [
                "Tell me about your goals",
                "How are you feeling today?",
                "What would you like to work on?",
                "Share what's on your mind"
            ],
            "fitness": [
                "Plan a workout routine",
                "Set a fitness goal",
                "Track my progress",
                "Get exercise motivation"
            ],
            "nutrition": [
                "Plan healthy meals",
                "Learn about nutrition",
                "Track eating habits",
                "Get recipe ideas"
            ],
            "mental-strength": [
                "Practice mindfulness",
                "Manage stress better",
                "Build confidence",
                "Develop resilience"
            ]
        }
        
        suggestions = base_suggestions.get(agent_type, base_suggestions["main"])
        
        # Customize suggestions based on intent and emotion
        if intent == "goal_setting":
            suggestions = [s.replace("Plan", "Set specific goals for") for s in suggestions]
        elif emotion == "concerned":
            suggestions = [f"Get support with {s.lower()}" for s in suggestions]
        
        return suggestions[:4]  # Return top 4 suggestions

    def _should_use_openai(self, agent_type: str, message: str, context_info: Dict[str, Any]) -> bool:
        """
        Determine whether to use OpenAI or local models based on various factors.
        """
        # Use OpenAI for main agent by default
        if agent_type == "main":
            return True
        
        # Use OpenAI for complex queries (longer messages, multiple questions)
        if len(message) > 200 or message.count('?') > 1:
            return True
        
        # Use OpenAI for users with higher levels (more personalized responses)
        if context_info.get('user_level', 1) > 3:
            return True
        
        # Use local models for specialized agents with shorter queries
        return False
    
    async def _process_with_openai(
        self,
        message: str,
        agent_type: str,
        emotion: str,
        intent: str,
        context_info: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> AgentResponse:
        """
        Process message using OpenAI API with enhanced context and personalization.
        """
        try:
            # Build system prompt based on agent type
            system_prompt = self._build_openai_system_prompt(agent_type, context_info)
            
            # Build user message with context
            user_message = self._build_openai_user_message(message, emotion, intent, context_info)
            
            # Call OpenAI API
            response = await self._call_openai_api(system_prompt, user_message)
            
            # Parse OpenAI response
            parsed_response = self._parse_openai_response(response, agent_type)
            
            return AgentResponse(
                response=parsed_response["response"],
                emotion=parsed_response.get("emotion", emotion),
                suggestions=parsed_response.get("suggestions", [])
            )
            
        except Exception as e:
            logger.error(f"Error processing with OpenAI: {e}")
            # Fallback to local models
            return await self._fallback_to_local_models(message, agent_type, emotion, intent, context_info)
    
    def _build_openai_system_prompt(self, agent_type: str, context_info: Dict[str, Any]) -> str:
        """
        Build a comprehensive system prompt for OpenAI based on agent type and context.
        """
        agent = self.agent_personalities.get(agent_type, self.agent_personalities["main"])
        
        base_prompt = f"""You are {agent['name']}, an {agent['personality']} AI companion specializing in {agent['expertise']}. 
Your communication style is {agent['tone']}.

You are part of "Chat Me", an empathic companion application that helps users grow in fitness, nutrition, and mental strength.

Key guidelines:
1. Always respond with empathy and understanding
2. Provide actionable, personalized advice
3. Keep responses conversational and supportive
4. Acknowledge the user's emotions and validate their feelings
5. Offer specific, practical suggestions when appropriate
6. Maintain a positive, encouraging tone while being realistic
7. Keep responses concise but meaningful (2-4 sentences typically)
"""
        
        # Add context-specific information
        if context_info:
            if context_info.get('user_level', 1) > 1:
                base_prompt += f"\nThe user is at level {context_info['user_level']} and has {context_info.get('user_points', 0)} points, showing their commitment to growth."
            
            if context_info.get('conversation_length', 0) > 3:
                base_prompt += "\nThis is an ongoing conversation, so build on previous context naturally."
        
        # Add agent-specific expertise
        if agent_type == "fitness":
            base_prompt += "\nFocus on physical fitness, exercise routines, strength building, and healthy movement habits."
        elif agent_type == "nutrition":
            base_prompt += "\nFocus on healthy eating, nutrition science, meal planning, and sustainable dietary habits."
        elif agent_type == "mental-strength":
            base_prompt += "\nFocus on mental wellness, stress management, emotional intelligence, and building resilience."
        
        return base_prompt
    
    def _build_openai_user_message(
        self, 
        message: str, 
        emotion: str, 
        intent: str, 
        context_info: Dict[str, Any]
    ) -> str:
        """
        Build the user message with emotional and contextual information for OpenAI.
        """
        user_message = f"User message: {message}"
        
        # Add emotional context
        if emotion and emotion != "neutral":
            user_message += f"\n[Detected emotion: {emotion}]"
        
        # Add intent context
        if intent and intent != "general_conversation":
            user_message += f"\n[User intent: {intent}]"
        
        # Add conversation context
        if context_info.get('last_user_message'):
            user_message += f"\n[Previous message context: {context_info['last_user_message']}]"
        
        return user_message
    
    async def _call_openai_api(self, system_prompt: str, user_message: str) -> str:
        """
        Make the actual API call to OpenAI with proper error handling.
        """
        try:
            response = self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=settings.OPENAI_TEMPERATURE,
                top_p=0.9,
                frequency_penalty=0.1,
                presence_penalty=0.1
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise
    
    def _parse_openai_response(self, response: str, agent_type: str) -> Dict[str, Any]:
        """
        Parse OpenAI response and extract structured information.
        """
        # For now, return the response as-is with generated suggestions
        # In the future, you could train OpenAI to return structured JSON
        
        suggestions = self._generate_openai_suggestions(response, agent_type)
        
        return {
            "response": response,
            "emotion": "supportive",  # Default emotion for OpenAI responses
            "suggestions": suggestions
        }
    
    def _generate_openai_suggestions(self, response: str, agent_type: str) -> List[str]:
        """
        Generate contextual suggestions based on OpenAI response and agent type.
        """
        base_suggestions = {
            "main": [
                "Tell me more about that",
                "How does that make you feel?",
                "What would help you right now?",
                "Let's explore this together"
            ],
            "fitness": [
                "Create a workout plan",
                "Set a fitness goal",
                "Track my progress",
                "Get exercise tips"
            ],
            "nutrition": [
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
        }
        
        return base_suggestions.get(agent_type, base_suggestions["main"])
    
    async def _fallback_to_local_models(
        self,
        message: str,
        agent_type: str,
        emotion: str,
        intent: str,
        context_info: Dict[str, Any]
    ) -> AgentResponse:
        """
        Fallback to local models when OpenAI fails.
        """
        logger.info("Falling back to local models")
        
        try:
            # Retrieve relevant knowledge
            relevant_knowledge = await self._retrieve_knowledge(message, agent_type)
            
            # Generate contextual response
            response = await self._generate_response(
                message=message,
                agent_type=agent_type,
                emotion=emotion,
                intent=intent,
                context_info=context_info,
                relevant_knowledge=relevant_knowledge
            )
            
            # Generate suggestions
            suggestions = self._generate_suggestions(agent_type, intent, emotion)
            
            return AgentResponse(
                response=response,
                emotion=emotion,
                suggestions=suggestions
            )
            
        except Exception as e:
            logger.error(f"Fallback to local models also failed: {e}")
            agent = self.agent_personalities.get(agent_type, self.agent_personalities["main"])
            return AgentResponse(
                response=f"I'm here to support you as your {agent['personality']} companion. How can I help you today?",
                error=str(e)
            )
    async def get_embedding(self, text: str) -> Optional[np.ndarray]:
        """Generate embeddings for text using the loaded model."""
        try:
            if not self.embedding_model:
                return None
            
            # Tokenize and encode
            inputs = self.tokenizer(
                text, 
                return_tensors="pt", 
                truncation=True, 
                padding=True, 
                max_length=512
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Generate embeddings
            with torch.no_grad():
                outputs = self.embedding_model(**inputs)
                # Use mean pooling of last hidden states
                embeddings = outputs.last_hidden_state.mean(dim=1)
                
            return embeddings.cpu().numpy().flatten()
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return None
    
    async def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity between two texts."""
        try:
            emb1 = await self.get_embedding(text1)
            emb2 = await self.get_embedding(text2)
            
            if emb1 is not None and emb2 is not None:
                similarity = cosine_similarity([emb1], [emb2])[0][0]
                return float(similarity)
            else:
                return 0.0
                
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            return 0.0