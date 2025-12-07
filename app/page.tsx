'use client';
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";




export default function Navbar() {
  return (
    <>
    
      {/* Header / Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 backdrop-blur-xl shadow-md">
  <nav className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
    <Link href="/" className="flex items-center gap-2 text-blue-600 font-extrabold text-lg">
      +HealthPlus
    </Link>

    <div className="hidden sm:flex items-center gap-3">
      <a
        href="#about"
        className="inline-flex items-center justify-center px-6 py-2 rounded-full text-sm font-semibold text-blue-600  hover:bg-white/50 transition cursor-pointer"
        role="button"
        aria-label="About us"
      >
        About us
      </a>

      <a
        href="#services"
        className="inline-flex items-center justify-center px-6 py-2 rounded-full text-sm font-semibold text-blue-600  hover:bg-white/50 transition cursor-pointer"
        role="button"
        aria-label="Services"
      >
        Services
      </a>

      <a
        href="#contact"
        className="inline-flex items-center justify-center px-6 py-2 rounded-full text-sm font-semibold text-blue-600  hover:bg-white/50 transition cursor-pointer"
        role="button"
        aria-label="Contact us"
      >
        Contact Us
      </a>

      
    </div>
  </nav>
</header>


      {/* Hero / Main Section */}
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
<div className="flex flex-col max-w-4xl mx-auto justify-center items-center text-center">
  <svg
  className="absolute left-0 top-0 w-full opacity-0"
  viewBox="0 0 1440 320"
>
  <path
    fill="#BAE6FD"
    d="M0,160L80,154.7C160,149,320,139,480,117.3C640,96,800,64,960,96C1120,128,1280,224,1360,256L1440,288V0H0Z"
  ></path>
</svg>

<svg
  className="absolute bottom-0 left-0 w-full opacity-90 scale-y-[-1] backdrop-blur-2xl"
  viewBox="0 0 1440 320"
>
  <defs>
    {/* Multi-color gradient */}
    <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#3EE9F2" stopOpacity="0.9" />
      <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.9" />
      <stop offset="100%" stopColor="#48a2ecff" stopOpacity="0.9" />
    </linearGradient>

    {/* Frosted glass blur */}
    <filter id="glassBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feColorMatrix
        in="blur"
        type="matrix"
        values="1 0 0 0 0  
                0 1 0 0 0  
                0 0 1 0 0  
                0 0 0 0.35 0"
      />
    </filter>
  </defs>

  <path
    fill="url(#neonGradient)"
    filter="url(#glassBlur)"
    d="M0,224L80,213.3C160,203,320,181,480,149.3C640,117,800,75,960,90.7C1120,107,1280,181,1360,218.7L1440,256V0H0Z"
  />
</svg>


    
    <h1 className="text-6xl sm:text-6xl mb-5 font-bold mt-6 text-blue-900">
      YOUR HEALTH IS OUR <br />
      <span className="text-blue-800 font-extrabold text-7xl sm:text-7xl">
        {"PRIORITY".split("").map((letter, i) => (
          <span key={i} className="inline-block hover:opacity-0">
            {letter}
          </span>
        ))}
      </span>.
    </h1>

    <Link href="/auth/signup">
      <button className="mt-10 w-full sm:w-auto min-w-[120px] mx-auto block animated-button">

        
        <span className="text">Get started ➡️</span>
        <span className="circle"></span>
        
      </button>
    </Link>
     
  </div>
</main>


      {/* About Us Section */}
      <section
        id="about"
        className="min-h-screen flex flex-col justify-center items-center px-6 sm:px-12 py-20  "
      >
        <h2 className="text-4xl font-extrabold text-blue-900 mb-6">
          About Us.
        </h2>

        <p className="max-w-3xl text-lg text-black font-bold dark:text-gray-800 leading-relaxed text-center">
          <div className="border-t border-purple mt-5 mb-5"></div>
          At <span className="text-blue-500">HealthPlus</span>, we are dedicated to create a collaborative health and wellness platform designed to make well-being a shared journey. It brings families, partners, and communities together by sharing meaningful insights, celebrating progress, and inspiring collective motivation for healthier living. Together, we aim to make health not just a personal goal, but a united experience that strengthens connections and inspires lasting well-being.
        </p>
      </section>

      {/* Gradient Transition Between About & Services */}
      <div className="h-32 w-full bg-gradient-to-b from-blue to-black"></div>

      {/* Services Section */}
      <section
        id="services"
        className="relative min-h-screen flex flex-col justify-center items-center px-6 sm:px-12 py-20 "
      >
        <h2 className="text-4xl font-bold mb-16 text-blue-900">
          Our Services
        </h2>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl w-full">
          {[
            { icon: "🥗", title: "Know Your Food", desc: "Instantly analyze the nutritional value of any food item to make informed choices for a healthier lifestyle." },
            { icon: "📅", title: "Nutrition Calendar", desc: "Track your monthly nutrition intake and visualize your eating patterns to support holistic wellness." },
            { icon: "👩‍🍳", title: "Recipes", desc: "Discover healthy, easy-to-cook recipes with a complete nutritional breakdown, personalized to your preferences." },
            { icon: "💧", title: "Water Checker", desc: "Stay hydrated by monitoring your daily water intake and receiving timely reminders." },
            { icon: "⚖️", title: "BMI Calculator", desc: "Quickly calculate your Body Mass Index and get personalized insights for your fitness journey." },
            { icon: "😴", title: "Sleep Tracker", desc: "Monitor your sleep patterns and log daily rest data to improve sleep quality and overall well-being." },
            { icon: "🌙", title: "Sleep Calendar", desc: "Visualize your sleep trends over time and identify opportunities to build better sleep habits." },
          ].map((svc, idx) => {
            const isSpanAll = svc.title === "Sleep Calendar";
            return (
              <div
                key={idx}
                className={`p-8 rounded-2xl  border border-grey/10 shadow-lg hover:shadow-xl hover:border-[#00CAFF] transition duration-300 hover:scale-[1.03] ${isSpanAll ? "sm:col-span-2 lg:col-span-3" : ""}`}
              >
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <span>{svc.icon}</span>
                  <span className="text-blue-900">
                    {svc.title}
                  </span>
                </h3>
                <p className="text-black text-sm leading-relaxed">{svc.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Us Section (Matches Services Style) */}
      <section
        id="contact"
        className="relative min-h-screen flex flex-col justify-center items-center px-6 sm:px-12 py-20 text-black"
      >
        <h2 className="text-4xl font-bold mb-12 text-blue-900 text-center">
          Connect with us<br></br>We would love to hear from you.
        </h2>
        

        <div className="grid gap-8 sm:grid-cols-3 max-w-4xl w-full">
          {[
            { icon: "↗️", title: "Meet our founders", link: "https://www.linkedin.com/in/hazelsharma-it/" },
            { icon: "🖥️", title: "GitHub", link: "https://github.com/HazelSharmaCoderHZ" },
            { icon: "📧", title: "Gmail", link: "mailto:sharmahazel310@gmail.com" },
          ].map((contact, idx) => (
            <a
              key={idx}
              href={contact.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-8 rounded-2xl bg-transparent border border-grey/20 shadow-lg hover:shadow-xl hover:border-cyan-200 transition duration-300 hover:scale-[1.05] text-center"
            >
              <h3 className="text-xl font-bold mb-2 flex justify-center items-center gap-2">
                <span>{contact.icon}</span>
                <span className="blue-900">
                  {contact.title}
                </span>
              </h3>
            </a>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 w-full opacity-70 border border-grey/10 shadow-xl">
        <p className=" text-center"> Join HealthPlus today!</p>
          <p className="text-center"> HealthPlus @2025</p>

        </div>

      </section>
    </>
  );
}

