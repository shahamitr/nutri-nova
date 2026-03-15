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
let doctorVoice = null;
let userVoice = null;

// Pre-load distinct voices: female for Dr. Nova, male for user
function loadVoices() {
    const voices = speechSynthesis.getVoices();
    const enVoices = voices.filter(v => v.lang.startsWith('en'));

    // Doctor voice — prefer female-sounding
    doctorVoice = enVoices.find(v => /female|zira|samantha|karen|fiona|victoria|susan/i.test(v.name))
        || enVoices[0] || null;

    // User voice — prefer male-sounding, and different from doctor
    userVoice = enVoices.find(v => /male|david|mark|james|daniel|george|richard/i.test(v.name) && v !== doctorVoice)
        || enVoices.find(v => v !== doctorVoice)
        || doctorVoice;
}

if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
}
loadVoices();

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
    speechSynthesis.cancel();
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

    // Show bubble immediately and type text in sync with speech
    const { bubble, msgEl } = addLiveMessage('ai', step.text);
    const typer = typeText(msgEl, step.text);

    let speechDone = false;
    let typeDone = false;

    function finish() {
        if (speechDone && typeDone) {
            voiceIndicator.classList.remove('active');
            if (step.step) markStep(step.step);
            currentStep++;
            processNextStep();
        }
    }

    typer.then(() => { typeDone = true; finish(); });

    const utterance = new SpeechSynthesisUtterance(step.text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    if (doctorVoice) utterance.voice = doctorVoice;

    utterance.onend = () => { speechDone = true; finish(); };
    utterance.onerror = () => { speechDone = true; finish(); };

    speechSynthesis.speak(utterance);
}

function showUserVoice(step) {
    voiceIndicator.classList.add('active');
    document.getElementById('voice-badge-text').textContent = 'Listening';
    document.getElementById('voice-status-desc').textContent = 'You are speaking...';

    // Show bubble immediately and type text in sync with speech
    const { bubble, msgEl } = addLiveMessage('user', step.text);
    const typer = typeText(msgEl, step.text);

    let speechDone = false;
    let typeDone = false;

    function finish() {
        if (speechDone && typeDone) {
            voiceIndicator.classList.remove('active');
            if (step.step) markStep(step.step);
            currentStep++;
            processNextStep();
        }
    }

    typer.then(() => { typeDone = true; finish(); });

    const utterance = new SpeechSynthesisUtterance(step.text);
    utterance.rate = 1.0;
    utterance.pitch = 0.85;
    if (userVoice) utterance.voice = userVoice;

    utterance.onend = () => { speechDone = true; finish(); };
    utterance.onerror = () => { speechDone = true; finish(); };

    speechSynthesis.speak(utterance);
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

    // Set dynamic date on letterpad
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const dateEl = document.getElementById('lp-date');
    const sigDateEl = document.getElementById('lp-sig-date');
    if (dateEl) dateEl.textContent = dateStr;
    if (sigDateEl) sigDateEl.textContent = dateStr;

    // Bind restart
    const restartBtn = document.getElementById('restart-demo');
    if (restartBtn) {
        restartBtn.onclick = restartConsultation;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Trigger scroll animations after a brief delay
    setTimeout(initScrollAnimations, 100);
}

// Scroll-triggered animations for results cards
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.anim-card').forEach(card => observer.observe(card));
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


// Create a message bubble immediately (empty) for live typing effect
function addLiveMessage(type, fullText) {
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
    msg.className = 'msg-text typing-cursor';
    msg.textContent = '';

    bubble.appendChild(label);
    bubble.appendChild(msg);
    div.appendChild(avatar);
    div.appendChild(bubble);

    messagesContainer.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'end' });

    return { bubble: div, msgEl: msg };
}

// Typewriter effect — resolves when all characters are printed
function typeText(el, text) {
    return new Promise(resolve => {
        let i = 0;
        const speed = Math.max(20, Math.min(45, 3000 / text.length)); // adaptive speed
        function tick() {
            if (i < text.length) {
                el.textContent = text.slice(0, i + 1);
                i++;
                el.closest('.message').scrollIntoView({ behavior: 'smooth', block: 'end' });
                setTimeout(tick, speed);
            } else {
                el.classList.remove('typing-cursor');
                resolve();
            }
        }
        tick();
    });
}
