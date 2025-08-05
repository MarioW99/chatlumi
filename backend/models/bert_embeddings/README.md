# NLP Models Directory

This directory contains the NLP models and configurations used for the Chat Me empathic companion system.

## Models Used

### 1. Sentence Embeddings
- **Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Purpose**: Generate semantic embeddings for user messages and knowledge base
- **Use Cases**:
  - Semantic similarity matching
  - Knowledge retrieval
  - Context understanding
  - Message clustering

### 2. Emotion Classification
- **Model**: `j-hartmann/emotion-english-distilroberta-base`
- **Purpose**: Detect emotional states in user messages
- **Emotions Detected**: joy, sadness, anger, fear, surprise, disgust, love
- **Use Cases**:
  - Empathic response generation
  - Emotional state tracking
  - Personalized support

### 3. Intent Classification
- **Method**: Hybrid approach using keyword matching + embeddings
- **Intents Supported**:
  - goal_setting
  - seeking_help
  - emotional_sharing
  - progress_tracking
  - motivation
  - information_seeking

## Model Loading

Models are automatically downloaded from Hugging Face Hub on first use. The service will:

1. Check for GPU availability and use it if present
2. Load models with appropriate device placement
3. Cache models locally for faster subsequent loads
4. Fallback to CPU if GPU is not available

## Performance Considerations

- **GPU Recommended**: For better performance, especially with larger models
- **Memory Usage**: Models require ~500MB-1GB RAM depending on configuration
- **First Load**: Initial model download may take 2-5 minutes
- **Inference Speed**: ~50-200ms per message depending on hardware

## Configuration

Environment variables for model configuration:

```env
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMOTION_MODEL=j-hartmann/emotion-english-distilroberta-base
USE_GPU=true
KNOWLEDGE_SIMILARITY_THRESHOLD=0.1
```

## Knowledge Base

The service includes a built-in knowledge base for:
- Fitness and exercise guidance
- Nutrition and wellness information
- Mental health and mindfulness practices

Knowledge retrieval uses TF-IDF vectorization with cosine similarity for relevant information extraction.

## Agent Personalities

Each agent type has specialized:
- Response templates
- Personality traits
- Expertise areas
- Tone and communication style

This enables contextually appropriate responses based on the user's chosen path (fitness, nutrition, mental strength).