# GitHub Setup Instructions

Your code is committed and ready to push! Follow these steps:

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `hyrox-roast-generator` (or your preferred name)
3. Description: "AI-powered roast generator for Hyrox race results"
4. Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Use these instead (they're already set up):

```bash
git remote add origin https://github.com/YOUR_USERNAME/hyrox-roast-generator.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 3: Vercel Deployment

Once pushed to GitHub:

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: **Other** (or Node.js)
   - Root Directory: `./`
   - Build Command: (leave empty or `npm install`)
   - Output Directory: `public` (for static files)
   - Install Command: `npm install`
5. Add Environment Variables:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `PORT`: (optional, Vercel sets this automatically)
6. Click "Deploy"

## Important Notes for Vercel

Since this is a Node.js backend with Express, you may need to:

1. Create a `vercel.json` configuration file (see below)
2. Or use Vercel's serverless functions

The app needs to run as a server, so Vercel will handle it as a serverless function automatically.

