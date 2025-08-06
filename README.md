# Chat Me - Empathic Companion Application

A comprehensive full-stack application for personal growth through Fitness, Nutrition, and Mental Strength. Users interact with Lumi, an empathic virtual companion, complete personalized quests, and track their progress.

## 🏗️ Architecture

This project follows a modern microservices architecture with clear separation of concerns:

```
.
├── frontend/          # React + TypeScript frontend
├── backend/           # FastAPI Python backend
├── shared/            # Shared types and utilities
├── docker-compose.yml # Development environment
└── .github/           # CI/CD workflows
```

## 🚀 Features

### Core Functionality
- **Empathic Companion**: Chat with Lumi for personalized support
- **Multi-Agent System**: Specialized AI agents for Fitness, Nutrition, and Mental Strength
- **Quest System**: Complete personal quests and explore templates
- **Progress Tracking**: Monitor growth with points, keys, and levels
- **Dual Themes**: Goldday (light) and Silvernight (dark) modes
- **Familiarization Process**: Personalized onboarding experience

### Technical Features
- **Real-time Chat**: WebSocket-based communication
- **Supabase Realtime**: Live message updates using Supabase's realtime subscriptions
- **Rate Limiting**: Intelligent request throttling
- **Authentication**: Secure JWT-based auth with Supabase
- **Data Labeling**: Integrated Label Studio for ML training
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG-compliant interface

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Supabase Realtime** for live chat updates
cp .env.example .env
# Edit .env with your actual Supabase credentials
- **Lucide React** for icons
- **Vitest** for testing

### Backend
- **FastAPI** with Python 3.11
- **Pydantic** for data validation
- **Supabase** for database and auth
- **BERT** for NLP processing
- **Label Studio** for data annotation
- **Pytest** for testing

### Infrastructure
- **Docker** for containerization
- **GitHub Actions** for CI/CD
- **Supabase** for database and real-time features

## 🏃‍♂️ Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chat-me
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment files
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   
   # Configure your environment variables
   # - Supabase credentials
   # - JWT secret key
   # - Label Studio API key
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development

#### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

#### Backend Development
```bash
cd backend
pip install -r requirements.txt
python main.py
```

## 📁 Project Structure

### Frontend (`/frontend`)
```
src/
├── components/        # Reusable UI components
├── pages/            # Page components
├── hooks/            # Custom React hooks
├── context/          # React contexts
├── services/         # API services
├── lib/              # Utility libraries
├── types/            # TypeScript types
└── test/             # Test utilities
```

### Backend (`/backend`)
```
app/
├── api/              # API endpoints
│   └── v1/
│       ├── endpoints/    # Route handlers
│       └── schemas/      # Pydantic models
├── core/             # Core configuration
├── services/         # Business logic
├── utils/            # Utility functions
└── models/           # ML models
```

### Shared (`/shared`)
```
├── constants/        # Shared constants
├── types/           # TypeScript type definitions
└── utils/           # Shared utility functions
```

## 🔧 Configuration

### Environment Variables

#### Frontend
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_FUNCTIONS_BASE_URL=https://your-project-id.supabase.co/functions/v1
VITE_API_BASE_URL=http://localhost:8000
```

#### Backend
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
SECRET_KEY=your_jwt_secret_key
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test
npm run test:ui  # Interactive test UI
```

### Backend Tests
```bash
cd backend
python -m pytest tests/
python -m pytest tests/ -v  # Verbose output
```

## 🚀 Deployment

### Production Build

#### Frontend
```bash
cd frontend
npm run build
```

#### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your actual Supabase service role key and other settings

### CI/CD Pipeline

The project includes GitHub Actions workflows for:
- **Continuous Integration**: Automated testing on pull requests
- **Continuous Deployment**: Automated deployment to production
- **Code Quality**: Linting and formatting checks

## 📊 Database Schema

### Core Tables
- `users` - User profiles and progress
- `chat_messages` - Chat history
- `agents` - AI agent configurations
- `labeling_tasks` - Data annotation tasks
- `labeling_submissions` - Annotation results

### Key Features
- **Row Level Security (RLS)** enabled on all tables
- **Real-time subscriptions** for chat messages
- **Automatic timestamps** for audit trails
- **JSON columns** for flexible data storage

## 🤖 AI Agents

The application features specialized AI agents:

1. **Main Agent (Lumi)** - General empathic companion
2. **Fitness Agent** - Energetic fitness coach
3. **Nutrition Agent** - Nurturing nutrition guide
4. **Mental Strength Agent** - Wise mental wellness mentor

Each agent has:
- Unique personality and response patterns
- Specialized knowledge base
- Context-aware conversations
- Emotion detection and response

## 🎨 Design System

### Themes
- **Goldday (Light)**: Warm, energetic daytime theme
- **Silvernight (Dark)**: Cool, calming nighttime theme
- **Auto Mode**: Automatic switching based on time of day

### Color Palette
- Primary: Amber/Gold tones
- Secondary: Blue/Indigo tones
- Accent: Emerald for success states
- Semantic: Red for errors, Yellow for warnings

## 🔒 Security

### Authentication
- JWT-based authentication via Supabase
- Secure token storage and refresh
- Role-based access control

### Data Protection
- Row Level Security (RLS) on all database tables
- Input validation and sanitization
- Rate limiting to prevent abuse
- CORS configuration for API security

## 📈 Performance

### Frontend Optimizations
- Code splitting with React.lazy
- Image optimization and lazy loading
- Bundle size optimization with Vite
- Caching strategies for API responses

### Backend Optimizations
- Database query optimization
- Connection pooling
- Response caching
- Async/await patterns for I/O operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure code passes linting and formatting checks

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the excellent backend-as-a-service platform
- **FastAPI** for the high-performance Python web framework
- **React** and **Vite** for the modern frontend development experience
- **Tailwind CSS** for the utility-first CSS framework
- **Label Studio** for the data annotation platform

## 📞 Support

For support, email support@chatme.app or join our Discord community.

---

**Built with ❤️ by the Chat Me Team**
