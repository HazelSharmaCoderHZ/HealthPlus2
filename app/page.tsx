'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/* ─── tiny hook: count up when visible ─── */
function useCountUp(target: number, duration = 2000) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        setVal(Math.floor(p * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { val, ref };
}

/* ─── scroll reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ─── CSS-drawn Doctor character ─── */
function DoctorCharacter() {
  return (
    <div style={{ position: 'relative', width: 320, height: 520 }}>
      {/* floating glow behind doctor */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: 280, height: 280,
        background: 'radial-gradient(circle, rgba(37,99,235,0.13) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(20px)',
      }} />

      {/* ── DOCTOR SVG CHARACTER ── */}
      <svg
        viewBox="0 0 320 520"
        width="320" height="520"
        style={{ position: 'relative', zIndex: 2, animation: 'doctorFloat 4s ease-in-out infinite' }}
      >
        {/* Shadow on floor */}
        <ellipse cx="160" cy="510" rx="75" ry="10" fill="rgba(37,99,235,0.08)" />

        {/* Lab coat body */}
        <rect x="88" y="210" width="144" height="200" rx="18" fill="#ffffff" stroke="#dbeafe" strokeWidth="1.5" />
        {/* Coat lapels */}
        <path d="M160 215 L130 260 L115 260 L140 210Z" fill="#e0f2fe" />
        <path d="M160 215 L190 260 L205 260 L180 210Z" fill="#e0f2fe" />
        {/* Blue scrubs underneath */}
        <rect x="115" y="258" width="90" height="60" rx="4" fill="#2563eb" opacity="0.12" />
        {/* Stethoscope */}
        <path d="M148 230 Q135 265 138 285 Q141 305 155 308 Q170 311 175 295 Q178 280 168 268" fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="148" cy="228" r="7" fill="none" stroke="#2563eb" strokeWidth="3" />
        <circle cx="168" cy="268" r="9" fill="#2563eb" opacity="0.2" stroke="#2563eb" strokeWidth="2" />
        {/* Coat pocket */}
        <rect x="185" y="248" width="28" height="22" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
        <rect x="193" y="242" width="6" height="10" rx="1" fill="#2563eb" opacity="0.7" />
        <rect x="201" y="243" width="4" height="8" rx="1" fill="#60a5fa" opacity="0.7" />

        {/* Torso / neck */}
        <rect x="143" y="178" width="34" height="40" rx="12" fill="#fde8d8" />

        {/* HEAD */}
        <ellipse cx="160" cy="150" rx="52" ry="56" fill="#fde8d8" />
        {/* Ear left */}
        <ellipse cx="108" cy="152" rx="9" ry="13" fill="#fcd5b5" />
        <ellipse cx="109" cy="152" rx="5" ry="9" fill="#f5c29a" />
        {/* Ear right */}
        <ellipse cx="212" cy="152" rx="9" ry="13" fill="#fcd5b5" />
        <ellipse cx="211" cy="152" rx="5" ry="9" fill="#f5c29a" />

        {/* Hair */}
        <ellipse cx="160" cy="102" rx="52" ry="28" fill="#2c1810" />
        <ellipse cx="160" cy="115" rx="52" ry="15" fill="#2c1810" />
        {/* Hair highlight */}
        <ellipse cx="145" cy="100" rx="18" ry="8" fill="#3d2415" opacity="0.6" />

        {/* Eyes */}
        <ellipse cx="140" cy="148" rx="10" ry="11" fill="white" />
        <ellipse cx="180" cy="148" rx="10" ry="11" fill="white" />
        <ellipse cx="141" cy="149" rx="6" ry="7" fill="#1e293b" />
        <ellipse cx="181" cy="149" rx="6" ry="7" fill="#1e293b" />
        <circle cx="143" cy="147" r="2" fill="white" />
        <circle cx="183" cy="147" r="2" fill="white" />
        {/* Eyebrows */}
        <path d="M129 134 Q140 128 151 133" stroke="#2c1810" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M169 133 Q180 128 191 134" stroke="#2c1810" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Nose */}
        <path d="M157 158 Q155 168 158 172 Q162 174 166 172 Q169 168 163 158" fill="none" stroke="#e8b89a" strokeWidth="1.5" strokeLinecap="round" />

        {/* Smile */}
        <path d="M146 180 Q160 192 174 180" stroke="#c97b5a" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Glasses */}
        <rect x="126" y="140" width="28" height="20" rx="8" fill="none" stroke="#2563eb" strokeWidth="2" />
        <rect x="166" y="140" width="28" height="20" rx="8" fill="none" stroke="#2563eb" strokeWidth="2" />
        <line x1="154" y1="150" x2="166" y2="150" stroke="#2563eb" strokeWidth="1.5" />
        <line x1="108" y1="150" x2="126" y2="150" stroke="#2563eb" strokeWidth="1.5" />
        <line x1="194" y1="150" x2="212" y2="150" stroke="#2563eb" strokeWidth="1.5" />

        {/* ── LEFT ARM (holding phone) ── */}
        {/* Upper arm */}
        <rect x="60" y="215" width="32" height="85" rx="16" fill="#ffffff" stroke="#dbeafe" strokeWidth="1.5" />
        {/* Forearm angled up */}
        <rect x="52" y="160" width="28" height="70" rx="14" fill="#fde8d8" transform="rotate(-15 66 195)" />
        {/* Hand */}
        <ellipse cx="58" cy="148" rx="16" ry="20" fill="#fde8d8" transform="rotate(-10 58 148)" />
        {/* Fingers suggestion */}
        <path d="M44 140 Q40 130 44 122" stroke="#f0c5a0" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M50 136 Q46 124 51 116" stroke="#f0c5a0" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M57 134 Q55 121 61 115" stroke="#f0c5a0" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M64 135 Q63 122 70 117" stroke="#f0c5a0" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* ── PHONE in left hand ── */}
        <rect x="30" y="90" width="56" height="100" rx="10" fill="#0f172a" />
        <rect x="33" y="93" width="50" height="94" rx="8" fill="#1e3a5f" />
        {/* Phone screen glow */}
        <rect x="33" y="93" width="50" height="94" rx="8" fill="url(#phoneGlow)" opacity="0.9" />
        {/* Screen content */}
        <rect x="36" y="100" width="44" height="8" rx="3" fill="white" opacity="0.9" />
        <rect x="36" y="113" width="30" height="5" rx="2" fill="#60a5fa" opacity="0.8" />
        {/* Mini chart on phone */}
        <polyline points="36,140 43,133 50,136 57,124 64,127 73,115 80,118" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M36,140 L43,133 L50,136 L57,124 L64,127 L73,115 L80,118 L80,148 L36,148Z" fill="rgba(37,99,235,0.2)" />
        {/* Stat rows on phone */}
        <rect x="36" y="153" width="18" height="4" rx="2" fill="white" opacity="0.5" />
        <rect x="57" y="153" width="22" height="4" rx="2" fill="#34d399" opacity="0.7" />
        <rect x="36" y="162" width="25" height="4" rx="2" fill="white" opacity="0.3" />
        <rect x="64" y="162" width="15" height="4" rx="2" fill="#60a5fa" opacity="0.7" />
        {/* Phone notch */}
        <rect x="48" y="95" width="20" height="5" rx="2.5" fill="#0f172a" />
        {/* Phone home indicator */}
        <rect x="48" y="182" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.3)" />

        {/* ── RIGHT ARM relaxed ── */}
        <rect x="228" y="215" width="32" height="90" rx="16" fill="#ffffff" stroke="#dbeafe" strokeWidth="1.5" />
        <rect x="232" y="290" width="26" height="55" rx="13" fill="#fde8d8" />
        <ellipse cx="245" cy="352" rx="15" ry="18" fill="#fde8d8" />

        {/* Legs */}
        <rect x="115" y="400" width="45" height="100" rx="16" fill="#2563eb" opacity="0.85" />
        <rect x="160" y="400" width="45" height="100" rx="16" fill="#1d4ed8" opacity="0.85" />
        {/* Shoes */}
        <ellipse cx="137" cy="500" rx="30" ry="12" fill="#1e293b" />
        <ellipse cx="182" cy="500" rx="30" ry="12" fill="#1e293b" />
        {/* Shoe highlight */}
        <ellipse cx="128" cy="496" rx="12" ry="5" fill="rgba(255,255,255,0.15)" />
        <ellipse cx="173" cy="496" rx="12" ry="5" fill="rgba(255,255,255,0.15)" />

        {/* Name tag on coat */}
        <rect x="100" y="250" width="52" height="24" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
        <rect x="104" y="255" width="20" height="3" rx="1.5" fill="#2563eb" opacity="0.6" />
        <rect x="104" y="261" width="32" height="2.5" rx="1" fill="#93c5fd" opacity="0.8" />
        <rect x="104" y="266" width="26" height="2.5" rx="1" fill="#93c5fd" opacity="0.5" />

        {/* ── floating notification bubbles ── */}
        {/* bubble 1 */}
        <g style={{ animation: 'bubble1 3s ease-in-out infinite' }}>
          <rect x="218" y="120" width="88" height="32" rx="10" fill="white" filter="url(#shadow)" />
          <circle cx="233" cy="136" r="8" fill="#dbeafe" />
          <text x="233" y="140" textAnchor="middle" fontSize="9" fill="#2563eb">💧</text>
          <rect x="245" y="130" width="38" height="4" rx="2" fill="#bfdbfe" />
          <rect x="245" y="138" width="25" height="3" rx="1.5" fill="#e0f2fe" />
        </g>
        {/* bubble 2 */}
        <g style={{ animation: 'bubble2 3.5s ease-in-out infinite' }}>
          <rect x="220" y="168" width="88" height="32" rx="10" fill="#eff6ff" filter="url(#shadow)" />
          <circle cx="235" cy="184" r="8" fill="#bfdbfe" />
          <text x="235" y="188" textAnchor="middle" fontSize="9" fill="#2563eb">❤</text>
          <rect x="247" y="178" width="42" height="4" rx="2" fill="#93c5fd" />
          <rect x="247" y="186" width="30" height="3" rx="1.5" fill="#bfdbfe" />
        </g>

        <defs>
          <radialGradient id="phoneGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1e40af" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
          </radialGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(37,99,235,0.15)" />
          </filter>
        </defs>
      </svg>

      {/* Floating health stat pill */}
      <div style={{
        position: 'absolute', top: 40, right: -30, zIndex: 10,
        background: '#2563eb', color: 'white', borderRadius: 12, padding: '8px 14px',
        fontSize: 12, fontWeight: 700, boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
        animation: 'statPill 3s ease-in-out infinite',
        whiteSpace: 'nowrap',
      }}>
        ✓ 8,240 steps today
      </div>
      <div style={{
        position: 'absolute', bottom: 100, right: -40, zIndex: 10,
        background: 'white', color: '#2563eb', border: '1.5px solid #bfdbfe',
        borderRadius: 12, padding: '8px 14px', fontSize: 12, fontWeight: 700,
        boxShadow: '0 8px 24px rgba(37,99,235,0.12)',
        animation: 'statPill2 3.5s ease-in-out infinite',
        whiteSpace: 'nowrap',
      }}>
        🔗 3 friends synced
      </div>
    </div>
  );
}

/* ─── STEPS (hooks called at component level, not inside map) ─── */
const STEPS_DATA = [
  { num: '01', icon: '🎯', title: 'Start Tracking', desc: 'Log meals with AI scanning, track sleep, hydration, and daily habits in seconds — not minutes. Everything in one place.' },
  { num: '02', icon: '🤝', title: 'Share & Connect', desc: 'Invite family, trainers, or partners. Real-time shared dashboards make accountability effortless and even fun.' },
  { num: '03', icon: '📈', title: 'Improve Together', desc: 'Analyze patterns across your group, celebrate wins, and course-correct with AI-powered insights tailored to you.' },
];

function StepItem({ step, index }: { step: typeof STEPS_DATA[0]; index: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      display: 'flex', gap: '2rem', position: 'relative',
      paddingBottom: index < 2 ? '3rem' : 0,
      transition: `opacity .8s ease ${index * 150}ms, transform .8s ease ${index * 150}ms`,
      opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px)',
    }}>
      {index < 2 && <div className="step-line" />}
      <div style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37,99,235,0.3)',
        }}>
          <span style={{ fontSize: '1.4rem' }}>{step.icon}</span>
        </div>
      </div>
      <div style={{ paddingTop: '.8rem' }}>
        <div style={{ fontSize: '.7rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#2563eb', fontWeight: 700, marginBottom: '.3rem' }}>{step.num}</div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '.5rem' }}>{step.title}</h3>
        <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: '.9rem' }}>{step.desc}</p>
      </div>
    </div>
  );
}

function StepsSection() {
  return (
    <div style={{ position: 'relative' }}>
      {STEPS_DATA.map((s, i) => <StepItem key={s.num} step={s} index={i} />)}
    </div>
  );
}

/* ─── FEATURE CARD ─── */
function FeatureCard({ icon, title, desc, delay = 0 }: { icon: string; title: string; desc: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        background: 'white',
        border: '1.5px solid #e0eaff',
        borderRadius: 20,
        padding: '2rem',
        boxShadow: '0 4px 24px rgba(37,99,235,0.06)',
        transition: `opacity 0.7s ${delay}ms ease, transform 0.7s ${delay}ms ease, box-shadow 0.3s ease`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(37,99,235,0.15)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLDivElement).style.borderColor = '#93c5fd';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(37,99,235,0.06)';
        (e.currentTarget as HTMLDivElement).style.transform = visible ? 'translateY(0)' : 'translateY(32px)';
        (e.currentTarget as HTMLDivElement).style.borderColor = '#e0eaff';
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem', marginBottom: '1rem',
      }}>{icon}</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '.4rem', fontFamily: 'var(--font-display)' }}>{title}</div>
      <div style={{ fontSize: '.875rem', color: '#64748b', lineHeight: 1.65 }}>{desc}</div>
    </div>
  );
}

/* ── STAT PILL ── */
function StatPill({ target, suffix = '', label }: { target: number; suffix?: string; label: string }) {
  const { val, ref } = useCountUp(target);
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem,4vw,3rem)',
        fontWeight: 800, color: '#2563eb', lineHeight: 1,
        letterSpacing: '-0.03em',
      }}>
        {val >= 1000 ? val.toLocaleString() : val}{suffix}
      </div>
      <div style={{ fontSize: '.85rem', color: '#64748b', marginTop: '.35rem', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
export default function HomePage() {
  const [splashDone, setSplashDone] = useState(false);
  const [splashLeave, setSplashLeave] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setSplashLeave(true), 2200);
    const t2 = setTimeout(() => setSplashDone(true), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const heroReveal = useReveal();
  const sharedReveal = useReveal();
  const ctaReveal = useReveal();

  return (
    <>
      {/* ── GLOBAL STYLES injected via style tag ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;0,800;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

        :root {
          --font-display: 'Fraunces', Georgia, serif;
          --font-body: 'DM Sans', system-ui, sans-serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font-body); background: #f8faff; color: #0f172a; overflow-x: hidden; }
        ::selection { background: #bfdbfe; }

        @keyframes doctorFloat {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes bubble1 {
          0%,100% { transform: translate(0,0); opacity:1; }
          50% { transform: translate(4px,-6px); opacity:0.85; }
        }
        @keyframes bubble2 {
          0%,100% { transform: translate(0,0); opacity:1; }
          50% { transform: translate(-3px,5px); opacity:0.85; }
        }
        @keyframes statPill {
          0%,100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes statPill2 {
          0%,100% { transform: translateY(0) rotate(1deg); }
          50% { transform: translateY(-10px) rotate(-1deg); }
        }
        @keyframes splashFill {
          0% { width: 0%; }
          60% { width: 70%; }
          90% { width: 92%; }
          100% { width: 100%; }
        }
        @keyframes splashPop {
          0% { transform: scale(0.7) rotate(-8deg); opacity:0; }
          70% { transform: scale(1.08) rotate(2deg); opacity:1; }
          100% { transform: scale(1) rotate(0deg); opacity:1; }
        }
        @keyframes scanLine {
          0% { transform: translateY(0); opacity: 0.6; }
          100% { transform: translateY(80px); opacity: 0; }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes floatDot {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes waveScroll {
          0% { background-position-x: 0; }
          100% { background-position-x: 100vw; }
        }
        @keyframes fadeSlideUp {
          from { opacity:0; transform: translateY(24px); }
          to { opacity:1; transform: translateY(0); }
        }
        @keyframes heartbeat {
          0%,100% { transform: scale(1); }
          14% { transform: scale(1.2); }
          28% { transform: scale(1); }
          42% { transform: scale(1.15); }
          70% { transform: scale(1); }
        }
        @keyframes orbSpin {
          from { transform: rotate(0deg) translateX(120px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
        }

        .nav-link { color: #475569; text-decoration: none; font-size:.9rem; font-weight:500; transition: color .2s; position:relative; }
        .nav-link::after { content:''; position:absolute; bottom:-3px; left:0; width:0; height:1.5px; background:#2563eb; transition:width .25s; }
        .nav-link:hover { color: #2563eb; }
        .nav-link:hover::after { width:100%; }

        .hero-bg-blob {
          position: absolute; border-radius: 50%; filter: blur(70px); pointer-events:none;
        }

        .service-card:hover .service-icon { transform: scale(1.12) rotate(-4deg); }

        /* WAVE separator */
        .wave-sep {
          width:100%; overflow:hidden; line-height:0;
        }
        .wave-sep svg { display:block; }

        /* step line */
        .step-line { position:absolute; left:31px; top:60px; bottom:-60px; width:2px; background: linear-gradient(180deg, #2563eb 0%, #bfdbfe 100%); }
      `}</style>

      {/* ── SPLASH LOADER ── */}
      {!splashDone && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#ffffff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
          opacity: splashLeave ? 0 : 1,
          transform: splashLeave ? 'scale(1.04)' : 'scale(1)',
          pointerEvents: splashLeave ? 'none' : 'all',
        }}>
          {/* Heartbeat icon */}
          <div style={{ animation: 'splashPop 0.6s ease forwards', position: 'relative' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', boxShadow: '0 0 0 0 rgba(37,99,235,0.4)',
              animation: 'heartbeat 1.4s ease infinite',
            }}>❤️</div>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid rgba(37,99,235,0.4)',
              animation: 'pulseRing 1.4s ease infinite',
            }} />
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800,
            color: '#0f172a', letterSpacing: '-0.02em',
          }}>HealthPlus</div>
          {/* Progress bar */}
          <div style={{
            width: 180, height: 3, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
              borderRadius: 99, animation: 'splashFill 2.2s ease forwards',
            }} />
          </div>
          <div style={{ fontSize: '.75rem', color: '#94a3b8', letterSpacing: '.12em', textTransform: 'uppercase' }}>
            Loading your wellness
          </div>
        </div>
      )}

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(37,99,235,0.08)',
        padding: '0 2rem', height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.4rem', animation: 'heartbeat 2s ease infinite' }}>❤️</span>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem',
            color: '#0f172a', letterSpacing: '-0.02em',
          }}>HealthPlus</span>
        </Link>

        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#shared" className="nav-link">Shared Health</a>
          <a href="#how" className="nav-link">How it Works</a>
        </div>

        <Link href="/auth/login">
          <button style={{
            padding: '.55rem 1.4rem', borderRadius: 99, border: '1.5px solid #2563eb',
            background: 'transparent', color: '#2563eb', fontFamily: 'var(--font-body)',
            fontWeight: 600, fontSize: '.9rem', cursor: 'pointer', transition: 'all .25s',
          }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.background = '#2563eb'; b.style.color = '#fff'; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'transparent'; b.style.color = '#2563eb'; }}>
            Sign In
          </button>
        </Link>
      </nav>

      {/* ══════════════════════════════════════════════ */}
      {/* HERO — split layout: text left, doctor right  */}
      {/* ══════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh', background: 'white',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        alignItems: 'center', gap: '2rem',
        padding: '5rem 4rem 2rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background decorations */}
        <div className="hero-bg-blob" style={{
          width: 600, height: 600, top: -200, right: -100,
          background: 'radial-gradient(circle, #eff6ff 0%, #dbeafe 50%, transparent 70%)',
        }} />
        <div className="hero-bg-blob" style={{
          width: 300, height: 300, bottom: 0, left: '30%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)',
        }} />

        {/* Grid dot pattern */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, #2563eb18 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 10%, transparent 80%)',
        }} />

        {/* ── LEFT: copy ── */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '.5rem',
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 99, padding: '.35rem 1rem',
            fontSize: '.78rem', fontWeight: 600, color: '#2563eb',
            letterSpacing: '.1em', textTransform: 'uppercase',
            marginBottom: '1.5rem',
            animation: 'fadeSlideUp 0.8s ease both',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', animation: 'pulseRing 1.5s ease infinite', display: 'inline-block' }} />
            Personal &amp; Shared Health Insights
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.8rem,5.5vw,4.8rem)',
            fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.04em',
            color: '#0f172a',
            animation: 'fadeSlideUp 0.8s ease 0.1s both',
          }}>
            Track.<br />
            Share.<br />
            <em style={{ fontStyle: 'italic', color: '#2563eb' }}>Improve.</em>
          </h1>

          <p style={{
            marginTop: '1.5rem', fontSize: '1.1rem', color: '#475569',
            maxWidth: 460, lineHeight: 1.75, fontWeight: 400,
            animation: 'fadeSlideUp 0.8s ease 0.2s both',
          }}>
            The only wellness platform built for <strong style={{ color: '#1e40af', fontWeight: 600 }}>shared accountability</strong>.
            Real-time health dashboards for individuals, families, and teams — powered by AI.
          </p>

          <div style={{
            display: 'flex', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap',
            animation: 'fadeSlideUp 0.8s ease 0.3s both',
          }}>
            <Link href="/auth/signup">
              <button style={{
                padding: '.85rem 2rem', borderRadius: 99,
                background: '#2563eb', color: 'white', border: 'none',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem',
                cursor: 'pointer', boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
                transition: 'all .25s',
              }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.background = '#1d4ed8'; b.style.boxShadow = '0 8px 32px rgba(37,99,235,0.5)'; b.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.background = '#2563eb'; b.style.boxShadow = '0 4px 20px rgba(37,99,235,0.35)'; b.style.transform = 'translateY(0)'; }}>
                Start Free — No Card Needed →
              </button>
            </Link>
          </div>

          {/* Trust row */}
          <div style={{
            display: 'flex', gap: '1.5rem', marginTop: '2.5rem', flexWrap: 'wrap',
            animation: 'fadeSlideUp 0.8s ease 0.4s both',
          }}>
            {['🔒 Private by default', '📵 Zero ads', '👨‍👩‍👧 Family-ready'].map(t => (
              <span key={t} style={{ fontSize: '.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '.3rem' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Doctor character ── */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          <DoctorCharacter />
        </div>

        {/* Scroll cue */}
        <div style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', zIndex: 5,
        }}>
          <div style={{
            width: 22, height: 36, border: '1.5px solid #cbd5e1', borderRadius: 11,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)',
              width: 3, height: 7, background: '#2563eb', borderRadius: 99,
              animation: 'floatDot 1.8s ease infinite',
            }} />
          </div>
          <span style={{ fontSize: '.65rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#94a3b8' }}>Scroll</span>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{
        background: '#2563eb',
        padding: '3.5rem 4rem',
      }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2rem',
          textAlign: 'center',
        }}>
          {[
            { target: 50000, suffix: '+', label: 'Active Users' },
            { target: 2000000, suffix: '+', label: 'Goals Achieved' },
            { target: 98, suffix: '%', label: 'Satisfaction Rate' },
          ].map(s => (
            <div key={s.label} style={{ color: 'white' }}>
              <StatPill target={s.target} suffix={s.suffix} label={s.label} />
            </div>
          ))}
        </div>
      </section>

      {/* ── WAVE ── */}
      <div className="wave-sep" style={{ background: '#2563eb' }}>
        <svg viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ width: '100%', height: 40, display: 'block' }}>
          <path d="M0,0 Q360,40 720,20 Q1080,0 1440,30 L1440,40 L0,40Z" fill="white" />
        </svg>
      </div>

      {/* ══════════════════════════════════════ */}
      {/* FEATURES                              */}
      {/* ══════════════════════════════════════ */}
      <section id="features" style={{ background: 'white', padding: '7rem 4rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{
              display: 'inline-block', fontSize: '.75rem', letterSpacing: '.16em',
              textTransform: 'uppercase', color: '#2563eb', fontWeight: 600, marginBottom: '.8rem',
            }}>What you get</div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,4vw,3.2rem)',
              fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.15,
            }}>
              Everything you need to<br />
              <em style={{ fontStyle: 'italic', color: '#2563eb' }}>stay healthy</em>
            </h2>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))',
            gap: '1.5rem',
          }}>
            {[
              { icon: '🍎', title: 'AI Nutrition Scanner', desc: 'Point your camera at any meal. Get instant macro breakdowns, calorie counts, and personalized dietary advice.', delay: 0 },
              { icon: '📅', title: 'Diet Calendar', desc: 'Visualize long-term eating patterns. Spot macro trends and optimize your full diet plan over weeks and months.', delay: 100 },
              { icon: '👨‍🍳', title: 'Curated Recipes', desc: 'Healthy, customizable recipes tailored to your dietary needs — with full nutritional breakdowns.', delay: 200 },
              { icon: '💧', title: 'Hydration Tracker', desc: 'Stay consistently hydrated with personalized goals, smart reminders, and dynamic daily water intake tracking.', delay: 0 },
              { icon: '🌙', title: 'Advanced Sleep Log', desc: 'Log detailed sleep data, analyze cycles, and improve recovery quality with deep nocturnal insights.', delay: 100 },
              { icon: '📊', title: 'Progress Analysis', desc: 'Visualize shared and individual progress through clean, actionable charts to maintain motivation.', delay: 200 },
            ].map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── SHARED HEALTH SECTION ── */}
      <section id="shared" style={{ background: '#f0f7ff', padding: '8rem 4rem' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center',
        }}>
          {/* Left visual: live connection UI */}
          <div
            ref={sharedReveal.ref}
            style={{
              transition: 'opacity .9s ease, transform .9s ease',
              opacity: sharedReveal.visible ? 1 : 0,
              transform: sharedReveal.visible ? 'none' : 'translateX(-40px)',
            }}
          >
            <div style={{
              background: 'white', borderRadius: 28, padding: '2rem',
              border: '1.5px solid #dbeafe', boxShadow: '0 20px 60px rgba(37,99,235,0.1)',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                  Your Wellness Circle
                </div>
                <span style={{
                  background: '#dcfce7', color: '#16a34a', fontSize: '.7rem',
                  fontWeight: 700, padding: '.25rem .7rem', borderRadius: 99,
                  letterSpacing: '.05em',
                }}>● LIVE</span>
              </div>

              {/* Members */}
              {[
                { avatar: '👩', name: 'Priya S.', role: 'Partner', steps: '10,234', color: '#eff6ff' },
                { avatar: '👨', name: 'Rohan K.', role: 'Trainer', steps: '7,890', color: '#f0fdf4' },
                { avatar: '🧒', name: 'Ayaan', role: 'Son', steps: '5,100', color: '#fff7ed' },
              ].map(m => (
                <div key={m.name} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '.85rem', borderRadius: 14, background: m.color,
                  marginBottom: '.6rem', border: '1px solid rgba(37,99,235,0.06)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                    border: '2px solid #dbeafe',
                  }}>{m.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '.88rem', color: '#0f172a' }}>{m.name}</div>
                    <div style={{ fontSize: '.75rem', color: '#64748b' }}>{m.role}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#2563eb' }}>{m.steps}</div>
                    <div style={{ fontSize: '.68rem', color: '#94a3b8' }}>steps</div>
                  </div>
                  {/* Pulse dot */}
                  <div style={{ position: 'relative', width: 8, height: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                    <div style={{
                      position: 'absolute', inset: -3, borderRadius: '50%',
                      border: '1.5px solid #22c55e', animation: 'pulseRing 1.8s ease infinite',
                    }} />
                  </div>
                </div>
              ))}

              {/* Progress bar */}
              <div style={{ marginTop: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                  <span style={{ fontSize: '.78rem', color: '#64748b', fontWeight: 500 }}>Weekly Group Goal</span>
                  <span style={{ fontSize: '.78rem', color: '#2563eb', fontWeight: 700 }}>74%</span>
                </div>
                <div style={{ height: 8, background: '#e0eaff', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: '74%',
                    background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
                    borderRadius: 99, transition: 'width 1.5s ease',
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Right text */}
          <div style={{
            transition: 'opacity .9s ease .15s, transform .9s ease .15s',
            opacity: sharedReveal.visible ? 1 : 0,
            transform: sharedReveal.visible ? 'none' : 'translateX(40px)',
          }}>
            <div style={{
              display: 'inline-block', fontSize: '.75rem', letterSpacing: '.16em',
              textTransform: 'uppercase', color: '#2563eb', fontWeight: 600, marginBottom: '.8rem',
            }}>Shared Wellness</div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.5vw,3rem)',
              fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.15,
              marginBottom: '1.2rem',
            }}>
              Health is better<br />
              <em style={{ fontStyle: 'italic', color: '#2563eb' }}>when it&apos;s shared</em>
            </h2>
            <p style={{ color: '#475569', lineHeight: 1.8, marginBottom: '1.8rem', fontSize: '.95rem' }}>
              Invite your family, partner, or personal trainer to your wellness circle.
              See each other&apos;s live progress, celebrate wins together, and stay accountable
              — across town or across the world.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
              {[
                'Real-time syncing across all your people',
                'Shared goal dashboards with live progress',
                'Private by design — you control what\'s visible',
                'Works for long-distance pairs and local teams',
              ].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '.7rem', fontSize: '.9rem', color: '#374151' }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', background: '#eff6ff',
                    border: '1.5px solid #bfdbfe', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '.6rem', color: '#2563eb', flexShrink: 0, fontWeight: 700,
                  }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ background: 'white', padding: '8rem 4rem' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ fontSize: '.75rem', letterSpacing: '.16em', textTransform: 'uppercase', color: '#2563eb', fontWeight: 600, marginBottom: '.8rem' }}>
              How it works
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,4vw,3rem)',
              fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.15,
            }}>
              Three steps to<br /><em style={{ fontStyle: 'italic', color: '#2563eb' }}>better health</em>
            </h2>
          </div>

          <StepsSection />
        </div>
      </section>

      {/* ── EFFICIENCY ── */}
      <section style={{ background: '#f0f7ff', padding: '7rem 4rem' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '.75rem', letterSpacing: '.16em', textTransform: 'uppercase', color: '#2563eb', fontWeight: 600, marginBottom: '.8rem' }}>
              The science
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.5vw,3rem)',
              fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1rem',
            }}>
              Shared goals work<br />
              <em style={{ fontStyle: 'italic', color: '#2563eb' }}>40% better</em>
            </h2>
            <p style={{ color: '#475569', lineHeight: 1.8, fontSize: '.95rem' }}>
              People who track health with others see dramatically higher goal completion,
              better daily consistency, and lasting habit formation — versus going it alone.
            </p>
          </div>
          <div style={{
            background: 'white', borderRadius: 24, padding: '2rem',
            border: '1.5px solid #dbeafe', boxShadow: '0 8px 32px rgba(37,99,235,0.08)',
          }}>
            <div style={{ fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '1rem' }}>
              Weekly Goal Completion
            </div>
            {/* SVG chart */}
            <svg viewBox="0 0 340 160" width="100%" style={{ display: 'block', overflow: 'visible' }}>
              {/* grid */}
              {[40, 80, 120].map(y => (
                <line key={y} x1="0" y1={y} x2="340" y2={y} stroke="#f1f5f9" strokeWidth="1" />
              ))}
              {/* Solo (dashed) */}
              <path d="M0,148 L57,138 L114,130 L171,122 L228,116 L285,110 L340,104" fill="none" stroke="#bfdbfe" strokeWidth="1.5" strokeDasharray="5 3" />
              {/* Team */}
              <path d="M0,148 L57,130 L114,106 L171,78 L228,55 L285,35 L340,18" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M0,148 L57,130 L114,106 L171,78 L228,55 L285,35 L340,18 L340,160 L0,160Z" fill="rgba(37,99,235,0.06)" />
              {/* Dots */}
              {[[0,148],[57,130],[114,106],[171,78],[228,55],[285,35],[340,18]].map(([x,y],i) => (
                <circle key={i} cx={x} cy={y} r="4" fill="#2563eb" />
              ))}
              {/* Labels */}
              {['W1','W2','W3','W4','W5','W6','W7'].map((w,i) => (
                <text key={w} x={i*57} y="175" fill="#94a3b8" fontSize="10" fontFamily="DM Sans,sans-serif" textAnchor="middle">{w}</text>
              ))}
              <text x="280" y="30" fill="#2563eb" fontSize="11" fontFamily="DM Sans,sans-serif" fontWeight="600">Shared ↑</text>
              <text x="280" y="96" fill="#93c5fd" fontSize="11" fontFamily="DM Sans,sans-serif">Solo</text>
            </svg>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: '#2563eb', padding: '8rem 4rem' }}>
        <div
          ref={ctaReveal.ref}
          style={{
            maxWidth: 680, margin: '0 auto', textAlign: 'center',
            transition: 'opacity .9s ease, transform .9s ease',
            opacity: ctaReveal.visible ? 1 : 0,
            transform: ctaReveal.visible ? 'none' : 'translateY(32px)',
          }}
        >
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem,5vw,4rem)',
            fontWeight: 900, color: 'white', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1.2rem',
          }}>
            Ready to get<br />
            <em style={{ fontStyle: 'italic', color: '#bfdbfe' }}>healthier together?</em>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', lineHeight: 1.75, marginBottom: '2.5rem' }}>
            Join 50,000+ people already tracking, sharing, and improving their health with HealthPlus.
          </p>
          <Link href="/auth/signup">
            <button style={{
              padding: '1rem 2.5rem', borderRadius: 99,
              background: 'white', color: '#2563eb', border: 'none',
              fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: '1.05rem',
              cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              transition: 'all .25s',
            }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.transform = 'translateY(-3px)'; b.style.boxShadow = '0 16px 48px rgba(0,0,0,0.2)'; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.transform = 'translateY(0)'; b.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)'; }}>
              Start for Free →
            </button>
          </Link>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
            {['🔒 Private & Secure', '📵 No Ads Ever', '⚡ Free to Start'].map(b => (
              <span key={b} style={{ fontSize: '.82rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: '#f8faff', borderTop: '1px solid #e2eeff',
        padding: '3rem 4rem', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={{ animation: 'heartbeat 2s ease infinite', fontSize: '1.2rem' }}>❤️</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>HealthPlus</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Email', href: 'mailto:sharmahazel310@gmail.com' },
            { label: 'GitHub', href: 'https://github.com/HazelSharmaCoderHZ' },
            { label: 'LinkedIn', href: 'https://www.linkedin.com/in/hazelsharma-it/' },
          ].map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
              style={{ color: '#64748b', textDecoration: 'none', fontSize: '.85rem', fontWeight: 500, transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
              {l.label}
            </a>
          ))}
        </div>
        <div style={{ fontSize: '.8rem', color: '#94a3b8' }}>HealthPlus © 2025 · All Rights Reserved.</div>
      </footer>
    </>
  );
}