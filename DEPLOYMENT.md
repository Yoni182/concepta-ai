# CONCEPTA Deployment Guide

## Architecture

This application runs entirely on **Vercel**:
- **Frontend**: React + Vite (static build)
- **Backend**: Vercel Serverless Functions in `/api/`

No external backend server required!

---

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Migrate to Vercel Serverless Functions"
git push origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel auto-detects Vite project

### 3. Add Environment Variable
In Vercel Dashboard → Project Settings → Environment Variables:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | Your Google AI API key |

### 4. Deploy
Vercel automatically deploys on push to main branch.

---

## Local Development

### Option 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Create .env file with your API key
echo "GEMINI_API_KEY=your_key_here" > .env

# Run locally (serves both frontend and API)
vercel dev
```

### Option 2: Vite + Manual API Testing
```bash
# Just the frontend (API calls will fail)
npm run dev
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/analyze-model` | POST | Analyze 3D massing model |
| `/api/analyze-building-ref` | POST | Extract architectural intelligence |
| `/api/generate-alternatives` | POST | Generate design alternatives |

---

## Troubleshooting

### API Timeout
The `/api/generate-alternatives` endpoint may timeout on Hobby plan (10s limit).
Upgrade to Pro for 60s limit if needed.

### Missing GEMINI_API_KEY
Check Vercel Dashboard → Environment Variables
