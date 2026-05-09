# 🚀 CyberSphere Deployment Guide

Follow these steps to deploy the full-stack platform.

## 1. Prepare GitHub Repository
1. Create a new repository on GitHub.
2. Open your terminal in the root `CyberSphere` folder.
3. Run these commands:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Production Ready"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

---

## 2. Deploy Backend (Render)
1. Go to [Render.com](https://render.com) and Log In.
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Set the following:
   - **Name**: `cybersphere-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Click **Advanced** > **Add Environment Variable**:
   - `GOOGLE_API_KEY`: (Your Gemini API Key)
   - `JWT_SECRET_KEY`: (A random long string)
   - `FRONTEND_URL`: `https://your-app-name.vercel.app` (You'll update this later)
6. Click **Create Web Service**.
7. **Copy your Backend URL** (e.g., `https://cybersphere-backend.onrender.com`).

---

## 3. Deploy Frontend (Vercel)
1. Go to [Vercel.com](https://vercel.com) and Log In.
2. Click **Add New** > **Project**.
3. Import your GitHub repository.
4. **CRITICAL SETTINGS**:
   - **Framework Preset**: Vite
   - **Root Directory**: Click "Edit" and select **`frontend`**.
5. Open **Environment Variables** and add:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com/api` (Paste your Render URL here and add `/api` at the end).
6. Click **Deploy**.

---

## 4. Final Connection
Once Vercel gives you your live URL:
1. Go back to **Render** dashboard.
2. Go to **Environment Variables**.
3. Update `FRONTEND_URL` with your actual Vercel URL.
4. Render will automatically redeploy with the new security settings.

---

### ✅ Verification
1. Visit your Vercel URL.
2. Try to Sign Up / Log In.
3. Check PhishGuard to see if the AI analysis is working.
