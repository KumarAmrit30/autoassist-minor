# AutoAssist - AI-Powered Car Recommendation Platform

This is a [Next.js](https://nextjs.org) project with integrated RAG (Retrieval-Augmented Generation) for intelligent car recommendations.

## 🌟 Features

- **AI-Powered Search**: Semantic search using RAG system with LangChain and Qdrant
- **Dual Search Modes**: Choose between intelligent AI search or traditional filtering
- **Beautiful UI**: Modern, responsive design with smooth animations
- **Smart Recommendations**: Context-aware car suggestions with explanations
- **Real-time Results**: Fast, accurate recommendations powered by vector search

## 🚀 Quick Start

### Standard Setup (Frontend Only)

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Full Setup (Frontend + RAG Backend)

**5-Minute Quick Start**: See [QUICKSTART_RAG.md](./QUICKSTART_RAG.md)

**Step-by-step**:

1. **Start Qdrant** (Terminal 1):
   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```

2. **Start RAG Backend** (Terminal 2):
   ```bash
   npm run rag:start
   ```

3. **Start Next.js** (Terminal 3):
   ```bash
   npm run dev
   ```

4. **Visit** http://localhost:3000 and try the AI Search!

## 📚 Documentation

- **[QUICKSTART_RAG.md](./QUICKSTART_RAG.md)** - Get the RAG system running in 5 minutes
- **[RAG_INTEGRATION.md](./RAG_INTEGRATION.md)** - Complete integration guide
- **[RAG_SUMMARY.md](./RAG_SUMMARY.md)** - Architecture and features overview
- **[TEST_RAG.md](./TEST_RAG.md)** - Comprehensive testing guide

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons

### AI/RAG System
- **FastAPI** - Python backend
- **LangChain** - RAG framework
- **Qdrant** - Vector database
- **Ollama/Llama** - LLM
- **SentenceTransformers** - Embeddings

### Database
- **MongoDB** - Primary database

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run linter

# RAG System
npm run rag:start       # Start RAG backend
npm run rag:health      # Check RAG backend health
npm run rag:test        # Test RAG endpoint

# Deployment
npm run deploy:dev      # Deploy to development
npm run deploy:prod     # Deploy to production
```

## 🎯 Usage

### AI Search (RAG-Powered)
1. Go to the home page
2. Enter your query (e.g., "fuel-efficient sedan under 15 lakhs")
3. Click the **"AI Search"** button (gradient with sparkle icon)
4. View intelligent recommendations in a beautiful modal

### Regular Search
1. Enter your query
2. Click the **standard search button** or press `Ctrl+Enter`
3. Browse results on the explore page

## 🏗️ Project Structure

```
autoassist-minor/
├── src/
│   ├── app/                      # Next.js pages
│   │   ├── (marketing)/          # Marketing pages (home, about, etc.)
│   │   └── api/                  # API routes
│   │       └── ai/
│   │           └── rag-chat/     # RAG proxy endpoint
│   ├── components/               # React components
│   │   ├── features/             # Feature components
│   │   │   ├── hero-section.tsx
│   │   │   └── rag-recommendation-panel.tsx
│   │   └── ui/                   # UI components
│   ├── services/                 # Service layer
│   │   └── ai/                   # AI services
│   │       ├── client.ts         # Gemini client
│   │       └── rag-client.ts     # RAG client
│   └── lib/                      # Utilities
├── llm/                          # RAG system
│   └── RAG-System-for-Car-Recommendation-Chatbot/
│       └── backend/              # FastAPI backend
├── public/                       # Static assets
└── docs/                         # Documentation
    ├── QUICKSTART_RAG.md
    ├── RAG_INTEGRATION.md
    ├── RAG_SUMMARY.md
    └── TEST_RAG.md
```

## 🔧 Configuration

### Environment Variables

Create `.env.local` in the project root:

```env
# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# RAG Backend
RAG_API_URL=http://localhost:8000

# MongoDB
MONGODB_URI=your_mongodb_uri

# NextAuth (if using)
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```

For RAG backend configuration, see [RAG_INTEGRATION.md](./RAG_INTEGRATION.md#configuration).

## 🧪 Testing

```bash
# Test RAG integration
npm run rag:test

# Test frontend
npm run dev
# Then visit http://localhost:3000

# Check health
npm run rag:health
```

For comprehensive testing guide, see [TEST_RAG.md](./TEST_RAG.md).

## 🐛 Troubleshooting

### RAG Backend Not Working
```bash
# Check if backend is running
npm run rag:health

# Restart backend
npm run rag:start
```

### Qdrant Connection Issues
```bash
# Start Qdrant
docker run -p 6333:6333 qdrant/qdrant

# Verify it's running
curl http://localhost:6333
```

For more troubleshooting, see [RAG_INTEGRATION.md](./RAG_INTEGRATION.md#troubleshooting).

## 📦 Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd autoassist-minor

# Install dependencies
npm install

# Setup RAG backend (one-time)
cd llm/RAG-System-for-Car-Recommendation-Chatbot
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Ingest data (one-time)
python backend/rag/loader.py
python backend/rag/embed.py --recreate

# Return to project root
cd ../..
```

## 🚢 Deployment

See [VERCEL_SETUP.md](./VERCEL_SETUP.md) for Vercel deployment.

For production deployment of the RAG backend, consider:
- Docker containerization
- Managed Qdrant cloud
- Gunicorn for FastAPI
- Environment-specific configurations

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

See [LICENSE](./LICENSE) file for details.

## 🔗 Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial
- [Next.js GitHub repository](https://github.com/vercel/next.js)

### RAG/AI Resources
- [LangChain Documentation](https://python.langchain.com/)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Ollama Documentation](https://github.com/ollama/ollama)

## ⭐ Show Your Support

If you find this project helpful, please give it a star!

---

**Built with ❤️ using Next.js and RAG**
