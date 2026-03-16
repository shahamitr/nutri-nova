'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/* ───── tiny reusable SVG icons (inline, no deps) ───── */

const IconMic = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a4 4 0 00-4 4v6a4 4 0 008 0V5a4 4 0 00-4-4z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 01-14 0v-1M12 18v4m-3 0h6" />
  </svg>
);

const IconBrain = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3a3.75 3.75 0 00-2.6 6.45A4.5 4.5 0 003 13.5 4.5 4.5 0 007.5 18h.75m6-15a3.75 3.75 0 012.6 6.45A4.5 4.5 0 0021 13.5a4.5 4.5 0 01-4.5 4.5H15" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
  </svg>
);

const IconHeart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.172 5.172a4.004 4.004 0 015.656 0L12 8.344l3.172-3.172a4.004 4.004 0 115.656 5.656L12 19.656l-8.828-8.828a4.004 4.004 0 010-5.656z" />
  </svg>
);

const IconChart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l4-6 4 4 5-8" />
  </svg>
);

const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
  </svg>
);

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
  </svg>
);

/* ───── animated counter ───── */
function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(end / 40);
    const id = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(id); }
      else setVal(start);
    }, 30);
    return () => clearInterval(id);
  }, [end]);
  return <>{val.toLocaleString()}{suffix}</>;
}

/* ───── Doctor SVG illustration ───── */
const DoctorIllustration = () => (
  <svg viewBox="0 0 400 480" className="w-full max-w-sm mx-auto" xmlns="http://www.w3.org/2000/svg">
    {/* soft glow */}
    <defs>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#0d9488" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="200" cy="440" rx="140" ry="18" fill="#e2e8f0" />
    <circle cx="200" cy="240" r="160" fill="url(#glow)" />
    {/* body / coat */}
    <path d="M140 280 C140 260, 160 220, 200 210 C240 220, 260 260, 260 280 L260 430 C260 440, 250 450, 240 450 L160 450 C150 450, 140 440, 140 430Z" fill="white" stroke="#cbd5e1" strokeWidth="2" />
    {/* coat lapels */}
    <path d="M180 210 L200 280 L170 280Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
    <path d="M220 210 L200 280 L230 280Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
    {/* stethoscope */}
    <path d="M175 250 C160 270, 155 310, 180 320 C200 328, 210 310, 210 300" fill="none" stroke="#0d9488" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="210" cy="298" r="6" fill="#0d9488" />
    <circle cx="175" cy="248" r="4" fill="#0d9488" />
    {/* head */}
    <ellipse cx="200" cy="170" rx="52" ry="60" fill="#fde8d0" />
    {/* hair */}
    <path d="M148 160 C148 120, 170 95, 200 90 C230 95, 252 120, 252 160 C252 140, 240 120, 200 115 C160 120, 148 140, 148 160Z" fill="#374151" />
    {/* eyes */}
    <ellipse cx="182" cy="170" rx="5" ry="5.5" fill="#1e293b" />
    <ellipse cx="218" cy="170" rx="5" ry="5.5" fill="#1e293b" />
    <circle cx="183.5" cy="168.5" r="1.5" fill="white" />
    <circle cx="219.5" cy="168.5" r="1.5" fill="white" />
    {/* smile */}
    <path d="M188 190 Q200 202, 212 190" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
    {/* name badge */}
    <rect x="170" y="290" width="60" height="24" rx="4" fill="#0d9488" />
    <text x="200" y="306" textAnchor="middle" fill="white" fontSize="10" fontWeight="600" fontFamily="system-ui">Dr. Nova</text>
    {/* pocket */}
    <rect x="220" y="340" width="25" height="30" rx="3" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
    {/* clipboard in hand */}
    <rect x="265" y="320" width="40" height="55" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    <line x1="275" y1="335" x2="295" y2="335" stroke="#0d9488" strokeWidth="2" />
    <line x1="275" y1="345" x2="290" y2="345" stroke="#94a3b8" strokeWidth="1.5" />
    <line x1="275" y1="353" x2="293" y2="353" stroke="#94a3b8" strokeWidth="1.5" />
    <line x1="275" y1="361" x2="285" y2="361" stroke="#94a3b8" strokeWidth="1.5" />
    {/* cross icon on coat */}
    <line x1="200" y1="380" x2="200" y2="400" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />
    <line x1="190" y1="390" x2="210" y2="390" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* ───── PAGE ───── */
export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-lg">N</span>
            <span className="text-xl font-semibold tracking-tight">NutriVoice <span className="text-teal-600">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-teal-600 transition">Features</a>
            <a href="#how-it-works" className="hover:text-teal-600 transition">How It Works</a>
            <a href="#technology" className="hover:text-teal-600 transition">Technology</a>
            <a href="#testimonials" className="hover:text-teal-600 transition">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-teal-600 transition">Log In</Link>
            <Link href="/signup" className="text-sm font-medium bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 transition shadow-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              Powered by Amazon Nova AI
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              Your Personal<br />
              <span className="text-teal-600">AI Dietitian</span><br />
              Is Ready to See You
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-lg">
              Have a real-time voice conversation with Dr. Nova, your AI-powered nutrition specialist.
              Get personalized meal plans, health insights, and ongoing guidance — all through natural speech.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="inline-flex items-center gap-2 bg-teal-600 text-white px-7 py-3.5 rounded-xl text-base font-semibold hover:bg-teal-700 transition shadow-lg shadow-teal-600/20">
                Start Free Consultation
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
              <a href="#how-it-works" className="inline-flex items-center gap-2 bg-gray-50 text-gray-700 px-7 py-3.5 rounded-xl text-base font-semibold hover:bg-gray-100 transition border border-gray-200">
                See How It Works
              </a>
            </div>
            {/* trust badges */}
            <div className="flex items-center gap-6 mt-10 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <IconShield />
                <span>HIPAA-Aware</span>
              </div>
              <div className="flex items-center gap-1.5">
                <IconClock />
                <span>24/7 Available</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-teal-100 rounded-full blur-3xl opacity-40" />
            <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-emerald-100 rounded-full blur-3xl opacity-40" />
            <DoctorIllustration />
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6 py-12 text-center">
          {[
            { end: 10000, suffix: '+', label: 'Meal Plans Generated' },
            { end: 98, suffix: '%', label: 'User Satisfaction' },
            { end: 50, suffix: '+', label: 'Dietary Profiles' },
            { end: 24, suffix: '/7', label: 'Always Available' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl font-bold text-teal-600"><Counter end={s.end} suffix={s.suffix} /></div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2">Features</p>
            <h2 className="text-4xl font-bold tracking-tight">Everything You Need for Better Nutrition</h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">Dr. Nova combines cutting-edge AI with clinical nutrition knowledge to deliver a consultation experience that feels genuinely personal.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <IconMic />, title: 'Voice-First Consultation', desc: 'Speak naturally with Dr. Nova using real-time voice powered by Amazon Nova Sonic. No typing needed — just talk.' },
              { icon: <IconBrain />, title: 'AI-Powered Personalization', desc: 'Amazon Nova Lite analyzes your health profile, preferences, and goals to create truly personalized nutrition plans.' },
              { icon: <IconHeart />, title: 'Comprehensive Health Tracking', desc: 'Monitor BMI, weight trends, dietary adherence, and wellness metrics with beautiful visual dashboards.' },
              { icon: <IconChart />, title: 'Smart Meal Planning', desc: 'Get detailed daily meal plans with macros, calories, recipes, and grocery lists tailored to your dietary needs.' },
              { icon: <IconShield />, title: 'Secure & Private', desc: 'TOTP two-factor authentication, encrypted data storage, and strict access controls protect your health information.' },
              { icon: <IconClock />, title: 'Conversation Memory', desc: 'Dr. Nova remembers your history, preferences, and progress across sessions for truly continuous care.' },
            ].map((f, i) => (
              <div key={i} className="group bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-xl hover:shadow-teal-600/5 hover:border-teal-100 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2">How It Works</p>
            <h2 className="text-4xl font-bold tracking-tight">Your Consultation in 3 Simple Steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { num: '01', title: 'Tell Dr. Nova About Yourself', desc: 'Share your health goals, dietary preferences, allergies, and lifestyle through a natural voice conversation.' },
              { num: '02', title: 'Receive Your Personalized Plan', desc: 'Dr. Nova analyzes your profile using Amazon Nova AI and generates a comprehensive nutrition plan with meals, macros, and recommendations.' },
              { num: '03', title: 'Track, Adapt & Thrive', desc: 'Log meals, track progress, earn achievements, and have follow-up conversations. Your plan evolves as you do.' },
            ].map((s, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <span className="text-6xl font-black text-teal-100 absolute top-4 right-6">{s.num}</span>
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold mb-3 mt-6">{s.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TECHNOLOGY ─── */}
      <section id="technology" className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2">Technology</p>
            <h2 className="text-4xl font-bold tracking-tight mb-6">Built on Amazon Nova Intelligence</h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              NutriVoice AI leverages the latest Amazon Nova foundation models to deliver a consultation experience
              that rivals human dietitians — with the consistency and availability only AI can provide.
            </p>
            <div className="space-y-5">
              {[
                { label: 'Amazon Nova Sonic', desc: 'Real-time speech-to-speech model for natural voice conversations with sub-second latency.' },
                { label: 'Amazon Nova Lite', desc: 'Multimodal reasoning engine that analyzes health data and generates personalized nutrition plans.' },
                { label: 'Conversation Memory', desc: 'Persistent context across sessions so Dr. Nova remembers your journey and adapts recommendations.' },
              ].map((t, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-2.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold">{t.label}</h4>
                    <p className="text-gray-500 text-sm">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-3xl p-10 border border-gray-100">
            <div className="space-y-4">
              {/* mock conversation */}
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0">Dr</div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 text-sm shadow-sm border border-gray-100 max-w-xs">
                  Good morning! I&apos;m Dr. Nova. What&apos;s your main health goal today?
                </div>
              </div>
              <div className="flex gap-3 items-start justify-end">
                <div className="bg-teal-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm max-w-xs">
                  I want to lose weight but I&apos;m always tired and have no energy.
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0">You</div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0">Dr</div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 text-sm shadow-sm border border-gray-100 max-w-xs">
                  Low energy during weight loss is very common. Let me design a plan that boosts your metabolism while keeping you energized. First, tell me about your typical meals...
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 pl-11">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                Dr. Nova is listening via Amazon Nova Sonic...
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2">Testimonials</p>
            <h2 className="text-4xl font-bold tracking-tight">What Our Users Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { quote: "Dr. Nova understood my dietary restrictions better than any app I've tried. The voice interaction feels like talking to a real nutritionist.", name: 'Sarah M.', role: 'Lost 15 lbs in 8 weeks' },
              { quote: "As a busy professional, I love that I can just talk to Dr. Nova while cooking. The meal plans are practical and actually delicious.", name: 'James K.', role: 'Improved energy levels' },
              { quote: "The gamification keeps me motivated, and the AI remembers everything from our previous conversations. It truly feels like ongoing care.", name: 'Priya R.', role: 'Managing Type 2 Diabetes' },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-teal-600">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-teal-600 to-emerald-600 rounded-3xl px-8 py-16 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Meet Your AI Dietitian?</h2>
              <p className="text-teal-100 mb-8 max-w-xl mx-auto">
                Join thousands of users who have transformed their nutrition with personalized,
                voice-powered consultations. Your first session is free.
              </p>
              <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-teal-700 px-8 py-4 rounded-xl text-base font-semibold hover:bg-teal-50 transition shadow-lg">
                Start Your Free Consultation
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm">N</span>
            <span className="font-semibold">NutriVoice AI</span>
          </div>
          <p className="text-sm text-gray-400">Built with Amazon Nova Sonic &amp; Nova Lite for the AWS Hackathon 2025</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/login" className="hover:text-teal-600 transition">Login</Link>
            <Link href="/signup" className="hover:text-teal-600 transition">Sign Up</Link>
            <a href="#features" className="hover:text-teal-600 transition">Features</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
