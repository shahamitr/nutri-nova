# NutriVoice AI - Conversational Demo

## 🎯 Purpose

This is a standalone, interactive prototype demonstrating the core value proposition of NutriVoice AI - a conversational AI diet doctor powered by Amazon Nova. It showcases a natural voice-based onboarding journey where the AI asks multiple questions to understand the user's health goals and creates a personalized diet plan.

## ✨ Features Demonstrated

1. **Amazon Nova Sonic** - Voice-to-text and text-to-voice for natural conversation
2. **Multi-Question Onboarding** - AI asks 5 questions to understand user needs:
   - Main health goal
   - Current weight and height
   - Activity level
   - Dietary restrictions
   - Food preferences
3. **Amazon Nova Lite** - Intelligent reasoning and analysis between questions
4. **Real-time Processing** - Visual feedback showing AI thinking and analyzing
5. **Personalized Results** - Complete health profile and diet plan based on conversation
6. **Natural Conversation Flow** - Feels like talking to a real nutritionist

## 🚀 How to Use

### Option 1: Direct Browser Access (Recommended)
Simply open `index.html` in any modern web browser:
- Double-click `index.html`
- Or right-click → Open with → Your browser

**No server required!** The demo runs entirely in thebrowser.

### Option 2: Local Server (Optional)
If you prefer to run it through a local server:

```bash
# Using Python 3
cd demo
python -m http.server 8000

# Using Node.js (http-server)
cd demo
npx http-server -p 8000

# Using PHP
cd demo
php -S localhost:8000
```

Then open: `http://localhost:8000`

## 📁 File Structure

```
demo/
├── index.html      # Main HTML with conversation interface
├── styles.css      # Styling for voice-based conversation UI
├── script.js       # Conversational flow logic with Amazon Nova
└── README.md       # This file
```

## 🎨 Demo Flow

The demo simulates a natural voice conversation with 11 interaction steps:

1. **AI Welcome** (3s) - AI introduces itself and asks first question
2. **User Response** (3s) - User states their health goal via voice
3. **AI Processing** (2.5s) - Amazon Nova Lite analyzes response
4. **AI Question 2** (1.5s) - AI asks about weight and height
5. **User Response** (2.5s) - User provides measurements
6. **AI Processing** (2s) - AI calculates BMI
7. **AI Question 3** (1.5s) - AI asks about activity level
8. **User Response** (2.8s) - User describes activity
9. **AI Processing** (2s) - AI analyzes activity patterns
10. **AI Question 4** (1.5s) - AI asks about dietary restrictions
11. **User Response** (2.2s) - User mentions preferences
12. **AI Processing** (3s) - AI creates personalized plan
13. **AI Summary** (2s) - AI explains the plan being created
14. **Final Processing** (3.5s) - Amazon Nova Lite generates complete plan
15. **Results Display** (1s) - Personalized plan appears

**Total Demo Duration:** ~35 seconds

## 🎭 What Makes This Demo Impactful

### For Judges/Stakeholders:
- **Shows Amazon Nova in action** - Both Sonic (voice) and Lite (reasoning) clearly labeled
- **Demonstrates conversational AI** - Natural multi-turn dialogue, not just one question
- **Proves the onboarding journey** - Shows how AI gathers information through questions
- **Creates emotional connection** - Viewers experience the conversation flow
- **Highlights differentiation** - Voice-first approach sets it apart from form-based apps

### Technical Highlights:
- Pure HTML/CSS/JavaScript (no dependencies)
- Smooth conversation flow with realistic timing
- Clear Amazon Nova branding throughout
- Voice indicators showing when AI is listening/speaking
- Processing indicators showing Amazon Nova Lite analyzing
- Responsive design (works on mobile/tablet/desktop)
- Professional UI matching modern health apps

## 🎯 Key Differentiators Shown

1. **Amazon Nova Powered** - Clearly shows both Nova Sonic and Nova Lite in action
2. **Voice-First Interaction** - Not just another form-based diet app
3. **Conversational Onboarding** - AI asks multiple questions naturally
4. **Real-time AI Analysis** - Shows processing between each question
5. **Personalized Results** - Complete plan based on the conversation
6. **User-Centric Design** - Clear, visual, and engaging interface

## 🔧 Customization

### Change Conversation Flow:
Edit `script.js` - the `conversationFlow` array contains all dialogue:
```javascript
const conversationFlow = [
    {
        type: 'ai-voice',
        text: "Your custom AI message here",
        delay: 1000
    },
    // Add more conversation steps...
];
```

### Adjust Timing:
Modify the `delay` and `duration` values in the conversation flow

### Modify Colors:
Edit the CSS gradient colors in `styles.css`

### Change Amazon Nova Branding:
Update the `.nova-badge` and `.aws-badge` styles in `styles.css`

## 📱 Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎬 Presentation Tips

1. **Start with context**: "This is Nutri-Nova, an AI-powered diet doctor"
2. **Let the demo run**: Don't interrupt the flow
3. **Highlight key moments**:
   - "Notice the AI is listening..."
   - "See the personalized insights appearing..."
   - "Here's the complete meal plan generated in real-time..."
4. **End with impact**: "This entire journey takes 25 seconds - from concern to personalized plan"

## 🚀 Next Steps

This demo can be:
- Embedded in presentations
- Shared via link (host on GitHub Pages, Netlify, Vercel)
- Used for user testing and feedback
- Extended with more features (voice recording, more meal options, etc.)

## 📄 License

Part of the Nutri-Nova project. See main project README for details.

---

**Built with ❤️ to demonstrate the future of personalized nutrition**


## 🎬 Presentation Tips

1. **Start with context**: "This is NutriVoice AI, powered by Amazon Nova"
2. **Highlight the voice aspect**: "Watch how it conducts a natural conversation"
3. **Let the demo run**: Don't interrupt the conversation flow
4. **Point out Amazon Nova**:
   - "Notice Amazon Nova Sonic handling the voice interaction..."
   - "See Amazon Nova Lite analyzing the responses..."
5. **Emphasize the questions**: "The AI asks 5 targeted questions to understand the user"
6. **End with impact**: "From conversation to personalized plan in 35 seconds"

---

**Built with ❤️ to demonstrate Amazon Nova's conversational AI capabilities in healthcare**
