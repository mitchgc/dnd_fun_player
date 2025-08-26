# Collaborative Journal Setup Guide

## Overview

This guide will help you set up the collaborative journal feature for your DnDHelper app using Supabase's free tier. The collaborative journal allows D&D parties to share and edit session notes in real-time.

## Features

✅ **Real-time collaboration** - Multiple users can edit simultaneously  
✅ **Zero-cost deployment** - Built entirely on Supabase free tier  
✅ **Anonymous authentication** - No sign-up required  
✅ **Session-based sharing** - 6-character codes for easy party joining  
✅ **Offline support** - Changes sync when reconnected  
✅ **Presence indicators** - See who's currently active  
✅ **Conflict resolution** - Last-write-wins with PostgreSQL timestamps  

## Prerequisites

- Supabase account (free at [supabase.com](https://supabase.com))
- Node.js and npm installed
- Your DnDHelper project

## Step 1: Supabase Project Setup

1. **Create a new Supabase project**:
   - Go to [app.supabase.com](https://app.supabase.com)
   - Click "New Project"
   - Choose your organization
   - Enter project name: "DnDHelper"
   - Create a database password
   - Select a region close to your users
   - Click "Create new project"

2. **Get your project credentials**:
   - Go to Settings > API
   - Copy your "Project URL"
   - Copy your "anon public" API key

3. **Run the database schema**:
   - Go to SQL Editor in your Supabase dashboard
   - Copy the entire content from `supabase-schema.sql`
   - Paste and run the SQL to create all necessary tables and functions

## Step 2: Environment Configuration

1. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables** in `.env`:
   ```bash
   REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 3: Install Dependencies

The collaborative journal requires the Supabase client library:

```bash
npm install @supabase/supabase-js
```

## Step 4: Test the Implementation

1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Test collaborative features**:
   - Navigate to the "Journal" tab
   - Create a new session (you'll get a 6-character code)
   - Open another browser window/tab and join using the same code
   - Try editing simultaneously to test real-time sync

## Step 5: Deploy to Production

### GitHub Pages Deployment

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages**:
   ```bash
   npm run deploy
   ```

3. **Set environment variables for production**:
   - GitHub doesn't support environment variables directly
   - You'll need to either:
     - Use Netlify/Vercel for automatic env var injection
     - Or hardcode the values (less secure)

### Alternative: Netlify Deployment

1. **Connect your GitHub repository to Netlify**
2. **Set environment variables** in Netlify dashboard:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
3. **Deploy automatically** on every push

## Supabase Free Tier Limits

Your collaborative journal will stay within Supabase's generous free tier:

- **Database**: 500MB storage (plenty for text notes)
- **Realtime**: 200 concurrent connections
- **Auth**: 50,000 monthly active users
- **Bandwidth**: 5GB egress per month

## How It Works

### Architecture

```
React App ←→ Supabase Client ←→ PostgreSQL Database
    ↓              ↓                      ↓
  Local UI    Real-time Sync         Persistent Storage
```

### Data Flow

1. **Anonymous Authentication**: Users are automatically signed in anonymously
2. **Session Creation**: Creates a journal with a 6-character shareable code
3. **Real-time Sync**: Changes are synchronized via PostgreSQL triggers and Supabase real-time
4. **Conflict Resolution**: Last-write-wins using PostgreSQL timestamps

### Database Schema

- **dnd_journals**: Stores journal content and metadata
- **dnd_collaborators**: Tracks active users per session

## Troubleshooting

### Common Issues

1. **Environment variables not loading**:
   - Ensure `.env` file is in the project root
   - Restart the development server after adding env vars
   - Check that variable names start with `REACT_APP_`

2. **Real-time not working**:
   - Verify real-time is enabled in Supabase dashboard
   - Check that tables are added to the `supabase_realtime` publication
   - Ensure Row Level Security policies allow your operations

3. **Authentication errors**:
   - Check that anonymous auth is enabled in Supabase
   - Verify API keys are correct and not expired

4. **Session not found**:
   - Verify session codes are uppercase and 6 characters
   - Check that the journal exists in the database

### Support

For issues specific to this implementation:
1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Test with multiple browser windows to confirm real-time sync

## Security Considerations

- **Data Privacy**: All data is stored in your Supabase project
- **Anonymous Auth**: Users don't need accounts, but can't recover lost sessions
- **Row Level Security**: Enabled to prevent unauthorized access
- **API Keys**: Anon keys are safe to expose publicly (by design)

## Future Enhancements

Possible improvements for the collaborative journal:

- **Markdown rendering** for formatted display
- **Session persistence** with user accounts
- **Version history** and change tracking
- **Export functionality** to PDF or other formats
- **Character integration** with stats and combat data

---

🎲 **Happy Gaming!** Your D&D party can now collaborate seamlessly on session notes in real-time!