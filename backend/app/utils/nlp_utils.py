"""
NLP utility functions for text processing and analysis
"""
import re
import string
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

def preprocess_text(text: str) -> str:
    """
    Preprocess text for NLP analysis.
    
    Args:
        text: Raw input text
        
    Returns:
        Cleaned and preprocessed text
    """
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Remove URLs
    text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
    
    # Remove email addresses
    text = re.sub(r'\S+@\S+', '', text)
    
    # Remove excessive punctuation (keep some for context)
    text = re.sub(r'[!]{2,}', '!', text)
    text = re.sub(r'[?]{2,}', '?', text)
    text = re.sub(r'[.]{3,}', '...', text)
    
    return text

def extract_keywords(text: str, min_length: int = 3) -> List[str]:
    """
    Extract meaningful keywords from text.
    
    Args:
        text: Input text
        min_length: Minimum keyword length
        
    Returns:
        List of extracted keywords
    """
    if not text:
        return []
    
    # Preprocess text
    text = preprocess_text(text)
    
    # Remove punctuation and split into words
    translator = str.maketrans('', '', string.punctuation)
    words = text.translate(translator).split()
    
    # Filter words by length and remove common stop words
    stop_words = {
        'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
        'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
        'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
        'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its',
        'our', 'their'
    }
    
    keywords = [
        word for word in words 
        if len(word) >= min_length and word not in stop_words
    ]
    
    # Remove duplicates while preserving order
    seen = set()
    unique_keywords = []
    for keyword in keywords:
        if keyword not in seen:
            seen.add(keyword)
            unique_keywords.append(keyword)
    
    return unique_keywords

def calculate_text_similarity_simple(text1: str, text2: str) -> float:
    """
    Calculate simple text similarity using Jaccard similarity.
    
    Args:
        text1: First text
        text2: Second text
        
    Returns:
        Similarity score between 0 and 1
    """
    if not text1 or not text2:
        return 0.0
    
    # Extract keywords from both texts
    keywords1 = set(extract_keywords(text1))
    keywords2 = set(extract_keywords(text2))
    
    if not keywords1 and not keywords2:
        return 1.0 if text1.strip() == text2.strip() else 0.0
    
    if not keywords1 or not keywords2:
        return 0.0
    
    # Calculate Jaccard similarity
    intersection = keywords1.intersection(keywords2)
    union = keywords1.union(keywords2)
    
    return len(intersection) / len(union) if union else 0.0

def detect_question_type(text: str) -> str:
    """
    Detect the type of question being asked.
    
    Args:
        text: Input text
        
    Returns:
        Question type ('what', 'how', 'why', 'when', 'where', 'who', 'yes_no', 'other')
    """
    text_lower = text.lower().strip()
    
    # Check for question words at the beginning
    if text_lower.startswith(('what', 'what\'s', 'whats')):
        return 'what'
    elif text_lower.startswith(('how', 'how\'s', 'hows')):
        return 'how'
    elif text_lower.startswith(('why', 'why\'s', 'whys')):
        return 'why'
    elif text_lower.startswith(('when', 'when\'s', 'whens')):
        return 'when'
    elif text_lower.startswith(('where', 'where\'s', 'wheres')):
        return 'where'
    elif text_lower.startswith(('who', 'who\'s', 'whos')):
        return 'who'
    elif text_lower.startswith(('is', 'are', 'do', 'does', 'did', 'can', 'could', 'would', 'should', 'will')):
        return 'yes_no'
    elif '?' in text:
        return 'other'
    else:
        return 'statement'

def extract_entities(text: str) -> Dict[str, List[str]]:
    """
    Extract simple entities from text using pattern matching.
    
    Args:
        text: Input text
        
    Returns:
        Dictionary of entity types and their values
    """
    entities = {
        'numbers': [],
        'times': [],
        'dates': [],
        'emotions': [],
        'activities': []
    }
    
    # Extract numbers
    numbers = re.findall(r'\b\d+(?:\.\d+)?\b', text)
    entities['numbers'] = numbers
    
    # Extract time expressions
    time_patterns = [
        r'\b\d{1,2}:\d{2}(?:\s*(?:am|pm))?\b',
        r'\b(?:morning|afternoon|evening|night)\b',
        r'\b(?:today|tomorrow|yesterday)\b'
    ]
    for pattern in time_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        entities['times'].extend(matches)
    
    # Extract emotion words
    emotion_words = [
        'happy', 'sad', 'angry', 'excited', 'nervous', 'anxious', 'stressed',
        'calm', 'peaceful', 'frustrated', 'motivated', 'tired', 'energetic',
        'confident', 'worried', 'proud', 'disappointed', 'grateful'
    ]
    text_lower = text.lower()
    for emotion in emotion_words:
        if emotion in text_lower:
            entities['emotions'].append(emotion)
    
    # Extract activity words
    activity_words = [
        'workout', 'exercise', 'run', 'walk', 'swim', 'bike', 'yoga', 'meditate',
        'eat', 'cook', 'sleep', 'work', 'study', 'read', 'write', 'dance'
    ]
    for activity in activity_words:
        if activity in text_lower:
            entities['activities'].append(activity)
    
    # Remove duplicates
    for key in entities:
        entities[key] = list(set(entities[key]))
    
    return entities

def format_response_with_context(
    base_response: str, 
    user_name: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None
) -> str:
    """
    Format a response with contextual information.
    
    Args:
        base_response: Base response text
        user_name: User's name for personalization
        context: Additional context information
        
    Returns:
        Formatted response with context
    """
    response = base_response
    
    # Add user name if available
    if user_name:
        response = response.replace("you", f"you, {user_name}")
    
    # Add context-specific modifications
    if context:
        user_level = context.get('user_level', 1)
        if user_level > 5:
            response = response.replace("Let's start", "Let's continue")
            response = response.replace("begin", "keep going")
        
        # Add encouragement based on progress
        if context.get('user_points', 0) > 100:
            response += " You're making great progress!"
    
    return response

def validate_message_content(message: str) -> Dict[str, Any]:
    """
    Validate and analyze message content for safety and appropriateness.
    
    Args:
        message: User message to validate
        
    Returns:
        Validation result with flags and suggestions
    """
    result = {
        'is_valid': True,
        'flags': [],
        'suggestions': [],
        'cleaned_message': message
    }
    
    if not message or not message.strip():
        result['is_valid'] = False
        result['flags'].append('empty_message')
        return result
    
    # Check message length
    if len(message) > 2000:
        result['flags'].append('too_long')
        result['suggestions'].append('Please keep your message under 2000 characters.')
    
    # Check for excessive repetition
    words = message.lower().split()
    if len(words) > 10:
        word_counts = {}
        for word in words:
            word_counts[word] = word_counts.get(word, 0) + 1
        
        max_count = max(word_counts.values())
        if max_count > len(words) * 0.3:  # More than 30% repetition
            result['flags'].append('excessive_repetition')
    
    # Check for inappropriate content (basic)
    inappropriate_patterns = [
        r'\b(?:spam|test)\b' * 5,  # Repeated spam/test
        r'[A-Z]{10,}',  # Excessive caps
    ]
    
    for pattern in inappropriate_patterns:
        if re.search(pattern, message, re.IGNORECASE):
            result['flags'].append('potentially_inappropriate')
            break
    
    # Clean the message
    result['cleaned_message'] = preprocess_text(message)
    
    return result