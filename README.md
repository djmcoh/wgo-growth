# WGO Growth Command Center

A task management and content planning dashboard with cloud sync via Neon PostgreSQL.

## Setup Instructions

### 1. Create a GitHub Repository

1. Go to github.com and create a new repository (e.g., `wgo-growth-app`)
2. Unzip the downloaded `wgo-netlify.zip`
3. Push the contents to your repo:
   ```bash
   cd wgo-netlify
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/wgo-growth-app.git
   git push -u origin main
   ```

### 2. Connect Netlify to GitHub

1. Go to app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Deploy settings should auto-detect from `netlify.toml`
5. Click "Deploy"

### 3. Add Database Environment Variable

1. In Netlify, go to Site Settings → Environment Variables
2. Add a new variable:
   - Key: `DATABASE_URL`
   - Value: Your Neon connection string (e.g., `postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require`)
3. Redeploy the site

### 4. Initialize the Database

1. Open your deployed site
2. Click Settings (gear icon) → "Initialize Cloud Database"
3. This creates the tables in your Neon database

## Project Structure

```
wgo-netlify/
├── public/
│   └── index.html          # Main app (React)
├── netlify/
│   └── functions/
│       ├── tasks.js        # Tasks API (CRUD)
│       ├── metrics.js      # Metrics API
│       └── init-db.js      # Database setup
├── netlify.toml            # Netlify config
└── package.json            # Dependencies
```

## Features

- ✅ Task management with drag-drop calendar
- ✅ Cloud sync via Neon PostgreSQL
- ✅ Offline fallback to localStorage
- ✅ Sync status indicator
- ✅ Mobile responsive
- ✅ AI content assistant (templates)
