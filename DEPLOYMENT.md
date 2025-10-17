# Deployment Guide

## Quick Deploy to Vercel (Recommended)

### Step 1: Prepare GitHub Repository

1. Create a new GitHub repository:
```bash
cd /Users/garthwoods/cobra-analyzer
git init
git add .
git commit -m "Initial commit - Cobra Fee Analyzer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cobra-analyzer.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your `cobra-analyzer` repository
4. Vercel will auto-detect Next.js settings
5. Click "Deploy"

That's it! Your app will be live at `https://cobra-analyzer.vercel.app` (or your custom domain)

## Alternative Deployment Options

### Deploy to Netlify

1. Build the static export:
```bash
npm run build
```

2. Deploy to Netlify:
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Deploy to Your Own Server

1. Build the production app:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

3. Use PM2 or similar for process management:
```bash
npm install -g pm2
pm2 start npm --name "cobra-analyzer" -- start
```

## Custom Domain Setup

### On Vercel:
1. Go to your project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Environment Variables

This app doesn't require any environment variables as it runs entirely client-side. However, if you add server-side features in the future:

1. Create `.env.local` file
2. Add your variables
3. In Vercel, add them under Settings → Environment Variables

## Performance Optimization

The app is already optimized with:
- ✅ Client-side processing (no server load)
- ✅ Automatic code splitting (Next.js)
- ✅ Image optimization
- ✅ Tailwind CSS purging

## Monitoring

Vercel automatically provides:
- Analytics
- Performance metrics
- Error tracking
- Real-time logs

## Updating the App

1. Make changes locally
2. Test with `npm run dev`
3. Commit and push to GitHub:
```bash
git add .
git commit -m "Your update message"
git push
```

4. Vercel will automatically redeploy

## Troubleshooting

### Build Fails
- Check Node.js version (requires 18+)
- Run `npm install` to ensure all dependencies are installed
- Check build logs in Vercel dashboard

### Charts Not Displaying
- Ensure Recharts is properly installed
- Check browser console for errors
- Verify data format matches expected structure

### File Upload Issues
- Check file size limits
- Verify file format (CSV, Excel)
- Ensure proper column names in statement

## Security Checklist

- ✅ No API keys exposed
- ✅ Client-side only processing
- ✅ No database required
- ✅ HTTPS enabled by default on Vercel
- ✅ No user data stored on servers

## Support

For deployment issues:
1. Check Vercel documentation
2. Review build logs
3. Open an issue on GitHub


