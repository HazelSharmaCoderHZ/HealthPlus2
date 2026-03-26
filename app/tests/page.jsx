"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { tests } from "./data";
import Test from "./Test";
import TopMenuButton from "../../components/TopMenuButton";

export default function AssessmentPage() {
  const [selectedTest, setSelectedTest] = useState(null);
const router = useRouter();
  if (selectedTest) {
    return <Test test={tests[selectedTest]} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center  to-black text-white space-y-6 p-6">
      <TopMenuButton />
      <h1 className="text-4xl font-bold text-blue-800">Self Assessment Tests</h1>
      <p className="text-gray-900 text-lg">Select a test to begin:</p>
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl">
        {Object.keys(tests).map((key) => (
          <div
            key={key}
            className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:scale-105 transform transition cursor-pointer flex-1"
            onClick={() => setSelectedTest(key)}
          >
            <h2 className="text-xl font-bold text-white">{tests[key].title}</h2>
            <p className="text-gray-200 mt-2">{tests[key].description}</p>
          </div>
        ))}
      </div>
      <p className="max-w-2xl mx-auto text-gray-800 text-sm md:text-base text-center leading-relaxed px-6 py-4 rounded-lg ">
  The <span className="font-semibold text-blue-600">PHQ-9</span> and <span className="font-semibold text-blue-600">GAD-7</span> are brief, self-administered screening tools used by healthcare providers to assess symptoms of depression and generalized anxiety disorder (GAD). 
  <br />
  <span className="text-xs text-gray-500 mt-2 block italic">
    Developed by Dr. Robert L. Spitzer, Dr. Janet B.W. Williams, Dr. Kurt Kroenke, and colleagues.
  </span>
</p>
<button
        onClick={() => router.push("/dashboard")}
        className="mt-8 mb-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold  transition"
      >
        ⬅ Back to Dashboard
      </button>
 </div>
  );
}