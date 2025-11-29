"use client";
import React from "react";
import { Activity, Image, Loader2, CheckCircle, Microscope, BarChart3 } from "lucide-react";
import type { ClassificationResult, ClassProbability } from "../types";

interface ResultsDisplayProps {
  result: ClassificationResult | null;
  loading: boolean;
  classProbabilities: ClassProbability[];
  formatPercentage: (prob: number | undefined | null) => string;
  formatProbability: (prob: number | undefined | null) => number;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  result,
  loading,
  classProbabilities,
  formatPercentage,
  formatProbability,
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow border border-white/20 p-8 hover:bg-white/15 transition-all duration-300">
      <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3">
          <Activity className="w-5 h-5 text-white" />
        </div>
        Analysis Results
      </h2>

      {!result && !loading && (
        <div className="h-64 flex items-center justify-center text-white/50">
          <div className="text-center">
            <div className="relative mx-auto w-20 h-20 mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-25"></div>
              <div className="relative bg-white/10 backdrop-blur-md rounded-full p-5 border border-white/20">
                <Image className="w-10 h-10 mx-auto text-green-300" aria-hidden="true" />
              </div>
            </div>
            <p className="text-white/70">Results will appear here after classification</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
              <Loader2 className="w-16 h-16 mx-auto text-green-400 animate-spin relative z-10" />
            </div>
            <p className="text-green-200 font-medium">Analyzing image with AI model...</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Binary Result */}
          <div
            className={`rounded-2xl p-6 border-2 backdrop-blur-md transition-all duration-300 ${
              result.result === "cancer"
                ? "bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-400/50 shadow shadow-red-500/20"
                : "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/50 shadow shadow-green-500/20"
            }`}
          >
            <div className="flex items-center mb-3">
              <div
                className={`p-2 rounded-lg mr-3 ${
                  result.result === "cancer" ? "bg-red-500/30" : "bg-green-500/30"
                }`}
              >
                <CheckCircle
                  className={`w-6 h-6 ${
                    result.result === "cancer" ? "text-red-300" : "text-green-300"
                  }`}
                />
              </div>
              <h3 className="text-lg font-bold text-white">Binary Classification</h3>
            </div>
            <p
              className={`text-4xl font-extrabold mb-2 capitalize bg-clip-text text-transparent ${
                result.result === "cancer"
                  ? "bg-gradient-to-r from-red-300 to-orange-300"
                  : "bg-gradient-to-r from-green-300 to-emerald-300"
              }`}
            >
              {result.result === "cancer" ? "Cancer Detected" : "Not Cancer"}
            </p>
            <p className="text-sm text-white/80 font-medium">
              Confidence: <span className="text-green-300 font-bold">{formatPercentage(result.result_confidence)}%</span>
            </p>
          </div>

          {/* Cancer Probabilities */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-500/10 backdrop-blur-md rounded-xl p-5 border border-red-400/30 hover:bg-red-500/15 transition-all duration-300">
              <h4 className="text-sm font-semibold text-red-200 mb-2">Cancer Probability</h4>
              <p className="text-3xl font-bold text-red-300 mb-3">{formatPercentage(result.cancer_probability)}%</p>
              <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all duration-500 shadow shadow-red-500/30"
                  style={{ width: `${formatProbability(result.cancer_probability) * 100}%` }}
                />
              </div>
            </div>
            <div className="bg-green-500/10 backdrop-blur-md rounded-xl p-5 border border-green-400/30 hover:bg-green-500/15 transition-all duration-300">
              <h4 className="text-sm font-semibold text-green-200 mb-2">Not Cancer Probability</h4>
              <p className="text-3xl font-bold text-green-300 mb-3">{formatPercentage(result.not_cancer_probability)}%</p>
              <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500 shadow shadow-green-500/30"
                  style={{ width: `${formatProbability(result.not_cancer_probability) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Top Class */}
          {result.top_class && (
            <div className="bg-green-500/10 backdrop-blur-md rounded-2xl p-6 border border-green-400/30 hover:bg-green-500/15 transition-all duration-300">
              <h3 className="text-lg font-bold mb-4 text-white flex items-center">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3">
                  <Microscope className="w-4 h-4 text-white" />
                </div>
                Top Class Prediction
              </h3>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="font-semibold text-white text-lg">
                      Class {result.top_class.index}: {result.top_class.name || "Unknown"}
                    </span>
                  </div>
                  <span className="text-xl font-bold text-green-300">{formatPercentage(result.top_class.probability)}%</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500 shadow shadow-green-500/30"
                    style={{ width: `${formatProbability(result.top_class.probability) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* All Class Probabilities */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white flex items-center">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              All Class Probabilities ({classProbabilities.length} Classes)
            </h3>
            {classProbabilities && classProbabilities.length > 0 ? (
              <div className="space-y-3">
                {classProbabilities.map((classProb, idx) => {
                  const validProb = formatProbability(classProb.probability);
                  const percentage = validProb * 100;
                  return (
                    <div
                      key={idx}
                      className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-white/90">{classProb.name}</span>
                        <span className="text-sm font-bold text-green-300">{formatPercentage(classProb.probability)}%</span>
                      </div>
                      <div className="w-full bg-gray-800/50 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500 shadow shadow-green-500/30"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 rounded-xl p-4">
                <p className="text-sm text-yellow-200">
                  Class probabilities data is not available. (Length: {classProbabilities?.length || 0})
                </p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md border border-yellow-400/30 rounded-xl p-5">
            <p className="text-sm text-yellow-100 leading-relaxed">
              <strong className="text-yellow-200">Disclaimer:</strong> This is an AI-assisted tool for educational purposes
              only. Always consult healthcare professionals for medical diagnosis and treatment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

