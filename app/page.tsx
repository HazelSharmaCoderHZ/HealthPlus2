'use client';

import Link from "next/link";
import { useRef, useLayoutEffect, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";
import { TextPlugin } from "gsap/TextPlugin";

// Import icons
import { Utensils, Calendar, ChefHat, Droplet, Moon, BarChart3, ArrowRight, X , CircleCheck,TrendingUp, HeartHandshake} from 'lucide-react';
 

// Register all necessary plugins once globally
gsap.registerPlugin(ScrollTrigger, Flip, SplitText, TextPlugin);
// --- Component to handle text splitting and word/line animation (Enhanced Flip Effect) ---

// --- New Component for the "Dear Diary" style effect ---
const ParticleExplosion = ({ triggerRef }) => {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const shapes = ['circle', 'square', 'triangle'];
    const colors = ['#2563eb', '#60a5fa', '#93c5fd', '#1d4ed8']; // Various Blues

    const createParticle = () => {
      const particle = document.createElement('div');
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 15 + 5;

      particle.style.position = 'absolute';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.backgroundColor = color;
      particle.style.left = '50%';
      particle.style.top = '50%';
      particle.style.borderRadius = shape === 'circle' ? '50%' : '2px';
      particle.style.opacity = '0';
      
      container.appendChild(particle);

      // Animate the particle
      gsap.to(particle, {
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        rotation: Math.random() * 360,
        opacity: 1,
        duration: 1.5,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(particle, {
            opacity: 0,
            duration: 1,
            onComplete: () => particle.remove()
          });
        }
      });
    };

    ScrollTrigger.create({
      trigger: triggerRef.current,
      start: "left center",
      containerAnimation: null, // We'll trigger this when the section is active
      onEnter: () => {
        for(let i = 0; i < 40; i++) {
          setTimeout(createParticle, i * 50);
        }
      }
    });
  }, [triggerRef]);

  return <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden" />;
};




const WordSplitText = ({ children, delay = 0 }) => {
  const textRef = useRef(null);

  useLayoutEffect(() => {
    // 1. Split text into lines first, then words
    // We wrap lines in a div with 'overflow-hidden' to create the "mask"
    const split = new SplitText(textRef.current, { 
      type: "lines,words",
      linesClass: "overflow-hidden" // This acts as the "window" for the text
    });

    // 2. Animate the words from below the mask
    const textAnimation = gsap.from(split.words, {
      y: "110%",             // Start completely below the line's container
      rotationX: -20,        // Subtle tilt for depth
      opacity: 0,
      stagger: 0.03,         // Tight, professional stagger
      duration: 1.2,         // Slightly longer duration for "luxury" feel
      ease: "power4.out",    // Stronger ease-out for a snappy finish
      delay: delay,
      paused: true,
    });

    // 3. Trigger the animation
    ScrollTrigger.create({
      trigger: textRef.current.closest('section'), 
      start: "top 75%",      // Trigger slightly earlier for better UX
      onEnter: () => textAnimation.play(),
      onLeaveBack: () => textAnimation.reverse(),
    });

    return () => {
      split.revert();
      textAnimation.kill();
    };
  }, [delay]);

  return (
    <div ref={textRef} className="perspective-1000">
      {children}
    </div>
  );
};

const AboutImage = ({ alt, src }) => (
    // Note: The image should be placed in the public directory, e.g., 'public/img1.png'
    <div className="mt-12 w-full max-w-lg mx-auto overflow-hidden rounded-xl  border-blue-100/50">
        <img 
            src={src} // <-- The image URL/path is inserted here
            alt={alt} 
            // Setting a fixed aspect ratio or height is recommended if images aren't uniform
            className="w-full h-full object-cover aspect-video" 
        />
    </div>
);

function SplashScreen({ onFinish }) {
  const splashRef = useRef(null);
  const iconRef = useRef(null);

  useLayoutEffect(() => {
    const tl = gsap.timeline({ onComplete: onFinish });

    tl.fromTo(
      splashRef.current,
      { opacity: 1 },
      { opacity: 1, duration: 0.2 }
    )
      .fromTo(
        iconRef.current,
        { scale: 0, rotate: -20 },
        { scale: 1.4, rotate: 0, duration: 0.8, ease: "back.out(1.8)" }
      )
      .to(iconRef.current, {
        scale: 1.15,
        duration: 0.6,
        yoyo: true,
        repeat: 1,
      })
      .to(iconRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.6,
      })
      .to(splashRef.current, {
        opacity: 0,
        duration: 0.6,
      });
  }, [onFinish]);

  return (
    <div
      ref={splashRef}
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-600 via-blue-400 to-emerald-400
 flex items-center justify-center"
    >
      <div className="absolute w-[500px] h-[500px] bg-white/10 rounded-full blur-[140px]" />
      <HeartHandshake
        ref={iconRef}
        className="w-32 h-32 text-white drop-shadow-2xl"
      />
    </div>
  );
}


// --- The Main Component ---
export default function HomePage() {
  const statsRef = useRef<HTMLDivElement | null>(null);
const statsAnimatedRef = useRef(false);

  const mainRef = useRef(null);
  const [showSplash, setShowSplash] = useState(true);

  /* ================= REFS ================= */
  const aboutSectionRef = useRef<HTMLDivElement | null>(null);
  const aboutTrackRef = useRef<HTMLDivElement | null>(null);
  const efficiencySectionRef = useRef<HTMLDivElement | null>(null);
  const chartPathRef = useRef<SVGPathElement | null>(null);
  const typeTargetRef = useRef(null); // Ref for the text
  const cursorRef = useRef(null);
  const servicesSectionRef = useRef<HTMLDivElement | null>(null);
  const servicesTrackRef = useRef<HTMLDivElement | null>(null);
  const servicesTitleRef = useRef<HTMLDivElement | null>(null);

  const aboutPinSpacerRef = useRef(null);
  const servicesPinSpacerRef = useRef(null);

  /* ================= GSAP ANIMATIONS & FIXES ================= */
  useEffect(() => {
  if (!showSplash && typeTargetRef.current) {
    gsap.fromTo(
      typeTargetRef.current,
      { text: "" },
      {
        duration: 2.5,
        text: "Track. Share. Improve.",
        ease: "none",
      }
    );
  }
}, [showSplash]);

  useLayoutEffect(() => {
if (statsRef.current) {
  ScrollTrigger.create({
    trigger: statsRef.current,
    start: "top 75%",
    once: true,
    onEnter: () => {
      if (statsAnimatedRef.current) return;
      statsAnimatedRef.current = true;

      const numbers = statsRef.current!.querySelectorAll("[data-value]");

      numbers.forEach((el) => {
        const target = Number(el.getAttribute("data-value"));

        gsap.fromTo(
          el,
          { innerText: 0 },
          {
            innerText: target,
            duration: 2,
            ease: "power2.out",
            snap: { innerText: 1 },
            onUpdate: function () {
              el.innerText = Math.floor(Number(el.innerText)).toLocaleString();
            },
          }
        );
      });
    },
  });
}

    let ctx = gsap.context(() => {
      // 1. TYPEWRITER EFFECT: "Track. Share. Improve."
      const tl = gsap.timeline();
      
      tl.to(typeTargetRef.current, {
        duration: 2.5,
        text: "Track. Share. Improve.",
        ease: "none",
      });

      // 2. BLINKING CURSOR EFFECT
      gsap.to(cursorRef.current, {
        opacity: 0,
        ease: "power2.inOut",
        repeat: -1,
        duration: 0.6
      });
      // --- ABOUT SECTION HORIZONTAL SCROLL FIX (Subtle Scale) ---
      if (aboutSectionRef.current && aboutTrackRef.current) {
        const setAboutPinSpacerRef = (st) => {
          aboutPinSpacerRef.current = st.spacer;
          if (aboutPinSpacerRef.current) {
            gsap.set(aboutPinSpacerRef.current, { clearProps: "width,height" });
          }
        };

        const aboutDistance =
          aboutTrackRef.current.scrollWidth -
          aboutSectionRef.current.offsetWidth;

        const aboutScrollTween = gsap.to(aboutTrackRef.current, {
          x: -aboutDistance,
          ease: "none",
        });
       


       ScrollTrigger.create({
  trigger: aboutSectionRef.current,
  pin: true,
  anticipatePin: 1,
  invalidateOnRefresh: true,
  start: "top top",
  end: `+=${aboutDistance}`,
  scrub: 1,
  animation: aboutScrollTween,
  onRefreshInit: setAboutPinSpacerRef,
  onUpdate: (self) => {
    gsap.to(aboutTrackRef.current, {
      scale: 1 + (self.progress * 0.03),
      duration: 0.3,
      ease: "none",
    });
  }
});

      }

      // --- SERVICES SECTION HORIZONTAL SCROLL & CARD ANIMATIONS ---
      if (servicesSectionRef.current && servicesTrackRef.current && servicesTitleRef.current) {
        const setServicesPinSpacerRef = (st) => {
          servicesPinSpacerRef.current = st.spacer;
          if (servicesPinSpacerRef.current) {
            gsap.set(servicesPinSpacerRef.current, { clearProps: "width,height" });
          }
        };
        
        const servicesDistance =
          servicesTrackRef.current.scrollWidth -
          servicesSectionRef.current.offsetWidth;

        const servicesScrollTween = gsap.to(servicesTrackRef.current, {
          x: -servicesDistance,
          ease: "none",
        });

        ScrollTrigger.create({
  trigger: servicesSectionRef.current,
  pin: true,
  anticipatePin: 1,
  invalidateOnRefresh: true,
  start: "top top",
  end: `+=${servicesDistance}`,
  scrub: 1,
  animation: servicesScrollTween,
  onRefreshInit: setServicesPinSpacerRef,
});


        // --- SERVICES CARD ENTRANCE EFFECT (Scale/Fade) ---
        gsap.from(servicesTrackRef.current.children, {
            scale: 0.8,
            opacity: 0,
            x: 50, // Slide in from right
            duration: 0.8,
            stagger: 0.5,
            ease: "power2.out",
            scrollTrigger: {
                trigger: servicesSectionRef.current,
                containerAnimation: servicesScrollTween,
                start: "left 80%",
                end: "left 20%",
                toggleActions: "play none none reverse",
            }
        });
         // --- EFFICIENCY GRAPH ---
      if (chartPathRef.current) {
        const path = chartPathRef.current;
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
          strokeDashoffset: 0,
          scrollTrigger: {
            trigger: efficiencySectionRef.current,
            start: "top 60%",
            end: "bottom 80%",
            scrub: 1,
          }
        });
      }
      }
      
      // --- HERO TEXT PARALLAX (More Dramatic) ---
      gsap.fromTo(".hero-text-content", 
        { y: 0, opacity: 1, scale: 1 },
        {
          y: -150, 
          opacity: 0,
          scale: 0.9, 
          ease: "power2.in", 
          scrollTrigger: {
            trigger: mainRef.current,
            start: "top top",
            end: "20% top",
            scrub: true,
          }
        }
      );

    }, mainRef);
ScrollTrigger.refresh();

    return () => ctx.revert();
  }, []);

  // Fix for ScrollTrigger Pin Spacer (Layout Shift)
  useEffect(() => {
    if (aboutPinSpacerRef.current) {
        gsap.set(aboutPinSpacerRef.current, { clearProps: "width,height" });
    }
    if (servicesPinSpacerRef.current) {
        gsap.set(servicesPinSpacerRef.current, { clearProps: "width,height" });
    }
  }, []);


  return (
    <div ref={mainRef} className="font-sans antialiased bg-white text-slate-900">
{showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-blue-100/70 shadow-md">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="font-bold text-blue-700 text-xl tracking-tight transition duration-300 hover:text-blue-800">
            <HeartHandshake className="inline w-8 h-8 mr-2"/> HealthPlus
          </Link>
          <div className="hidden sm:flex gap-8 text-base font-semibold text-slate-700">
            <a href="#about" className="hover:text-blue-700 transition duration-200">About</a>
            <a href="#services" className="hover:text-blue-700 transition duration-200">Services</a>
            <a href="#contact" className="hover:text-blue-700 transition duration-200">Contact</a>
          </div>
          <Link href="/auth/signup">
            <button className="px-4 py-2 rounded-full bg-blue-600 text-white font-black text-lg shadow-2xl transition duration-500 hover:bg-blue-700 hover:shadow-3xl transform hover:scale-[1.08]">
              Login
            </button>
          </Link>
          
        </nav>
      </header>

      {/* ================= HERO (Aesthetic) ================= */}
      <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_center,#ffffff_0%,##deebfc_70%)] relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-blue-200/40 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 bg-blue-300/30 rounded-full blur-[150px] animate-pulse-slow delay-1000"></div>

        {/* Centered Hero Content */}
        <div className="hero-text-content text-center max-w-5xl px-6 relative z-10 flex flex-col items-center justify-center ">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tighter text-slate-900">
            <span ref={typeTargetRef}> </span>
            <span ref={cursorRef} className="text-blue-600 ml-1">|</span>
           <br></br>
            <span className=" bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent
  ">Together.</span>
          </h1>
          <p className="mt-6 text-2xl text-slate-600 max-w-3xl font-light">
            Shared progress, Achieve goals faster & together.
          </p>

          <Link href="/auth/login">
            <button className="mt-12 px-5 py-2 rounded-full bg-blue-600 text-white font-black text-lg shadow-2xl transition duration-500 hover:bg-blue-700 hover:shadow-3xl transform hover:scale-[1.08]">
              Get Started <ArrowRight className="inline ml-3 w-6 h-6" />
            </button>
          </Link>
        </div>
      </main>
{/* ================= TRUST STATS ================= */}
<section className="py-28 bg-white">
  <div className="max-w-5xl mx-auto px-6">
    
    <div ref={statsRef}  className="bg-blue-600 rounded-3xl px-10 py-16 shadow-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 text-center text-white">

        <div>
          <h3 className="text-5xl font-black">
  <span data-value="50000">0</span>+
</h3>

          <p className="mt-2 text-blue-100">Active Users</p>
        </div>

        <div>
          <h3 className="text-5xl font-black">
  <span data-value="2000000">0</span>+
</h3>

          <p className="mt-2 text-blue-100">Goals Achieved</p>
        </div>

        <div>
          <h3 className="text-5xl font-black">
  <span data-value="98">0</span>%
</h3>
<p className="mt-2 text-blue-100">Satisfaction</p>
        </div>

      </div>
    </div>

    <div className="mt-16 grid sm:grid-cols-3 gap-8 text-center">
  <div className="flex items-center justify-center gap-3 text-slate-700 font-semibold">
    <CircleCheck className="text-xl font-extrabold text-blue-600" />
    Clinically inspired tracking
  </div>
  <div className="flex items-center justify-center gap-3 text-slate-700 font-semibold">
    <TrendingUp className="text-blue-600" />
    Proven habit consistency
  </div>
  <div className="flex items-center justify-center gap-3 text-slate-700 font-semibold">
    <HeartHandshake className="text-blue-600" />
    Trusted by teams & families
  </div>
</div>


  </div>
</section>


<section
  id="anim"
  className="min-h-screen overflow-hidden relative  -mt-px
             bg-gradient-to-b
             from-[#275fcf]
             via-[#1d0269]
             to-[#1f0269]"
>

  {/* SLIDE 1: Intro/Gap */}
          <div className="items-center justify-center mb-2">
            <div className="mb-3">
  <div className="rocket">
    <div className="rocket-body">
      <div className="body"></div>
      <div className="fin fin-left"></div>
      <div className="fin fin-right"></div>
      <div className="window"></div>
    </div>
    <div className="exhaust-flame"></div>
    <ul className="exhaust-fumes">
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
    </ul>
    <ul className="star">
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
    </ul>
  </div>
  </div> 
  </div>
</section>



      {/* ================= ABOUT (HORIZONTAL SCROLL & Word Split Animation - NO BOXES) ================= */}
      <section
        id="about"
        ref={aboutSectionRef}
        className="h-screen  overflow-hidden "
      >
        <div ref={aboutTrackRef} className="flex h-screen w-fit">
          
          {/* SLIDE 1 */}
        <Slide>
  <WordSplitText>
    <h1 className="text-6xl sm:text-7xl font-bold leading-tight tracking-tighter text-slate-900 text-center">
      Your <strong className="text-blue-500">Wellness Journey</strong>,
      <br />
      better when <strong className="text-blue-500">Shared</strong>.
    </h1>

    {/* SVG Wrapper */}
    <div className="flex items-center justify-center mt-1">
      {/* SVG filter definition (hidden, but global) */}
      <svg width="0" height="0">
        <defs>
          <filter
            id="goo"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={8}
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              result="cm"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 21 -7
              "
            />
          </filter>
        </defs>
      </svg>

      {/* Main SVG */}
      <svg
        width="360"
        height="240"
        viewBox="-140 -140 540 400"
        overflow="visible"
      >
        <g filter="url(#goo)">
          <circle
            cx="170"
            cy="100"
            r="54"
            fill="#275EFE"
            className="circle"
          />
          <circle
            cx="170"
            cy="100"
            r="54"
            fill="#275EFE"
            className="circle right"
          />
        </g>
      </svg>
    </div>
  </WordSplitText>
</Slide>


          {/* SLIDE 2 - Family/Trainer (With Image) */}
          <Slide>
            <WordSplitText delay={0.1}>
              <h1 className="text-6xl sm:text-6xl font-semibold  mb-5 text-slate-900">
                Whether you are a <span className="text-blue-600">family</span> or a <span className="text-blue-600">gym trainer</span>
              </h1>
            </WordSplitText>
            <AboutImage alt="A family and a personal trainer tracking shared health goals"  src="/images/trainer.png"  />
          </Slide>

          {/* SLIDE 3 - Long Distance Couple (With Image) */}
          <Slide>
            <WordSplitText delay={0.2}>
              <h1 className="text-6xl sm:text-6xl  tracking-tighter mb-4 font-semibold  text-slate-900">
                or a <span className="text-blue-600">long-distance couple</span> or a fitness freak <span className="text-blue-600">without a partner</span> ?
              </h1>
            </WordSplitText>
            <AboutImage alt="A long-distance couple sharing fitness data and statistics" src="images/couple.png" />
          </Slide>
<div className="min-w-[100vw] h-full flex items-center justify-center relative overflow-hidden"> {/* The Particle Effect Component */} <ParticleExplosion triggerRef={aboutSectionRef} /> <div className="text-center z-10 relative"> {/* Floating Blue Emojis/Icons */} <div className="absolute -bottom-20 -right-20 transition-all"> <HeartHandshake className="w-16 h-16 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent opacity-80" /> </div>  </div>
</div>
        </div>
        
      </section>

      {/* ================= HEALTHPLUS STATEMENT (NEW SEPARATE SECTION) ================= */}
<section className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
  
  <div className="absolute inset-0 bg-blue-50/50"></div>



  <div className="relative z-10 text-center px-6">
    
<div className="min-w-[100vw] h-full flex items-center justify-center relative overflow-hidden">
  
  {/* The Particle Effect Component */}
  <ParticleExplosion triggerRef={aboutSectionRef} />

  <div className="text-center z-10 relative">
    {/* Floating Blue Emojis/Icons */}
    
    <div className="absolute -bottom-20 -right-20  transition-all">
      <HeartHandshake className="w-16 h-16 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent opacity-50" />
    </div>

    
    
   
  </div>
</div>
    <WordSplitText>
      <h2 className="text-5xl sm:text-7xl font-black text-slate-900 leading-tight">
        <span className="text-blue-600">HealthPlus </span>
        
         is just for you!
          
        
      </h2>
      {/* ================= CAUSE → EFFECT FLOW ================= */}
<div className="mt-20 max-w-3xl mx-auto flex flex-col items-center gap-10">

  <div className="text-center">
    <p className="text-xl font-semibold text-slate-500">
      Tracking alone
    </p>
    <p className="text-3xl font-black text-slate-900">
      feels inconsistent
    </p>
  </div>

  <div className="h-10 w-[2px] bg-blue-300 rounded-full"></div>

  <div className="text-center">
    <p className="text-xl font-semibold text-slate-500">
      Tracking together
    </p>
    <p className="text-3xl font-black text-blue-600">
      builds accountability
    </p>
  </div>

  <div className="h-10 w-[2px] bg-blue-300 rounded-full"></div>

  <div className="text-center">
    <p className="text-xl font-semibold text-slate-500">
      Shared accountability
    </p>
    <p className="text-3xl font-black mb-6 text-slate-900">
      creates lasting habits
    </p>
  </div>

</div>


    </WordSplitText>
  </div>
</section>





      


 <section id="services" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-black text-center mb-16">
            Everything you need to <span className="bg-gradient-to-br from-blue-700 via-blue-500 to-cyan-500 bg-clip-text text-transparent">stay healthy</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            
          <ServiceCard icon={Utensils} title="Nutrition Scanner">
            Instantly analyze nutrition and make smarter food choices with our sophisticated AI-powered meal scanner.
          </ServiceCard>

          <ServiceCard icon={Calendar} title="Diet Calendar">
            Track and visualize your long-term eating patterns over time to spot macro trends and optimize your full diet plan.
          </ServiceCard>

          <ServiceCard icon={ChefHat} title="Curated Recipes">
            Access healthy, customizable recipes tailored to your personal dietary needs with full nutritional breakdowns.
          </ServiceCard>

          <ServiceCard icon={Droplet} title="Hydration Tracker">
            Stay consistently hydrated with personalized goals, smart reminders, and dynamic daily water intake tracking.
          </ServiceCard>

          <ServiceCard icon={Moon} title="Advanced Sleep Log">
            Log detailed sleep data, analyze cycles, and improve your overall recovery quality with deep nocturnal insights.
          </ServiceCard>

          <ServiceCard icon={BarChart3} title="Progress Analysis">
            Visualize shared and individual progress through clean, actionable charts and reports to maintain motivation.
          </ServiceCard>
          </div>
        </div>
      </section>
      



{/* EFFICIENCY SECTION */}
      <section ref={efficiencySectionRef} className="py-24 min-h-screen bg-blue-50/80 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter">Increase your <br/><span className="text-blue-600">efficiency</span> and productivity.</h2>
            <p className="mt-6 text-xl text-slate-500">Shared goals lead to 40% higher completion rates.</p>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <svg viewBox="0 0 500 300" className="w-full drop-shadow-2xl">
              <path ref={chartPathRef} d="M10,280 L100,240 L200,260 L300,120 L400,140 L490,20" fill="none" stroke="#2563eb" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </section>




{/* ================= JOURNEY (NEW) ================= */}
<section className="py-28 ">
  <div className="max-w-6xl text-center items-center justify-center  mx-auto px-6 ">

    <h2 className="text-4xl lg:text-6xl font-black text-center mb-16">
      Your Wellness <span className="text-blue-600">Journey</span>
    </h2>

    <div className="grid md:grid-cols-3 gap-10">

      <div className="p-8 rounded-3xl bg-white shadow-xl hover:scale-105 border  hover:border-blue">
        <h3 className="text-xl font-bold mb-3">Start Tracking</h3>
        <p className="text-slate-600">
          Log meals, sleep, hydration, and daily habits effortlessly.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-white shadow-xl hover:scale-105 border hover:border-blue">
        <h3 className="text-xl font-bold mb-3">Share Progress</h3>
        <p className="text-slate-600">
          Stay accountable with family, trainers, or partners.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-white shadow-xl hover:scale-105 border hover:border-blue">
        <h3 className="text-xl font-bold mb-3">Improve Together</h3>
        <p className="text-slate-600">
          Analyze patterns and grow healthier as a team.
        </p>
      </div>

    </div><br></br><br></br>
    <div className="flex justify-center">
  <div className="max-w-4xl rounded-2xl shadow-lg bg-blue-600 px-8 py-4">
    <p className="text-center text-lg font-bold text-white">
      Secure    •    Private    •    No spam    •    No ads
    </p>
  </div>
</div>


  </div>
</section>





      {/* ================= CONTACT ================= */}
      <section
        id="contact"
        className="py-24 bg-gradient-to-b from-white to-teal-500/10 text-center"
      >
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
            Connect with HealthPlus
          </h2>
          <p className="text-xl text-slate-600 mb-10">
            Ready to integrate shared wellness? Reach out to our team for demos, support, or partnership inquiries.
          </p>

          <div className="flex justify-center flex-wrap gap-6 text-lg font-semibold">
            <a 
              href="mailto:sharmahazel310@gmail.com"
              className="px-8 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 transition duration-300 hover:bg-blue-100 hover:shadow-lg transform "
            >
              📧 Email Us
            </a>
            <a 
              href="https://github.com/HazelSharmaCoderHZ"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 transition duration-300 hover:bg-slate-200 hover:shadow-lg transform "
            >
              🖥 GitHub
            </a>
            <a 
              href="https://www.linkedin.com/in/hazelsharma-it/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 transition duration-300 hover:bg-blue-100 hover:shadow-lg transform "
            >
              ↗ LinkedIn Profile
            </a>
          </div>

          <p className="mt-16 text-slate-500 text-sm">
            HealthPlus © 2025 | All Rights Reserved.
          </p>
        </div>
      </section>

    </div>
  );
}

function Slide({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-w-[100vw] h-full flex items-center justify-center px-16 bg-white/70 backdrop-blur-sm`}>
      {/* Removed the box styling: max-w-4xl text-center p-12 bg-white/60 rounded-3xl shadow-2xl border-4 border-blue-200/50 */}
      <div className="max-w-4xl text-center p-4"> 
        <div className="text-xl text-slate-700 leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Component for Professional Service Cards (Unchanged) ---
function ServiceCard({ icon: Icon, title, children }) {
  return (
    <div className="group p-10 rounded-3xl bg-white border border-white hover:scale-105 hover:border-blue shadow-xl transition">
  <div className="mb-6 w-14 h-14 flex items-center justify-center rounded-full 
                  bg-blue-100 text-blue-600 
                  group-hover:scale-110 transition">
   <Icon />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-600">{children}</p>
    </div>
  );
}















/*<div className="min-w-[100vw] h-full flex items-center justify-center bg-white">
            <div className="flex items-center gap-6">
  <div className="loader"></div>
  <div className="loader"></div>
  <div className="loader"></div>
  <div className="loader"></div>
  </div>
          </div>
          */