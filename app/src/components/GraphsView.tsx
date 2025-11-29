"use client";
import React from "react";
import { Activity, BarChart3, Loader2, CheckCircle, AlertCircle, Maximize2 } from "lucide-react";
import type { HealthCheck, PlotsResponse } from "../types";

interface GraphsViewProps {
  healthCheck: HealthCheck | null;
  loadingHealth: boolean;
  plots: PlotsResponse | null;
  loadingPlots: boolean;
  onExpandImage: (url: string) => void;
}

export const GraphsView: React.FC<GraphsViewProps> = ({
  healthCheck,
  loadingHealth,
  plots,
  loadingPlots,
  onExpandImage,
}) => {
  return (
    <div className="space-y-6">
      {/* Health Check Section */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow border border-white/20 p-8 hover:bg-white/15 transition-all duration-300">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3">
            <Activity className="w-5 h-5 text-white" />
          </div>
          Model Health Status
        </h2>
        {loadingHealth ? (
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
              <Loader2 className="w-8 h-8 text-green-300 animate-spin mr-3 relative z-10" />
            </div>
            <p className="text-green-200">Loading health check...</p>
          </div>
        ) : healthCheck ? (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div
                className={`p-5 rounded-xl border-2 backdrop-blur-md transition-all duration-300 ${
                  healthCheck.status === "healthy"
                    ? "bg-green-500/20 border-green-400/50 shadow shadow-green-500/20"
                    : "bg-red-500/20 border-red-400/50 shadow shadow-red-500/20"
                }`}
              >
                <div className="flex items-center mb-2">
                  <CheckCircle
                    className={`w-5 h-5 mr-2 ${
                      healthCheck.status === "healthy" ? "text-green-300" : "text-red-300"
                    }`}
                  />
                  <span className="font-semibold text-white">Status</span>
                </div>
                <p className="text-xl font-bold capitalize text-white">{healthCheck.status}</p>
              </div>
              <div
                className={`p-5 rounded-xl border-2 backdrop-blur-md transition-all duration-300 ${
                  healthCheck.model_loaded
                    ? "bg-green-500/20 border-green-400/50 shadow shadow-green-500/20"
                    : "bg-yellow-500/20 border-yellow-400/50 shadow shadow-yellow-500/20"
                }`}
              >
                <div className="flex items-center mb-2">
                  <Activity className="w-5 h-5 mr-2 text-green-300" />
                  <span className="font-semibold text-white">Model Loaded</span>
                </div>
                <p className="text-xl font-bold text-white">{healthCheck.model_loaded ? "Yes" : "No"}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-green-500/10 backdrop-blur-md rounded-xl p-5 border border-green-400/30">
                <h3 className="font-bold text-white mb-3">Model Configuration</h3>
                <p className="text-sm text-green-200 mb-1">
                  <span className="font-semibold">Number of Classes:</span>{" "}
                  <span className="text-white">{healthCheck.num_classes ?? "N/A"}</span>
                </p>
                <p className="text-sm text-green-200">
                  <span className="font-semibold">Expected Classes:</span>{" "}
                  <span className="text-white">{healthCheck.expected_classes}</span>
                </p>
              </div>
              <div className="bg-emerald-500/10 backdrop-blur-md rounded-xl p-5 border border-emerald-400/30">
                <h3 className="font-bold text-white mb-3">Class Information</h3>
                <p className="text-sm text-emerald-200 mb-1">
                  <span className="font-semibold">Supported Classes:</span>{" "}
                  <span className="text-white">{healthCheck.supported_classes.length}</span>
                </p>
                <p className="text-sm text-emerald-200 mb-1">
                  <span className="font-semibold">Cancer Classes:</span>{" "}
                  <span className="text-white">{healthCheck.cancer_classes.length}</span>
                </p>
                <p className="text-sm text-emerald-200">
                  <span className="font-semibold">Not Cancer Classes:</span>{" "}
                  <span className="text-white">{healthCheck.not_cancer_classes.length}</span>
                </p>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10">
              <h3 className="font-bold text-white mb-3">Supported Classes</h3>
              <div className="flex flex-wrap gap-2">
                {healthCheck.supported_classes.map((className, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md border ${
                      healthCheck.cancer_classes.includes(className)
                        ? "bg-red-500/20 text-red-200 border-red-400/30"
                        : "bg-green-500/20 text-green-200 border-green-400/30"
                    }`}
                  >
                    {className}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-white/60">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-white/40" />
            <p>Unable to load health check information</p>
          </div>
        )}
      </div>

      {/* Plots Section */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow border border-white/20 p-8 hover:bg-white/15 transition-all duration-300">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          Model Training Plots
        </h2>
        {loadingPlots ? (
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
              <Loader2 className="w-8 h-8 text-green-300 animate-spin mr-3 relative z-10" />
            </div>
            <p className="text-green-200">Loading plots...</p>
          </div>
        ) : plots && plots.count > 0 ? (
          <div className="space-y-6">
            <div className="bg-green-500/10 backdrop-blur-md rounded-xl p-4 border border-green-400/30">
              <p className="text-sm text-green-200">
                <span className="font-bold">Available Plots:</span>{" "}
                <span className="text-white font-semibold">{plots.count} of 4</span>
                {plots.all_available && (
                  <span className="ml-2 text-emerald-300 font-semibold">✓ All plots available</span>
                )}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(plots.plots).map(([plotName, plotUrl]) => (
                <div
                  key={plotName}
                  className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <h3 className="font-bold text-white mb-4 capitalize text-lg">{plotName.replace(/_/g, " ")}</h3>
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => onExpandImage(`http://localhost:5001${plotUrl}`)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <div className="absolute top-2 right-2 z-20 bg-green-500/80 backdrop-blur-sm rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                    <img
                      src={`http://localhost:5001${plotUrl}`}
                      alt={plotName.replace(/_/g, " ")}
                      className="w-full h-auto rounded-xl shadow border-2 border-white/20 relative z-10 transition-transform group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const errorDiv = document.createElement("div");
                        errorDiv.className = "text-center py-4 text-red-300";
                        errorDiv.textContent = "Failed to load plot";
                        target.parentElement?.appendChild(errorDiv);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-white/60">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-white/40" />
            <p>No plots available. Please train the model first.</p>
          </div>
        )}
      </div>
    </div>
  );
};

