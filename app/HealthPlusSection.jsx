import React from 'react';
import { Heart, Activity, ShieldCheck, Star, ArrowRight } from 'lucide-react';
import Link from "next/link";
const HealthPlusSection = () => {
  return (
    <section className="relative z-20 w-full py-24 lg:py-32 bg-[#f8faff] overflow-hidden">
      
      {/* Background Blurs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-50/40 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-5 px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Text Content */}
          <div className="flex-1 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200  mb-8">
              <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
              <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Personalized Care</span>
            </div>

            <h2 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8">
              HealthPlus is <br />
              <span className="text-blue-600 relative">
                just for you!
                <span className="absolute bottom-2 left-0 w-full h-2 bg-blue-100 -z-10"></span>
              </span>
            </h2>

            <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-lg">
              We believe healthcare should be as unique as your DNA. Get a custom wellness experience designed around your lifestyle.
            </p>

            <div className="flex flex-wrap gap-5">
                 <Link href="/auth/signup">
              <button className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
                Get Started
              </button></Link>
            </div>
          </div>

          {/* Feature Card Side */}
          <div className="flex-1 w-full mr-8 max-w-md">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(37,99,235,0.1)] border border-blue-50">
              <div className="flex items-center justify-between mb-10">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Activity className="text-white w-6 h-6" />
                </div>
                <div className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-sm font-bold">
                  Live Status
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <Heart className="text-red-500 w-5 h-5" />
                    <span className="font-bold text-slate-700">Heart Rate</span>
                  </div>
                  <span className="text-blue-600 font-black">72 BPM</span>
                </div>
                
                <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <ShieldCheck className="text-blue-500 w-5 h-5" />
                    <span className="font-bold text-slate-700">Protection</span>
                  </div>
                  <span className="text-blue-600 font-black">Verified</span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-blue-200 flex items-center justify-center text-[10px] font-bold">
                      A
                    </div>
                  ))}
                </div>
                <span className="text-sm text-slate-400 font-medium">Whole family protected</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HealthPlusSection;