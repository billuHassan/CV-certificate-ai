<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally and deploy it securely.

View your app in AI Studio: https://ai.studio/apps/33c3221e-6e83-481e-9467-41345cf0da28

## Run Locally

**Prerequisites:** Node.js (v18 or higher)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local] to your Gemini API key:
   ```bash
   # Create .env.local (never commit this file)
   cp .env.example .env.local
   # Edit .env.local and add your actual API keys
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## 🔒 Security & Deployment

### Environment Variables
- **NEVER** commit `.env.local` or any file with real secrets
- Use `.env.example` as a template for required variables
- Secrets are automatically ignored via `.gitignore`

### GitHub Secrets Setup
Before deploying to Cloud Run, configure these secrets in your GitHub repository:

**Steps:**
1. Go to Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Add these secrets:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `APP_URL`: Your deployed app URL (e.g., https://your-app.run.app)
   - `PAYPAL_CLIENT_ID`: PayPal API credentials (if using payments)
   - `PAYPAL_CLIENT_SECRET`: PayPal API credentials (if using payments)
   - `GCP_PROJECT_ID`: Your Google Cloud project ID (for Cloud Run deployment)

### Automatic Deployment
- The app deploys automatically when you push to the `main` branch
- GitHub Actions validates all required secrets before building
- Environment variables are injected securely during deployment
- All deployments are logged in the Actions tab for auditing

### Build Commands
```bash
npm run dev       # Development with hot reload
npm run build     # Production build
npm run start     # Run production build
npm run lint      # Type checking
npm run clean     # Clean build artifacts
```

## 📋 Security Checklist

✅ **Before Deploying:**
- [ ] Add `GEMINI_API_KEY` to GitHub Secrets (Settings > Secrets and variables > Actions)
- [ ] Add `GCP_PROJECT_ID` to GitHub Secrets
- [ ] Configure any optional PayPal secrets
- [ ] Never commit `.env.local` file
- [ ] Verify `.gitignore` includes `.env*`

✅ **What's Protected:**
- Environment variable validation at startup
- GitHub Actions security scanning
- Automated secret detection in CI/CD
- Secrets injected at deploy time (never in code)
- All sensitive credentials kept out of version control

## 🚀 Deployment Steps

1. **Merge this branch to main:**
   ```bash
   git checkout main
   git pull origin fix/secure-deployment
   ```

2. **Add GitHub Secrets** (one-time setup):
   - Go to repo Settings > Secrets and variables > Actions
   - Add all required secrets above

3. **Push to main branch:**
   ```bash
   git push origin main
   ```

4. **Watch deployment:**
   - Go to Actions tab
   - Monitor the workflow execution
   - Deployment to Cloud Run happens automatically on success
