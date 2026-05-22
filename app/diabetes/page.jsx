"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Activity,
  HeartPulse,
  Info,
  Sparkles,
} from "lucide-react";

export default function DiabetesPage() {
  const [formData, setFormData] = useState({
    Pregnancies: "",
    Glucose: "",
    BloodPressure: "",
    SkinThickness: "",
    Insulin: "",
    BMI: "",
    DiabetesPedigreeFunction: "",
    Age: "",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const fieldInfo = {
    Pregnancies:
      "Number of pregnancies. A history of gestational diabetes may increase diabetes risk.",
    Glucose:
      "Blood sugar level. High glucose is one of the strongest indicators of diabetes.",
    BloodPressure:
      "High blood pressure is commonly associated with metabolic disorders.",
    SkinThickness:
      "Skin thickness is sometimes used as an indirect indicator of body fat.",
    Insulin:
      "Insulin helps regulate blood sugar levels inside the body.",
    BMI:
      "Body Mass Index. Higher BMI can increase diabetes risk.",
    DiabetesPedigreeFunction:
      "Represents family history and genetic tendency toward diabetes.",
    Age:
      "Risk of diabetes generally increases with age.",
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          Pregnancies: Number(formData.Pregnancies || 0),
          Glucose: Number(formData.Glucose),
          BloodPressure: Number(formData.BloodPressure || 0),
          SkinThickness: Number(formData.SkinThickness || 0),
          Insulin: Number(formData.Insulin || 0),
          BMI: Number(formData.BMI),
          DiabetesPedigreeFunction: Number(
            formData.DiabetesPedigreeFunction || 0
          ),
          Age: Number(formData.Age),
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  const getRecommendation = () => {
    if (!result) return "";

    if (result.prediction === "High Risk") {
      return "Your health indicators suggest a higher diabetes risk. Consider consulting a healthcare professional and maintaining a healthy lifestyle.";
    }

    if (result.prediction === "Moderate Risk") {
      return "Your results show moderate diabetes risk. Regular exercise and healthy food habits may help reduce future complications.";
    }

    return "Your current indicators show a lower diabetes risk. Continue maintaining healthy habits and regular checkups.";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-6 py-12">

      {/* HERO SECTION */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 text-white p-4 rounded-full shadow-xl">
            <Brain className="w-10 h-10" />
          </div>
        </div>

        <h1 className="text-5xl font-extrabold text-blue-900">
          AI Diabetes Predictor
        </h1>

        <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">
          Get an AI-powered early diabetes risk analysis based on your health
          information.
        </p>

        <div className="mt-5 inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
          <Sparkles className="w-4 h-4" />
          AI Powered Healthcare
        </div>
      </motion.div>

      {/* FORM CARD */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-blue-100"
      >
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {Object.keys(formData).map((field) => (
            <div key={field}>
              {/* LABEL */}
              <div className="flex items-center gap-2 mb-2">
                <label className="font-semibold text-blue-900">
                  {field}
                </label>

                <div className="group relative cursor-pointer">
                  <Info className="w-4 h-4 text-blue-500" />

                  {/* TOOLTIP */}
                  <div className="
                    absolute z-20 hidden group-hover:block
                    w-64 p-3 text-sm
                    bg-white border border-blue-200
                    rounded-xl shadow-xl
                    text-gray-700
                    left-6 top-0
                  ">
                    {fieldInfo[field]}
                  </div>
                </div>
              </div>

              {/* INPUT */}
              <input
                type="number"
                step="any"
                name={field}
                value={formData[field]}
                onChange={handleChange}
                required={
                  field === "Glucose" ||
                  field === "BMI" ||
                  field === "Age"
                }
                placeholder={
                  field === "Glucose" ||
                  field === "BMI" ||
                  field === "Age"
                    ? "Required"
                    : "Optional"
                }
                className="
                  w-full
                  p-4
                  rounded-2xl
                  border
                  border-blue-200
                  bg-blue-50/40
                  focus:ring-4
                  focus:ring-blue-200
                  focus:border-blue-500
                  outline-none
                  transition-all
                "
              />
            </div>
          ))}

          {/* BUTTON */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="
              col-span-full
              bg-gradient-to-r
              from-blue-600
              to-blue-800
              text-white
              py-4
              rounded-2xl
              text-lg
              font-bold
              shadow-xl
              hover:shadow-2xl
              transition-all
            "
          >
            {loading ? "Analyzing..." : "Check Diabetes Risk"}
          </motion.button>
        </form>
      </motion.div>

      {/* RESULT SECTION */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`
            max-w-4xl mx-auto mt-10 p-8 rounded-3xl shadow-2xl border
            ${
              result.prediction === "High Risk"
                ? "bg-red-50 border-red-200"
                : result.prediction === "Moderate Risk"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-green-50 border-green-200"
            }
          `}
        >
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-8 h-8 text-blue-700" />

            <h2 className="text-3xl font-bold text-blue-900">
              Prediction Result
            </h2>
          </div>

          {/* RISK LEVEL */}
          <div className="mb-6">
            <p className="text-gray-500 mb-2">
              Risk Level
            </p>

            <h3
              className={`
                text-4xl font-extrabold
                ${
                  result.prediction === "High Risk"
                    ? "text-red-600"
                    : result.prediction === "Moderate Risk"
                    ? "text-yellow-600"
                    : "text-green-600"
                }
              `}
            >
              {result.prediction}
            </h3>
          </div>

          {/* CONFIDENCE BAR */}
          <div className="mb-8">
            <p className="text-gray-500 mb-3">
              AI Confidence
            </p>

            <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.probability}%` }}
                transition={{ duration: 1 }}
                className="h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-700"
              />
            </div>

            <p className="mt-3 text-sm text-gray-700">
              {result.probability}% probability detected
            </p>
          </div>

          {/* RECOMMENDATION */}
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <HeartPulse className="w-5 h-5 text-blue-600" />

              <h4 className="font-bold text-blue-900">
                AI Health Recommendation
              </h4>
            </div>

            <p className="text-gray-700 leading-relaxed">
              {getRecommendation()}
            </p>
          </div>

          {/* DISCLAIMER */}
          <div className="mt-6 text-sm text-gray-500 text-center">
            This AI-generated result is intended only for preliminary health
            awareness and should not be considered a medical diagnosis.
          </div>
        </motion.div>
      )}

      <div className="mt-10 flex justify-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center rounded-full border bg-blue-200 border-blue-300 hover:bg-white px-5 py-2 text-sm font-medium text-blue-600 shadow-sm transition "
          >
            ⬅ Back to Dashboard
          </button>
        </div>

    </main>
  );
}