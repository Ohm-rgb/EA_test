# AI Trading OS

> AI-Driven Trading & Portfolio Management System

## 🎯 วิสัยทัศน์

ระบบปฏิบัติการเทรด (Trading OS) ที่มุ่งเน้น "ความโปร่งใส ความเชื่อมั่น และการเรียนรู้พฤติกรรมบอท" ตามมาตรฐาน Apple Human Interface Guidelines

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, Tailwind CSS |
| Backend | FastAPI (Python 3.11+) |
| Database | SQLite (Dev) / PostgreSQL (Prod) |
| Local AI | Ollama |
| External AI | Google Gemini API |
| Real-time | WebSocket |

## 📁 Project Structure

```
ai-trading-os/
├── frontend/          # Next.js Application
├── backend/           # FastAPI Application
├── docker/            # Docker configurations
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Ollama (for Local AI)

### Development

```bash
# Install dependencies
npm install

# Start all services
npm run dev

# Or use Docker
npm run docker:up
```

### Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📋 Development Roadmap

- [x] Sprint 1: Core Infrastructure
- [x] Sprint 2: UI Foundation + Mockups
- [x] Sprint 3: Bot Design & Sandbox
- [x] Sprint 4: Portfolio & AI Integration
- [x] Sprint 5: Control Center & Security

## 📄 License

Private - All rights reserved
