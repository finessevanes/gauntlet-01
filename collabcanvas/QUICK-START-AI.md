# AI Service Quick Start

## 🚀 Get Started in 3 Steps

### 1. Set Up API Key (One Time)
```bash
# In collabcanvas directory, create .env file:
echo "VITE_OPENAI_API_KEY=sk-your-key-here" > .env
```
Get your key from: https://platform.openai.com/api-keys

### 2. Start Dev Server
```bash
cd collabcanvas
npm run dev
```

### 3. Test in Browser Console (F12)
```javascript
const ai = new window.AIService();
await ai.executeCommand("create a blue circle in the center", "test_user");
```

✅ **Success!** You should see a blue circle appear on the canvas.

---

## 🎨 Try These Commands

```javascript
// Basic shapes
await ai.executeCommand("create a red rectangle at 500, 500", "test_user");
await ai.executeCommand("add a green triangle in the top-left", "test_user");
await ai.executeCommand("make a yellow circle in the center", "test_user");

// Text
await ai.executeCommand("add text that says Hello World", "test_user");
await ai.executeCommand("create bold text saying TITLE at the center", "test_user");

// Multiple shapes
await ai.executeCommand("create 3 blue rectangles", "test_user");
```

---

## 📚 Full Documentation

- **Complete Testing Guide:** `AI-SERVICE-TESTING.md`
- **Implementation Details:** `../docs/PR-1-IMPLEMENTATION-SUMMARY.md`
- **TODO Checklist:** `../docs/PR-1-TODO.md`

---

## ⚠️ Troubleshooting

**"OpenAI API key not found"**  
→ Check `.env` file exists and has `VITE_OPENAI_API_KEY=sk-...`

**"Network error"**  
→ Verify API key is valid at https://platform.openai.com/api-keys

**Shapes don't appear**  
→ Check browser console for errors, verify Firebase is connected

---

**That's it! You're ready to use AI-powered canvas creation! 🎉**

