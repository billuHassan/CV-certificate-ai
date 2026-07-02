# Cloud Run Deployment Guide

This guide explains how to deploy the CV Certificate AI app to Google Cloud Run.

## Prerequisites

1. **Google Cloud Account** - [Create one here](https://console.cloud.google.com)
2. **GitHub Repository** - Already set up
3. **GitHub Secrets** - Already configured in your repo

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a Project" → "New Project"
3. Name it: `CV-Certificate-AI`
4. Click "Create"

## Step 2: Enable Required APIs

1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable these APIs:
   - **Cloud Run API**
   - **Container Registry API**
   - **Cloud Build API**

## Step 3: Create a Service Account

1. Go to "APIs & Services" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `github-deployer`
4. Click "Create and Continue"
5. Grant these roles:
   - **Cloud Run Admin**
   - **Service Account User**
   - **Storage Admin** (for Container Registry)
6. Click "Continue" then "Done"

## Step 4: Create and Download Service Account Key

1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select **JSON** format
5. Click "Create" - the key will download automatically
6. Save this key securely (you'll need it next)

## Step 5: Add GCP Service Account Key to GitHub Secrets

1. Go to your GitHub repository
2. Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: `GCP_SA_KEY`
5. Value: Copy the entire JSON content from the downloaded key file
6. Click "Add secret"

## Step 6: Deploy via GitHub Actions

Now that everything is set up, the deployment is automatic:

### Option A: Automatic Deployment (Recommended)
```bash
# Simply push to main branch
git checkout main
git merge fix/secure-deployment
git push origin main
```

This will:
✅ Trigger the GitHub Actions workflow automatically
✅ Build your Docker image
✅ Push it to Google Container Registry
✅ Deploy to Cloud Run
✅ Set environment variables securely

### Option B: Manual Deployment (If needed)

If automatic deployment doesn't work, deploy manually:

```bash
# 1. Build the project locally
npm run build

# 2. Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 3. Build and push Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/cv-certificate-ai:latest .
docker push gcr.io/YOUR_PROJECT_ID/cv-certificate-ai:latest

# 4. Deploy to Cloud Run
gcloud run deploy cv-certificate-ai \
  --image gcr.io/YOUR_PROJECT_ID/cv-certificate-ai:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key_here,APP_URL=https://your-url.run.app
```

## Step 7: Monitor Deployment

1. Go to your GitHub repository
2. Click "Actions" tab
3. Watch the workflow run:
   - 🔒 Security check
   - 🔨 Build (2-3 minutes)
   - 🚀 Deploy (1-2 minutes)
4. When complete, you'll see a green checkmark ✅

## Step 8: Access Your App

Once deployed, Cloud Run will give you a URL like:
```
https://cv-certificate-ai-xxxxx.run.app
```

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on `cv-certificate-ai` service
3. The URL is shown at the top
4. Test it by visiting: `https://cv-certificate-ai-xxxxx.run.app/health`

## Troubleshooting

### Deployment fails in GitHub Actions?
1. Check the Actions tab for error messages
2. Verify all GitHub Secrets are set correctly
3. Make sure `GCP_SA_KEY` is the full JSON content (not a path)

### Cloud Run says "Permission denied"?
- Verify the service account has "Cloud Run Admin" role
- Check that the service account key JSON is valid

### App crashes after deployment?
1. Check Cloud Run logs: Click service → "Logs" tab
2. Verify `GEMINI_API_KEY` is set in environment variables
3. Make sure `Dockerfile` and `dist/server.cjs` exist

### How to view logs?
```bash
gcloud run logs read cv-certificate-ai --region us-central1 --limit 50
```

## Environment Variables in Cloud Run

All secrets are injected automatically via GitHub Actions. View them:

1. Go to Cloud Run service
2. Click "Edit & Deploy New Revision"
3. Scroll to "Environment variables" section
4. All variables from GitHub Secrets are listed there

## Scaling & Monitoring

### Auto-scaling
Cloud Run automatically scales based on traffic (default: 100 concurrent requests per instance)

### View Metrics
1. Click on your service in Cloud Run
2. Go to "Metrics" tab
3. Monitor: CPU, Memory, Request count, Response time

### Costs
- **Always Free Tier**: 2 million requests/month
- After that: $0.24 per million requests + compute time

## Update Your App

To push updates:
```bash
# Make your changes
git add .
git commit -m "Update app"
git push origin fix/secure-deployment

# Then merge to main
git checkout main
git merge fix/secure-deployment
git push origin main
```

The workflow will automatically rebuild and redeploy! 🚀

## Support

If you encounter issues:
1. Check GitHub Actions logs for errors
2. Check Cloud Run service logs
3. Verify all GitHub Secrets are configured
4. Ensure service account has correct permissions
