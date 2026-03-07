// NutriVoice AI - Conversational Demo Script
// Demonstrates voice-based onboarding with Amazon Nova

const conversationFlow = [
    {
        type: 'ai-voice',
        text: "Hello! I'm your AI diet doctor powered by Amazon Nova. I'm here to create a personalized nutrition plan just for you. Let's start with a simple question: What's your main health goal?",
        delay: 1000
    },
    {
        type: 'user-voice',
        text: "I want to lose about 10 pounds, but I'm always tired and have no energy throughout the day.",
        delay: 3000
    },
    {
        type: 'ai-processing',
        duration: 2500
    },
    {
        type: 'ai-voice',
        text: "I understand. Low energy while trying to lose weight is common. Let me ask you a few more questions to create the perfect plan. First, how old are you?",
        delay: 1500
    },
    {
        type: 'user-voice',
        text: "I'm 32 years old.",
        delay: 2000
    },
    {
        type: 'ai-processing',
        duration: 1800
    },
    {
        type: 'ai-voice',
        text: "Thank you. Now, what's your current weight and height?",
        delay: 1200
    },
    {
        type: 'user-voice',
        text: "I'm 5 feet 6 inches tall and weigh 175 pounds.",
        delay: 2500
    },
    {
        type: 'ai-processing',
        duration: 2000
    },
    {
        type: 'ai-voice',
        text: "Perfect. Based on that, your BMI is 27.3, which is in the overweight range. Now, tell me about your activity level. Are you sedentary, lightly active, moderately active, or very active?",
        delay: 1500
    },
    {
        type: 'user-voice',
        text: "I'd say lightly active. I walk about 30 minutes most days but don't do intense workouts.",
        delay: 2800
    },
    {
        type: 'ai-processing',
        duration: 2000
    },
    {
        type: 'ai-voice',
        text: "Excellent. One more important question: Do you have any dietary restrictions or food allergies I should know about?",
        delay: 1500
    },
    {
        type: 'user-voice',
        text: "No allergies, but I prefer to avoid red meat.",
        delay: 2200
    },
    {
        type: 'ai-processing',
        duration: 3000
    },
    {
        type: 'ai-voice',
        text: "Perfect! I have everything I need. Based on your age, BMI, activity level, and preferences, I'm creating a comprehensive nutrition plan. This will include breakfast, lunch, snacks, dinner, water intake schedule, and lifestyle recommendations tailored specifically for you...",
        delay: 2000
    },
    {
        type: 'ai-processing',
        duration: 3500
    },
    {
        type: 'results',
        delay: 1000
    }
];

let currentStep = 0;
let messagesContainer;
let voiceIndicator;
let aiProcessing;
let resultsPanel;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    messagesContainer = document.getElementById('conversation-messages');
    voiceIndicator = document.getElementById('voice-indicator');
    aiProcessing = document.getElementById('ai-processing');
    resultsPanel = document.getElementById('results-panel');

    const startBtn = document.getElementById('start-demo');
    const restartBtn = document.getElementById('restart-demo');

    startBtn.addEventListener('click', startConversation);
    restartBtn.addEventListener('click', restartConversation);
});

function startConversation() {
    document.getElementById('start-demo').style.display = 'none';
    document.querySelector('.conversation-info').style.display = 'none';
    currentStep = 0;
    processNextStep();
}

function restartConversation() {
    // Reset everything
    messagesContainer.innerHTML = '';
    voiceIndicator.classList.remove('active');
    aiProcessing.classList.remove('active');
    resultsPanel.classList.remove('active');

    document.getElementById('restart-demo').style.display = 'none';
    document.getElementById('start-demo').style.display = 'inline-block';
    document.querySelector('.conversation-info').style.display = 'block';

    currentStep = 0;
}

function processNextStep() {
    if (currentStep >= conversationFlow.length) {
        // Conversation complete
        document.getElementById('restart-demo').style.display = 'inline-block';
        return;
    }

    const step = conversationFlow[currentStep];

    setTimeout(() => {
        switch (step.type) {
            case 'ai-voice':
                showAIVoiceMessage(step.text);
                break;
            case 'user-voice':
                showUserVoiceMessage(step.text);
                break;
            case 'ai-processing':
                showAIProcessing(step.duration);
                break;
            case 'results':
                showResults();
                break;
        }
    }, step.delay);
}

function showAIVoiceMessage(text) {
    // Show voice indicator
    voiceIndicator.classList.add('active');

    // Simulate voice speaking duration
    const speakingDuration = Math.max(2000, text.length * 40);

    setTimeout(() => {
        // Hide voice indicator
        voiceIndicator.classList.remove('active');

        // Add message to conversation
        addMessage('ai', text);

        // Move to next step
        currentStep++;
        processNextStep();
    }, speakingDuration);
}

function showUserVoiceMessage(text) {
    // Show voice indicator briefly (user speaking)
    voiceIndicator.classList.add('active');
    voiceIndicator.querySelector('.status-text').textContent = 'You are speaking...';
    voiceIndicator.querySelector('.nova-badge').textContent = '🎤 Listening';

    // Simulate user speaking duration
    const speakingDuration = Math.max(1500, text.length * 35);

    setTimeout(() => {
        // Hide voice indicator
        voiceIndicator.classList.remove('active');
        voiceIndicator.querySelector('.status-text').textContent = 'Speaking...';
        voiceIndicator.querySelector('.nova-badge').textContent = '🎤 Amazon Nova Sonic';

        // Add message to conversation
        addMessage('user', text);

        // Move to next step
        currentStep++;
        processNextStep();
    }, speakingDuration);
}

function showAIProcessing(duration) {
    // Show AI processing indicator
    aiProcessing.classList.add('active');

    setTimeout(() => {
        // Hide processing indicator
        aiProcessing.classList.remove('active');

        // Move to next step
        currentStep++;
        processNextStep();
    }, duration);
}

function showResults() {
    // Show results panel
    resultsPanel.classList.add('active');

    // Scroll to results
    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function addMessage(type, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const avatar = document.createElement('div');
    avatar.className = `avatar ${type}-avatar`;
    avatar.textContent = type === 'user' ? 'U' : 'AI';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const label = document.createElement('div');
    label.className = 'message-label';
    label.textContent = type === 'user' ? 'You (via voice)' : 'AI Diet Doctor (via voice)';

    const messageText = document.createElement('p');
    messageText.className = 'message-text';
    messageText.textContent = text;

    bubble.appendChild(label);
    bubble.appendChild(messageText);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);

    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// Smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
