# 🚀 QUICK START: Mapbox Setup (3 Minutes)

## ⚡ STEPS TO RUN

### 1. Get Mapbox Token (FREE - 50,000 requests/month)

1. Go to: **https://account.mapbox.com/access-tokens/**
2. Sign up/Login (free account)
3. Click **"Create a token"**
4. Name it: `DrishtiNE-Dev`
5. Enable these scopes:
   - ✅ `styles:tiles`
   - ✅ `geocoding:read`
   - ✅ `directions:read` (optional, for future)
6. Click **"Create token"**
7. Copy the token (starts with `pk.eyJ...`)

### 2. Add Token to Project

In `frontend/` folder, create `.env` file:

```bash
cd frontend
echo VITE_MAPBOX_TOKEN=pk.YOUR_ACTUAL_TOKEN_HERE > .env
```

**OR** copy from template:

```bash
cp .env.example .env
# Then edit .env and paste your token
```

### 3. Run the App

```bash
npm run dev
```

Open: http://localhost:5173

---

## ✅ VERIFICATION

### Test MapView:

1. Navigate to **Map** in app
2. Type location in search (e.g., "Guwahati")
3. Should see dropdown with suggestions
4. Select start and destination
5. Click **"Analyze Route Safety"**
6. Should see:
   - 🛡️ Scanning animation
   - Safety report with risk level
   - Map with route drawn
   - Color-coded risk indicator

### If Map Shows White Screen:

- Check browser console (F12)
- Look for error: `Error: Invalid access token`
- Solution: Verify token in `.env` is correct
- Restart dev server after changing `.env`

---

## 🔐 SECURITY NOTES

**⚠️ NEVER COMMIT YOUR TOKEN!**

- `.env` is in `.gitignore` (already configured)
- Use `.env.example` as template (no real token)
- For production: Use environment variables in hosting platform

**Token Restrictions** (for production):

- Add URL restrictions in Mapbox dashboard
- Whitelist only your domain
- Rotate tokens every 6 months

---

## 📊 FREE TIER LIMITS

Mapbox Free Plan:

- ✅ 50,000 map loads/month
- ✅ 100,000 geocoding requests/month
- ✅ Unlimited directions API requests
- ✅ All map styles (Streets, Satellite, Terrain)
- ✅ Offline maps support

**For DrishtiNE usage**: More than enough for development and moderate production use.

---

## 🆘 QUICK FIXES

### "Token not found" error

```bash
# Check if .env exists
ls -la .env  # (or dir .env on Windows)

# Check content
cat .env  # (or type .env on Windows)

# Should show:
# VITE_MAPBOX_TOKEN=pk.eyJ1234...
```

### Token not loading in app

```javascript
// Check in browser console:
console.log(import.meta.env.VITE_MAPBOX_TOKEN);

// Should show your token, not undefined
```

### Map loads but no suggestions

- Check Network tab (F12 → Network)
- Look for requests to `api.mapbox.com/geocoding/v5/`
- If blocked: Check firewall/antivirus
- If 401 Unauthorized: Token invalid, regenerate

---

## 🎯 READY TO GO!

After adding token:

1. ✅ Map loads with Mapbox tiles
2. ✅ Location search works (all India)
3. ✅ Safety scan integrates with backend
4. ✅ Risk-based navigation ready
5. ✅ Professional UI/UX

**Time to completion**: 2-3 minutes  
**Difficulty**: Easy (just copy/paste token)  
**Cost**: $0 (free tier)

---

Need help? Check [MAPBOX_MIGRATION_GUIDE.md](./MAPBOX_MIGRATION_GUIDE.md) for detailed docs.
