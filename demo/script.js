// NutriVoice AI - Doctor Consultation Demo

const conversationFlow = [
    {
        type: 'ai-voice',
        text: "Good morning! I'm Dr. Nova, your AI dietitian. I'll be conducting your nutrition consultation today. Let's start — what's your main health goal?",
        delay: 800,
        step: 'step-greeting'
    },
    {
        type: 'user-voice',
        text: "I want to lose about 10 pounds, but I'm always tired and have no energy throughout the day.",
        delay: 2500,
        step: 'step-goals'
    },
    { type: 'ai-processing', duration: 2200 },
    {
        type: 'ai-voice',
        text: "I understand — low energy during weight loss is very common and something we can address. Let me gather some details. How old are you?",
        delay: 1200
    },
    {
        type: 'user-voice',
        text: "I'm 32 years old.",
        delay: 1800,
        step: 'step-profile'
    },
    { type: 'ai-processing', duration: 1500 },
    {
        type: 'ai-voice',
        text: "Thank you. And what's your current weight and height?",
        delay: 1000
    },
    {
        type: 'user-voice',
        text: "I'm 5 feet 6 inches tall and weigh 175 pounds.",
        delay: 2200
    },
    { type: 'ai-processing', duration: 1800 },
    {
        type: 'ai-voice',
        text: "Your BMI is 27.3, which falls in the overweight range. Now, how would you describe your activity level — sedentary, lightly active, moderately active, or very active?",
        delay: 1200,
        step: 'step-activity'
    },
    {
        type: 'user-voice',
        text: "Lightly active. I walk about 30 minutes most days but don't do intense workouts.",
        delay: 2500
    },
    { type: 'ai-processing', duration: 1800 },
    {
        type: 'ai-voice',
        text: "That's a solid foundation. One more question — do you have any dietary restrictions or food allergies?",
        delay: 1200,
        step: 'step-diet'
    },
    {
        type: 'user-voice',
        text: "No allergies, but I prefer to avoid red meat.",
        delay: 2000
    },
    { type: 'ai-processing', duration: 2800 },
    {
        type: 'ai-voice',
        text: "I have everything I need. Based on your profile — age, BMI, activity level, and preferences — I'm now generating your comprehensive nutrition plan with meals, hydration schedule, and lifestyle recommendations...",
        delay: 1500,
        step: 'step-plan'
    },
    { type: 'ai-processing', duration: 3200 },
    { type: 'results', delay: 800 }
];

let currentStep = 0;
let messagesContainer, voiceIndicator, aiProcessing;

document.addEventListener('DOMContentLoaded', () => {
    messagesContainer = document.getElementById('conversation-messages');
    voiceIndicator = document.getElementById('voice-indicator');
    aiProcessing = document.getElementById('ai-processing');

    document.getElementById('start-demo').addEventListener('click', startConsultation);
});

function startConsultation() {
    document.getElementById('hero-section').style.display = 'none';
    document.getElementById('consultation-section').style.display = 'block';
    currentStep = 0;
    processNextStep();
}

function restartConsultation() {
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('consultation-section').style.display = 'none';
    document.getElementById('hero-section').style.display = 'flex';
    messagesContainer.innerHTML = '';
    voiceIndicator.classList.remove('active');
    aiProcessing.classList.remove('active');
    currentStep = 0;

    // Reset progress steps
    document.querySelectorAll('.progress-step').forEach(s => {
        s.classList.remove('completed', 'active');
    });
    document.getElementById('step-greeting').classList.add('completed');
}

function markStep(stepId) {
    if (!stepId) return;
    const el = document.getElementById(stepId);
    if (!el) return;

    // Mark all previous as completed
    const steps = Array.from(document.querySelectorAll('.progress-step'));
    let found = false;
    steps.forEach(s => {
        s.classList.remove('active');
        if (s.id === stepId) {
            s.classList.add('completed');
            found = true;
        }
    });

    // Mark next one as active
    const idx = steps.findIndex(s => s.id === stepId);
    if (idx < steps.length - 1) {
        steps[idx + 1].classList.add('active');
    }
}

function processNextStep() {
    if (currentStep >= conversationFlow.length) return;
    const step = conversationFlow[currentStep];

    setTimeout(() => {
        switch (step.type) {
            case 'ai-voice': showAIVoice(step); break;
            case 'user-voice': showUserVoice(step); break;
            case 'ai-processing': showProcessing(step.duration); break;
            case 'results': showResults(); break;
        }
    }, step.delay);
}

function showAIVoice(step) {
    voiceIndicator.classList.add('active');
    document.getElementById('voice-badge-text').textContent = 'Nova Sonic';
    document.getElementById('voice-status-desc').textContent = 'Dr. Nova is speaking...';

    const duration = Math.max(2000, step.text.length * 35);

    setTimeout(() => {
        voiceIndicator.classList.remove('active');
        addMessage('ai', step.text);
        if (step.step) markStep(step.step);
        currentStep++;
        processNextStep();
    }, duration);
}

function showUserVoice(step) {
    voiceIndicator.classList.add('active');
    document.getElementById('voice-badge-text').textContent = 'Listening';
    document.getElementById('voice-status-desc').textContent = 'You are speaking...';

    const duration = Math.max(1500, step.text.length * 30);

    setTimeout(() => {
        voiceIndicator.classList.remove('active');
        addMessage('user', step.text);
        if (step.step) markStep(step.step);
        currentStep++;
        processNextStep();
    }, duration);
}

function showProcessing(duration) {
    aiProcessing.classList.add('active');

    setTimeout(() => {
        aiProcessing.classList.remove('active');
        currentStep++;
        processNextStep();
    }, duration);
}

function showResults() {
    document.getElementById('consultation-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';

    // Bind restart
    const restartBtn = document.getElementById('restart-demo');
    if (restartBtn) {
        restartBtn.onclick = restartConsultation;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addMessage(type, text) {
    const div = document.createElement('div');
    div.className = `message ${type}`;

    const avatar = document.createElement('div');
    avatar.className = `msg-avatar ${type}`;
    avatar.textContent = type === 'user' ? 'You' : 'Dr';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    const label = document.createElement('div');
    label.className = 'msg-label';
    label.textContent = type === 'user' ? 'You (via voice)' : 'Dr. Nova (via voice)';

    const msg = document.createElement('p');
    msg.className = 'msg-text';
    msg.textContent = text;

    bubble.appendChild(label);
    bubble.appendChild(msg);
    div.appendChild(avatar);
    div.appendChild(bubble);

    messagesContainer.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'end' });
}
