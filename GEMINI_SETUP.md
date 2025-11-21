# Google Gemini AI Setup Guide

## 📋 Overview

You need to add your **GEMINI_API_KEY** to your environment files. Since you have only **ONE API key**, you can use it for both **development** and **production**.

---

## 🔑 Step 1: Get Your Gemini API Key

1. Go to: **https://makersuite.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated API key (it looks like: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`)

---

## 💻 Step 2: For Local Development

### Option A: Create .env.local file (Recommended)

1. **Copy the template:**

   ```bash
   cp env.local.template .env.local
   ```

2. **Edit `.env.local` and replace the placeholder:**

   ```bash
   # Open the file
   nano .env.local
   # or
   code .env.local
   ```

3. **Replace this line:**

   ```env
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

   **With your actual key:**

   ```env
   GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
   ```

4. **Save the file** and restart your dev server:
   ```bash
   npm run dev
   ```

### Option B: Quick Command (Copy-Paste)

Replace `YOUR_ACTUAL_KEY` with your Gemini API key:

```bash
# Copy template to .env.local
cp env.local.template .env.local

# Add your API key (macOS/Linux)
echo "GEMINI_API_KEY=YOUR_ACTUAL_KEY" >> .env.local

# Restart dev server
npm run dev
```

---

## 🚀 Step 3: For Production (Vercel)

If you're deploying to Vercel, add the API key to your dashboard:

1. **Go to your Vercel project dashboard**
2. Navigate to: **Settings → Environment Variables**
3. Click **Add New**
4. Add the variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567` (your actual key)
   - **Environment:** Select **Production**, **Preview**, and **Development** (all three)
5. Click **Save**
6. **Redeploy** your application for changes to take effect

### Screenshot Guide:

```
Vercel Dashboard → Your Project → Settings → Environment Variables

┌─────────────────────────────────────────────────────────┐
│ Key:   GEMINI_API_KEY                                   │
│ Value: AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567         │
│ Environment: ☑ Production ☑ Preview ☑ Development      │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure Summary

Here's where the GEMINI_API_KEY needs to be:

| File/Location             | Purpose               | Action Required                          |
| ------------------------- | --------------------- | ---------------------------------------- |
| **`.env.local`**          | Local development     | ✅ **Create this file** and add your key |
| `env.local.template`      | Template only         | ✏️ Already updated (reference)           |
| `env.production.template` | Template only         | ✏️ Already updated (reference)           |
| `env.example`             | Documentation         | ✏️ Already updated (reference)           |
| **Vercel Dashboard**      | Production deployment | ✅ **Add variable** in settings          |

---

## ✅ Verify Your Setup

### Test Locally:

1. **Check if key is loaded:**

   ```bash
   # Start dev server
   npm run dev

   # In another terminal, test the API
   curl -X POST http://localhost:3000/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{"query": "Tata cars under 10 lakhs"}'
   ```

2. **You should see a response with car recommendations**

### Expected Response:

```json
{
  "response": "I found several Tata cars within your budget...",
  "recommendations": [...],
  "metadata": {
    "totalFound": 12,
    "confidence": 0.8
  }
}
```

---

## 🔒 Security Best Practices

### ✅ DO:

- ✅ Keep your API key secret
- ✅ Add `.env.local` to `.gitignore` (already done)
- ✅ Use the same key for dev and prod (it's fine for this project)
- ✅ Regenerate the key if you accidentally expose it

### ❌ DON'T:

- ❌ Commit `.env.local` to Git
- ❌ Share your API key publicly
- ❌ Use `NEXT_PUBLIC_` prefix (this would expose it to the browser)
- ❌ Hardcode the key in your source code

---

## 🆘 Troubleshooting

### Problem: "GEMINI_API_KEY not found" warning

**Solution:**

1. Check if `.env.local` exists:
   ```bash
   ls -la .env.local
   ```
2. Verify the key is in the file:
   ```bash
   cat .env.local | grep GEMINI_API_KEY
   ```
3. Restart your dev server:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### Problem: AI responses are using fallback patterns

**Symptom:** Responses work but seem too generic

**Solution:**

- Your API key might be invalid or expired
- Regenerate a new key at https://makersuite.google.com/app/apikey
- Update both `.env.local` and Vercel dashboard

### Problem: "API key not valid" error

**Solution:**

1. Go to https://makersuite.google.com/app/apikey
2. Check if your API key is enabled
3. Make sure you've enabled the Generative AI API
4. Generate a new key if needed

---

## 📝 Quick Checklist

- [ ] Got Gemini API key from Google MakerSuite
- [ ] Created `.env.local` file in project root
- [ ] Added `GEMINI_API_KEY=your-key-here` to `.env.local`
- [ ] Restarted dev server (`npm run dev`)
- [ ] Tested the `/api/ai/chat` endpoint
- [ ] (Optional) Added key to Vercel Dashboard for production

---

## 🎉 You're All Set!

Once you've added your GEMINI_API_KEY to `.env.local`, your AI-powered car recommendation system will work with full natural language understanding! 🚗💨

The system will:

- ✅ Understand complex queries like "safe family car with good mileage under 15 lakhs"
- ✅ Extract requirements intelligently
- ✅ Generate natural language responses
- ✅ Still work (with fallback patterns) even if the API key is missing

**Note:** The system has built-in fallback pattern matching, so it will work even without an API key, but with limited natural language understanding.
