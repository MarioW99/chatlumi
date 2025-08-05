"""
Tests for NLP Agent Service
"""
import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock

from app.services.nlp_agent_service import NLPAgentService
from app.api.v1.schemas.chat_schemas import AgentResponse

class TestNLPAgentService:
    
    @pytest.fixture
    def nlp_service(self):
        """Create NLP service instance for testing."""
        with patch('app.services.nlp_agent_service.AutoTokenizer'), \
             patch('app.services.nlp_agent_service.AutoModel'), \
             patch('app.services.nlp_agent_service.pipeline'):
            service = NLPAgentService()
            return service
    
    @pytest.mark.asyncio
    async def test_process_message_basic(self, nlp_service):
        """Test basic message processing."""
        message = "I want to start working out"
        
        response = await nlp_service.process_message(
            message=message,
            agent_type="fitness"
        )
        
        assert isinstance(response, AgentResponse)
        assert response.response is not None
        assert len(response.response) > 0
        assert response.emotion is not None
        assert isinstance(response.suggestions, list)
    
    @pytest.mark.asyncio
    async def test_emotion_analysis_fallback(self, nlp_service):
        """Test emotion analysis fallback method."""
        # Test positive emotion
        emotion = nlp_service._analyze_emotion_fallback("I'm so happy and excited!")
        assert emotion == "positive"
        
        # Test concerned emotion
        emotion = nlp_service._analyze_emotion_fallback("I'm feeling sad and stressed")
        assert emotion == "concerned"
        
        # Test supportive emotion
        emotion = nlp_service._analyze_emotion_fallback("I need help with this")
        assert emotion == "supportive"
        
        # Test neutral emotion
        emotion = nlp_service._analyze_emotion_fallback("What is the weather like?")
        assert emotion == "neutral"
    
    @pytest.mark.asyncio
    async def test_intent_analysis(self, nlp_service):
        """Test intent analysis."""
        # Test goal setting intent
        intent = await nlp_service._analyze_intent("I want to achieve my fitness goals")
        assert intent == "goal_setting"
        
        # Test seeking help intent
        intent = await nlp_service._analyze_intent("Can you help me with nutrition advice?")
        assert intent == "seeking_help"
        
        # Test emotional sharing intent
        intent = await nlp_service._analyze_intent("I'm feeling really anxious today")
        assert intent == "emotional_sharing"
        
        # Test general conversation
        intent = await nlp_service._analyze_intent("Hello there")
        assert intent == "general_conversation"
    
    def test_extract_context(self, nlp_service):
        """Test context extraction."""
        context = {
            'user_profile': {
                'level': 5,
                'points': 150,
                'path': 'fitness'
            },
            'previous_messages': [
                {'sender': 'user', 'content': 'Hello'},
                {'sender': 'lumi', 'content': 'Hi there!'},
                {'sender': 'user', 'content': 'How are you?'}
            ]
        }
        
        context_info = nlp_service._extract_context(context)
        
        assert context_info['user_level'] == 5
        assert context_info['user_points'] == 150
        assert context_info['user_path'] == 'fitness'
        assert context_info['conversation_length'] == 3
        assert context_info['last_user_message'] == 'How are you?'
    
    def test_generate_suggestions(self, nlp_service):
        """Test suggestion generation."""
        # Test fitness agent suggestions
        suggestions = nlp_service._generate_suggestions("fitness", "goal_setting", "positive")
        assert isinstance(suggestions, list)
        assert len(suggestions) <= 4
        assert all(isinstance(s, str) for s in suggestions)
        
        # Test nutrition agent suggestions
        suggestions = nlp_service._generate_suggestions("nutrition", "seeking_help", "neutral")
        assert isinstance(suggestions, list)
        assert len(suggestions) <= 4
    
    @pytest.mark.asyncio
    async def test_knowledge_retrieval(self, nlp_service):
        """Test knowledge retrieval functionality."""
        # Mock the knowledge vectors
        nlp_service.knowledge_vectors = Mock()
        nlp_service.tfidf_vectorizer = Mock()
        nlp_service.tfidf_vectorizer.transform.return_value = [[0.1, 0.2, 0.3]]
        
        with patch('app.services.nlp_agent_service.cosine_similarity') as mock_similarity:
            mock_similarity.return_value = [[0.8, 0.3, 0.1]]
            nlp_service.knowledge_mapping = {
                0: ('fitness', 'Regular exercise improves health'),
                1: ('nutrition', 'Balanced diet is important'),
                2: ('mental-strength', 'Mindfulness reduces stress')
            }
            
            knowledge = await nlp_service._retrieve_knowledge("exercise benefits", "fitness")
            
            assert isinstance(knowledge, list)
    
    @pytest.mark.asyncio
    async def test_error_handling(self, nlp_service):
        """Test error handling in message processing."""
        # Test with None message
        response = await nlp_service.process_message(
            message=None,
            agent_type="main"
        )
        
        assert isinstance(response, AgentResponse)
        assert response.error is not None or response.response is not None
    
    def test_agent_personalities(self, nlp_service):
        """Test agent personality configurations."""
        # Test that all agent types have proper configurations
        for agent_type in ["main", "fitness", "nutrition", "mental-strength"]:
            assert agent_type in nlp_service.agent_personalities
            
            agent = nlp_service.agent_personalities[agent_type]
            assert 'name' in agent
            assert 'personality' in agent
            assert 'expertise' in agent
            assert 'tone' in agent
            assert 'response_templates' in agent
            
            # Test that response templates have required intents
            templates = agent['response_templates']
            assert isinstance(templates, dict)
            assert 'default' in templates or 'goal_setting' in templates
    
    @pytest.mark.asyncio
    async def test_different_agent_types(self, nlp_service):
        """Test processing with different agent types."""
        message = "I need motivation to exercise"
        
        for agent_type in ["main", "fitness", "nutrition", "mental-strength"]:
            response = await nlp_service.process_message(
                message=message,
                agent_type=agent_type
            )
            
            assert isinstance(response, AgentResponse)
            assert response.response is not None
            assert len(response.response) > 0
    
    def test_template_selection(self, nlp_service):
        """Test template selection by emotion."""
        templates = [
            "How can I help you today?",
            "I'm here to support you!",
            "Let's work on this together."
        ]
        
        # Test that a template is selected
        selected = nlp_service._select_template_by_emotion(templates, "positive")
        assert selected in templates
        
        selected = nlp_service._select_template_by_emotion(templates, "concerned")
        assert selected in templates
    
    def test_context_enhancement(self, nlp_service):
        """Test response enhancement with context."""
        base_response = "Let's start working on your goals"
        context_info = {'user_level': 8, 'conversation_length': 5}
        
        enhanced = nlp_service._enhance_with_context(
            base_response, context_info, "fitness"
        )
        
        assert isinstance(enhanced, str)
        assert len(enhanced) >= len(base_response)
    
    @pytest.mark.asyncio
    async def test_embedding_generation(self, nlp_service):
        """Test embedding generation (if model is available)."""
        # Mock the embedding model
        nlp_service.embedding_model = Mock()
        nlp_service.tokenizer = Mock()
        nlp_service.device = 'cpu'
        
        # Mock tokenizer output
        mock_inputs = {
            'input_ids': Mock(),
            'attention_mask': Mock()
        }
        nlp_service.tokenizer.return_value = mock_inputs
        
        # Mock model output
        mock_output = Mock()
        mock_output.last_hidden_state = Mock()
        mock_output.last_hidden_state.mean.return_value.cpu.return_value.numpy.return_value.flatten.return_value = [0.1, 0.2, 0.3]
        nlp_service.embedding_model.return_value = mock_output
        
        with patch('torch.no_grad'):
            embedding = await nlp_service.get_embedding("test message")
            
            if embedding is not None:
                assert isinstance(embedding, (list, tuple)) or hasattr(embedding, '__iter__')

if __name__ == "__main__":
    pytest.main([__file__])