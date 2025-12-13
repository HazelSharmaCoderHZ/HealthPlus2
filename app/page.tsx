'use client';

import Link from "next/link";
import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
// Import icons for professional appearance (requires: npm install lucide-react)
import { Utensils, Calendar, ChefHat, Droplet, Moon, BarChart3, ArrowRight, X , CircleCheck} from 'lucide-react';

// Register all necessary plugins once globally
gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  // Ref to scope all GSAP animations for clean cleanup
  const mainRef = useRef(null);

  /* ================= REFS ================= */
  const aboutSectionRef = useRef<HTMLDivElement | null>(null);
  const aboutTrackRef = useRef<HTMLDivElement | null>(null);

  const servicesSectionRef = useRef<HTMLDivElement | null>(null);
  const servicesTrackRef = useRef<HTMLDivElement | null>(null);

  /* ================= GSAP ANIMATIONS & FIXES ================= */
  useLayoutEffect(() => {
    // 1. Create a GSAP context to scope and automatically revert all animations
    let ctx = gsap.context(() => {
      
      // --- ABOUT SECTION HORIZONTAL SCROLL FIX ---
      if (aboutSectionRef.current && aboutTrackRef.current) {
        // Calculate the distance to scroll
        const aboutDistance =
          aboutTrackRef.current.scrollWidth -
          aboutSectionRef.current.offsetWidth;

        // Create the Horizontal Scroll Timeline
        const aboutScrollTween = gsap.to(aboutTrackRef.current, {
          x: -aboutDistance,
          ease: "none",
        });

        // Pin the section and link the scrollTween
        ScrollTrigger.create({
          trigger: aboutSectionRef.current,
          pin: true,
          start: "top top",
          end: `+=${aboutDistance}`, // Use calculated distance for end point
          scrub: 1,
          animation: aboutScrollTween,
        });

        // --- ABOUT SLIDE FADE/SCALE EFFECT ---
        gsap.fromTo(
          aboutTrackRef.current.children,
          { opacity: 0, scale: 0.95, x: 50 },
          {
            opacity: 1,
            scale: 1,
            x: 0,
            stagger: 0.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: aboutSectionRef.current,
              start: "top 70%",
              end: "bottom bottom",
              toggleActions: "play none none reverse",
              scrub: 0.5,
            },
          }
        );
      }

      // --- SERVICES SECTION HORIZONTAL SCROLL FIX ---
      if (servicesSectionRef.current && servicesTrackRef.current) {
        // Calculate the distance to scroll
        const servicesDistance =
          servicesTrackRef.current.scrollWidth -
          servicesSectionRef.current.offsetWidth;

        // Create the Horizontal Scroll Timeline
        const servicesScrollTween = gsap.to(servicesTrackRef.current, {
          x: -servicesDistance,
          ease: "none",
        });

        // Pin the section and link the scrollTween
        ScrollTrigger.create({
          trigger: servicesSectionRef.current,
          pin: true,
          start: "top top",
          end: `+=${servicesDistance}`, // Use calculated distance for end point
          scrub: 1,
          animation: servicesScrollTween,
        });
      }

      // --- HERO TEXT PARALLAX ---
      gsap.fromTo(".hero-text-content", 
        { y: 0, opacity: 1 },
        {
            y: -50, // Move up slightly
            opacity: 0.5, // Fade slightly
            ease: "none",
            scrollTrigger: {
                trigger: mainRef.current,
                start: "top top",
                end: "bottom center",
                scrub: true,
            }
        }
      );

    }, mainRef); // <-- Scope the context to the component's main ref

    // 2. Return the cleanup function
    return () => ctx.revert();
  }, []);

  return (
    <div ref={mainRef} className="font-sans antialiased bg-white text-slate-900">

      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-blue-100/70 shadow-sm">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-blue-700 text-3xl tracking-tight transition duration-300 hover:text-blue-800">
            HealthPlus
          </Link>
          <div className="hidden sm:flex gap-8 text-base font-semibold text-slate-700">
            <a href="#about" className="hover:text-blue-700 transition duration-200">About</a>
            <a href="#services" className="hover:text-blue-700 transition duration-200">Services</a>
            <a href="#contact" className="hover:text-blue-700 transition duration-200">Contact</a>
          </div>
          <Link href="/auth/signup">
             <button className="hidden sm:block px-6 py-2 bg-blue-600 text-white rounded-full font-semibold transition duration-300 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5">
                Sign Up
             </button>
          </Link>
        </nav>
      </header>

      {/* ================= HERO ================= */}
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-white to-blue-50/70 relative overflow-hidden">
  {/* Decorative background elements */}
  <div className="absolute top-1/4 left-1/4 h-64 w-64 bg-blue-200/50 rounded-full blur-[100px] animate-pulse-slow"></div>
  <div className="absolute bottom-1/4 right-1/4 h-80 w-80 bg-indigo-200/50 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>

  {/* Centered Hero Content */}
  <div className="hero-text-content text-center max-w-5xl px-6 relative z-10 flex flex-col items-center justify-center">
    <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold leading-tight tracking-tighter text-slate-900">
      Your health is our{" "}
      <span className="text-blue-700">priority</span>.
    </h1>

    <Link href="/auth/signup">
      <button className="mt-12 px-6 py-4 rounded-full bg-blue-600 text-white font-bold text-sm shadow-xl transition duration-300 hover:bg-blue-700 hover:shadow-2xl transform hover:scale-[1.03]">
        Get Started Today <ArrowRight className="inline ml-2 w-5 h-5" />
      </button>
    </Link>
  </div>
</main>


      {/* ================= ABOUT (HORIZONTAL SCROLL) ================= */}
      <section
        id="about"
        ref={aboutSectionRef}
        className="h-screen overflow-hidden bg-white border-t border-b border-slate-200"
      >
        <div ref={aboutTrackRef} className="flex h-full w-fit">

          {/* SLIDE 1 */}
          <Slide title="">
           <h1 className="text-6xl sm:text-7xl font-bold leading-tight tracking-tighter text-slate-900">
            Your <strong className="text-blue-700">Wellness Journey</strong>,
            <br />
            better when <strong className="text-blue-700">Shared</strong>.
          </h1>
           </Slide>

          {/* SLIDE 2 */}
          <Slide title="">
             <h1 className="text-6xl sm:text-6xl font-bold leading-tight tracking-tighter text-slate-900">Whether you are a <span className="text-blue-700">family</span> or a <span className="text-blue-700">gym trainer</span>
            </h1>
            </Slide>

          {/* SLIDE 3 */}
          <Slide title="">
           <h1 className="text-6xl sm:text-6xl font-bold leading-tight tracking-tighter text-slate-900"> or a <span className="text-blue-700">long-distance couple</span> or a fitness freak <span className="text-blue-700">without a partner</span> ?
            </h1></Slide>

          {/* SLIDE 4 */}
          <Slide title="">
            <h2 className="text-6xl sm:text-7xl font-bold leading-tight tracking-tighter text-slate-900"> <span className="text-blue-700">HealthPlus</span> is just for you!</h2>
            </Slide>

        </div>
      </section>

      {/* ================= SERVICES (HORIZONTAL SCROLL) ================= */}
      <section
        id="services"
        ref={servicesSectionRef}
        className="h-screen bg-blue-500 overflow-hidden border-b border-slate-200"
      >
        <div ref={servicesTrackRef} className="flex h-full w-fit">

          {/* SLIDE 1: Callout */}
          <ServiceIntroSlide>
            Our Core Services
          </ServiceIntroSlide>

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
      </section>

      {/* ================= CONTACT ================= */}
      <section
        id="contact"
        className="py-24 bg-white text-center"
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
              className="px-8 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 transition duration-300 hover:bg-blue-100 hover:shadow-lg transform hover:-translate-y-0.5"
            >
              📧 Email Us
            </a>
            <a 
              href="https://github.com/HazelSharmaCoderHZ"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 transition duration-300 hover:bg-slate-200 hover:shadow-lg transform hover:-translate-y-0.5"
            >
              🖥 GitHub
            </a>
            <a 
              href="https://www.linkedin.com/in/hazelsharma-it/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 transition duration-300 hover:bg-blue-100 hover:shadow-lg transform hover:-translate-y-0.5"
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

/* ================= COMPONENTS (Refined) ================= */

// --- Component for Horizontal Scroll Slides ---
function Slide({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`min-w-[100vw] h-full flex items-center justify-center px-16 bg-white`}>
      <div className="max-w-3xl text-center p-8">
        <h2 className="text-5xl font-extrabold text-blue-700 mb-6 border-b-4 border-blue-100 pb-2">
          {title}
        </h2>
        <div className="text-xl text-slate-700 leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Component for the Services Intro Slide ---
function ServiceIntroSlide({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-w-[100vw] h-full flex items-center justify-center px-16 bg-slate-50">
            <div className="max-w-full max-h-full text-center p-12 rounded-3xl ">
                <h3 className="text-7xl font-bold text-slate-900 mb-4">
                    Our Core <br></br><span className="text-blue-600">Services</span> 
                </h3>
                
                
            </div>
        </div>
    );
}


// --- Component for Professional Service Cards ---
// The 'icon' prop takes a Lucide React component (e.g., Utensils)
function ServiceCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType; // Type for Lucide React component
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-[40vw] h-full flex items-center justify-center bg-slate-50">
      <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-sm text-center w-full h-2/3 transform transition duration-300 hover:scale-[1.05] border-t-4 border-b-4 border-blue-200/50 hover:border-blue-500/80 cursor-default">
        <div className="text-blue-600 mb-4 p-4 rounded-full inline-block bg-blue-100/50 shadow-inner">
          <Icon className="w-8 h-8"/>
        </div>
        <h3 className="text-2xl font-bold mb-3 text-blue-800">{title}</h3>
        <p className="text-md text-slate-600 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}