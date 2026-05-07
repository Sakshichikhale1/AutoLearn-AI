# 🚀 AutoLearn AI Studio - Project Overview

AutoLearn AI Studio is a state-of-the-art, multimodal learning platform designed to transform static educational content into a dynamic, AI-powered study ecosystem.

---

## 🛠️ Advanced Tech Stack
- **Backend**: FastAPI (Python 3.11+), Uvicorn, Groq SDK (Llama 3.3 & Llama 3.2 Vision).
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, ReactFlow (Mind Maps).
- **Database**: MongoDB (Persistence) & LocalStorage (Session caching).
- **Deployment**: Dockerized for Render/Production readiness.

---

## 🌐 AI & Multimodal Integrations
This project utilizes a sophisticated orchestration of 10+ AI and external services:

1.  **Groq Cloud API (Llama 3.3 70B)**: The core reasoning engine for notes, quizzes, and chat.
2.  **Llama 3.2 11B Vision**: Powers the **"Scan & Solve"** feature, analyzing uploaded images of handwritten problems or code.
3.  **Virtual AI Professor**: A custom-animated AI avatar that provides video lecture summaries using **Framer Motion** and high-fidelity visualizations.
4.  **AI Podcast Studio**: Converts study notes into a conversational podcast with distinct male/female AI voices using browser-native **SpeechSynthesis**.
5.  **Research Hub (Semantic Scholar + arXiv)**: Searches 200M+ papers with **AI Summary** capabilities for academic deep-dives.
6.  **YouTube Data API**: Automatically finds relevant video tutorials for the current study topic.
7.  **Wikipedia & DuckDuckGo**: Provides real-time factual grounding and external web resources.
8.  **Pexels API**: Injects high-quality academic imagery for visual learning.

---

## 🔄 Core Application Flow

### 1. Multimodal Input
- Supports **PDFs, Images, Audio, and Raw Text**.
- Integrated **OCR & Vision** for analyzing handwritten notes and diagrams.

### 2. AI Synthesis
- Generates a complete learning suite in seconds:
    - **Academic Notes**: Clean, markdown-rendered sections.
    - **Interactive Mind Map**: Visual concept breakdown with **AI Summarize** on every node.
    - **Adaptive Quizzes**: Real-time scoring and performance tracking.
    - **3D Flashcards**: For active recall and spaced repetition.

### 3. Interactive Engagement
- **Virtual Professor**: Get a personal video lecture summary of your notes.
- **Scan & Solve**: Upload a problem, and the AI guides you through the solution step-by-step.
- **AI Podcast**: Listen to your notes on the go as a conversational talk show.
- **Context-Aware Chat**: A Socratic tutor that knows exactly what you are studying.

### 4. Persistence & Deployment
- **MongoDB**: Securely saves all study sessions, history, and user preferences.
- **Docker**: Containerized for instant deployment to Render, AWS, or local environments.

---

## 🎨 Design Philosophy
- **Premium Aesthetics**: Using Glassmorphism, blurred backdrops, and rich micro-animations.
- **Data-Driven UI**: Every component is reactive and tied to a global state.
- **Mobile First**: Optimized for seamless learning across all device sizes.