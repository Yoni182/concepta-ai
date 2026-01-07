# CONCEPTA - Deployment Guide

## Architecture

```
Frontend (React/Vite)          Backend (Node.js/Express)         Google Gemini API
your-domain.com     ◄----►     backend.your-domain.com    ◄────►  (Secured)
  No secrets                      API_KEY stored securely
```

## Local Development

### Prerequisites
- Node.js 18+
- Gemini API key from https://ai.studio

### Setup

1. **Frontend Setup**
```bash
npm install
```

2. **Backend Setup**
```bash
cd backend
npm install
```

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
export GEMINI_API_KEY="your_key_here"
npm run dev
# Runs on http://localhost:3002
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Runs on http://localhost:3000 or 3001
```

The frontend will automatically connect to `http://localhost:3002`.

## Production Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Deploy Backend to Railway
1. Push code to GitHub
2. Go to https://railway.app
3. Create new project → GitHub
4. Select your repo
5. Add `GEMINI_API_KEY` environment variable
6. Deploy

Backend URL: `https://your-project.railway.app`

#### Deploy Frontend to Vercel
1. Go to https://vercel.com
2. Import GitHub repo
3. Add environment variable:
   ```
   VITE_BACKEND_URL=https://your-project.railway.app
   ```
4. Deploy

Your app will be live at `your-vercel-domain.vercel.app`

### Option 2: AWS (Full Stack)

**Backend - AWS Lambda + API Gateway:**
- Package backend as Lambda function
- Use API Gateway for CORS
- Store `GEMINI_API_KEY` in AWS Secrets Manager

**Frontend - AWS S3 + CloudFront:**
- Build frontend: `npm run build`
- Upload `dist/` to S3
- Distribute through CloudFront
- Set CORS headers

### Option 3: Single VPS (DigitalOcean, Linode, etc.)

1. SSH into your server
2. Install Node.js
3. Setup backend:
   ```bash
   git clone your-repo
   cd backend
   npm install
   pm2 start server.ts --name "concepta-backend"
   ```
4. Setup frontend:
   ```bash
   npm run build
   # Serve dist/ with nginx
   ```
5. Setup nginx as reverse proxy
6. Enable HTTPS with Let's Encrypt

## Security Checklist

- ✅ API key **never** in frontend code
- ✅ API key stored in **environment variables** only
- ✅ Backend validates all requests
- ✅ CORS restricted to your domain only
- ✅ Rate limiting enabled on backend
- ✅ HTTPS enforced (production only)

## Environment Variables

### Frontend (.env.local)
```
VITE_BACKEND_URL=https://api.yourdomain.com
```

### Backend (.env.local)
```
GEMINI_API_KEY=your_actual_key_here
PORT=3002
```

## API Endpoints

### `/health` (GET)
Health check endpoint
```bash
curl https://api.yourdomain.com/health
# { "status": "ok" }
```

### `/api/analyze-model` (POST)
Analyze 3D massing model
```json
{
  "imageData": "base64_image_data"
}
```

### `/api/analyze-building-ref` (POST)
Analyze building reference
```json
{
  "imageData": "base64_image_data"
}
```

### `/api/generate-alternatives` (POST)
Generate 3 design alternatives
```json
{
  "modelImage": "data:image/png;base64,...",
  "modelDescription": "...",
  "detectedMaterials": [...],
  "selectedMaterialIds": [...],
  "manualMaterialImages": [...],
  "archIntelligence": {...},
  "contextSetting": "...",
  "groundFloorType": "...",
  "groundFloorDescription": "...",
  "lightingConfig": {...}
}
```

## Monitoring & Logs

Monitor backend:
```bash
pm2 logs concepta-backend
```

Check rate limiting:
```bash
curl -i https://api.yourdomain.com/health
# Check X-RateLimit headers
```

## Troubleshooting

**Frontend can't reach backend:**
- Check `VITE_BACKEND_URL` is correct
- Verify CORS headers: `Access-Control-Allow-Origin: *`
- Check network tab in browser DevTools

**API key errors:**
- Verify `GEMINI_API_KEY` is set on backend server
- Check key is valid in AI Studio

**Rate limiting:**
- Backend limits 60 requests/minute per IP
- Adjust in `server.ts` if needed

## Next Steps

1. Deploy backend first
2. Test with health check endpoint
3. Deploy frontend with correct backend URL
4. Monitor logs for errors
5. Set up error tracking (Sentry, etc.)
