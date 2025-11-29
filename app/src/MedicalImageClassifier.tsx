"use client";
import React, { useState, ChangeEvent, useEffect } from "react";
import { Activity, BarChart3, Microscope } from "lucide-react";
import type {
  ClassificationResult,
  ClassProbability,
  HealthCheck,
  PlotsResponse,
  ClassProbabilityItem,
} from "./types";
import { ImageUploadSection } from "./components/ImageUploadSection";
import { ResultsDisplay } from "./components/ResultsDisplay";
import { ImageModal } from "./components/ImageModal";
import { GraphsView } from "./components/GraphsView";

type ViewMode = "prediction" | "graphs";

const MedicalImageClassifier: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("prediction");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [classProbabilities, setClassProbabilities] = useState<
    ClassProbability[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null);
  const [plots, setPlots] = useState<PlotsResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(false);
  const [loadingPlots, setLoadingPlots] = useState<boolean>(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Helper function to safely format probability as percentage
  const formatProbability = (prob: number | undefined | null): number => {
    if (
      typeof prob !== "number" ||
      isNaN(prob) ||
      !isFinite(prob) ||
      prob < 0
    ) {
      return 0;
    }
    return Math.min(1, prob); // Cap at 1.0
  };

  const formatPercentage = (prob: number | undefined | null): string => {
    const validProb = formatProbability(prob);
    return (validProb * 100).toFixed(2);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      setClassProbabilities([]);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setError("Please select a valid image file");
    }
  };

  const classifyImage = async (): Promise<void> => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("http://localhost:5001/api/classify", {
        method: "POST",
        body: formData,
      }).catch((fetchError) => {
        // Handle network errors (server not running, CORS, etc.)
        throw new Error(
          `Network error: Unable to connect to the backend server at http://localhost:5001. ` +
            `Please ensure the backend server is running and accessible. ` +
            `Error: ${fetchError.message}`
        );
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Classification failed";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            // Check multiple possible error message fields
            errorMessage =
              errorData.message ||
              errorData.error ||
              errorData.detail ||
              errorData.msg ||
              (typeof errorData === "string" ? errorData : errorMessage);
          } else {
            // Try to get text response
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch {
          // If response parsing fails, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const rawData = await response.json();

      // Debug: Log the received data
      console.log("API Response:", rawData);
      console.log(
        "all_class_probabilities type:",
        typeof rawData.all_class_probabilities
      );
      console.log(
        "all_class_probabilities value:",
        rawData.all_class_probabilities
      );

      // Normalize all_class_probabilities - handle both array and object formats
      let normalizedProbabilities: ClassProbability[] = [];

      if (rawData.all_class_probabilities) {
        if (Array.isArray(rawData.all_class_probabilities)) {
          // Check if it's an array of objects (with class_index, class_name, probability)
          const firstElement = rawData.all_class_probabilities[0];
          if (
            firstElement &&
            typeof firstElement === "object" &&
            "class_name" in firstElement &&
            "probability" in firstElement
          ) {
            // Array of objects format: [{class_index, class_name, probability}, ...]
            console.log("Detected array of objects format");
            normalizedProbabilities = (
              rawData.all_class_probabilities as ClassProbabilityItem[]
            ).map((item: ClassProbabilityItem) => ({
              name: item.class_name || `Class ${item.class_index ?? "Unknown"}`,
              probability: formatProbability(item.probability),
            }));
            // Sort by probability descending to show highest first
            normalizedProbabilities.sort(
              (a, b) => b.probability - a.probability
            );
          } else {
            // Array of numbers format: [0.5, 0.3, ...]
            console.log("Detected array of numbers format");
            normalizedProbabilities = rawData.all_class_probabilities.map(
              (prob: number, idx: number) => ({
                name: `Class ${idx}`,
                probability: formatProbability(prob),
              })
            );
          }
        } else if (
          typeof rawData.all_class_probabilities === "object" &&
          rawData.all_class_probabilities !== null &&
          !Array.isArray(rawData.all_class_probabilities)
        ) {
          // If it's an object with class names as keys, convert to array
          const probObject = rawData.all_class_probabilities as Record<
            string,
            number
          >;
          console.log("Converting object to array:", probObject);
          console.log("Object keys:", Object.keys(probObject));
          console.log("Object entries:", Object.entries(probObject));

          normalizedProbabilities = Object.entries(probObject).map(
            ([name, prob]) => {
              console.log(
                `Processing: ${name} = ${prob} (type: ${typeof prob})`
              );
              // Use the probability as-is, formatProbability will handle validation
              const normalizedProb = formatProbability(prob);
              console.log(`  -> Normalized to: ${normalizedProb}`);

              return {
                name: name,
                probability: normalizedProb,
              };
            }
          );

          console.log(
            "Normalized probabilities array:",
            normalizedProbabilities
          );
          console.log("Array length:", normalizedProbabilities.length);
          // Sort by probability descending to show highest first
          normalizedProbabilities.sort((a, b) => b.probability - a.probability);
          console.log("After sorting:", normalizedProbabilities);
        } else {
          console.log(
            "all_class_probabilities is not in expected format:",
            rawData.all_class_probabilities
          );
        }
      }

      console.log("Final normalizedProbabilities:", normalizedProbabilities);

      const data: ClassificationResult = {
        ...rawData,
        all_class_probabilities: normalizedProbabilities.map(
          (cp) => cp.probability
        ), // Keep as array for compatibility
      };

      setResult(data);
      setClassProbabilities(normalizedProbabilities);
      console.log("Set classProbabilities state:", normalizedProbabilities);
    } catch (err) {
      let errorMessage = "Failed to classify image.";

      if (err instanceof Error) {
        if (
          err.message.includes("Network error") ||
          err.message.includes("Failed to fetch")
        ) {
          errorMessage = err.message;
        } else if (err.message.includes("fetch")) {
          errorMessage =
            "Unable to connect to the backend server. " +
            "Please ensure the server is running at http://localhost:5001 and try again.";
        } else {
          errorMessage = err.message;
        }
      } else {
        errorMessage = "An unexpected error occurred. Please try again.";
      }

      setError(errorMessage);
      console.error("Classification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const reset = (): void => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setClassProbabilities([]);
    setError(null);
  };

  const fetchHealthCheck = async (): Promise<void> => {
    setLoadingHealth(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:5001/api/health").catch(
        (fetchError) => {
          throw new Error(
            `Unable to connect to the backend server at http://localhost:5001. ` +
              `Please ensure the server is running. Error: ${fetchError.message}`
          );
        }
      );

      if (!response.ok) {
        throw new Error(
          `Health check failed: ${response.status} ${response.statusText}`
        );
      }
      const data: HealthCheck = await response.json();
      setHealthCheck(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch health check. Make sure the backend server is running.";
      setError(errorMessage);
      console.error("Health check error:", err);
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchPlots = async (): Promise<void> => {
    setLoadingPlots(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:5001/api/plots/all").catch(
        (fetchError) => {
          throw new Error(
            `Unable to connect to the backend server at http://localhost:5001. ` +
              `Please ensure the server is running. Error: ${fetchError.message}`
          );
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch plots: ${response.status} ${response.statusText}`
        );
      }
      const data: PlotsResponse = await response.json();
      setPlots(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch plots. Make sure the backend server is running.";
      setError(errorMessage);
      console.error("Plots fetch error:", err);
    } finally {
      setLoadingPlots(false);
    }
  };

  // Fetch health check and plots when switching to graphs view
  useEffect(() => {
    if (viewMode === "graphs") {
      fetchHealthCheck();
      fetchPlots();
    }
  }, [viewMode]);

  // Handle ESC key to close expanded image
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && expandedImage) {
        setExpandedImage(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [expandedImage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 mt-8">
          {/* Main Title */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-40"></div>
              <Activity className="w-16 h-16 text-green-300 mr-4 relative z-10 animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white/95">
              AI Skin Cancer Classifier
            </h1>
          </div>

          <p className="text-xl text-green-100/90 mb-2 font-light">
            Upload dermoscopic images for AI-powered skin lesion classification
          </p>
          <p className="text-sm text-green-200/70 mt-3">
            Supports: Skin Lesion Analysis • Melanoma Detection • Benign
            Classification
          </p>

          {/* View Toggle Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => setViewMode("prediction")}
              className={`group relative px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center overflow-hidden ${
                viewMode === "prediction"
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow shadow-green-500/30 scale-105"
                  : "bg-white/10 backdrop-blur-md text-white/80 hover:bg-white/20 border border-white/20 hover:scale-105"
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 transition-opacity duration-300 ${
                  viewMode === "prediction"
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              ></div>
              <Microscope
                className={`w-5 h-5 mr-2 relative z-10 transition-transform duration-300 ${
                  viewMode === "prediction"
                    ? "animate-pulse"
                    : "group-hover:scale-110"
                }`}
              />
              <span className="relative z-10">Prediction</span>
            </button>
            <button
              onClick={() => setViewMode("graphs")}
              className={`group relative px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center overflow-hidden ${
                viewMode === "graphs"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow shadow-emerald-500/30 scale-105"
                  : "bg-white/10 backdrop-blur-md text-white/80 hover:bg-white/20 border border-white/20 hover:scale-105"
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 transition-opacity duration-300 ${
                  viewMode === "graphs"
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              ></div>
              <BarChart3
                className={`w-5 h-5 mr-2 relative z-10 transition-transform duration-300 ${
                  viewMode === "graphs"
                    ? "animate-pulse"
                    : "group-hover:scale-110"
                }`}
              />
              <span className="relative z-10">Graphs</span>
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          {viewMode === "prediction" ? (
            <div className="grid md:grid-cols-2 gap-6">
              <ImageUploadSection
                preview={preview}
                selectedFile={selectedFile}
                loading={loading}
                error={error}
                onFileSelect={handleFileSelect}
                onClassify={classifyImage}
                onReset={reset}
                onExpandImage={setExpandedImage}
                hasResult={!!result}
              />
              <ResultsDisplay
                result={result}
                loading={loading}
                classProbabilities={classProbabilities}
                formatPercentage={formatPercentage}
                formatProbability={formatProbability}
              />
            </div>
          ) : (
            <GraphsView
              healthCheck={healthCheck}
              loadingHealth={loadingHealth}
              plots={plots}
              loadingPlots={loadingPlots}
              onExpandImage={setExpandedImage}
            />
          )}

          {/* Instructions - Only show in prediction view */}
          {viewMode === "prediction" && (
            <div className="mt-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow border border-white/20 p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">
                How to Use
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-500/20 rounded-full p-2 shrink-0 border border-green-400/30">
                    <span className="text-green-300 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">
                      Upload Image
                    </h3>
                    <p className="text-sm text-white/70">Select a skin image</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-500/20 rounded-full p-2 shrink-0 border border-green-400/30">
                    <span className="text-green-300 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">Classify</h3>
                    <p className="text-sm text-white/70">
                      Click the classify button to analyze with AI
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-500/20 rounded-full p-2 shrink-0 border border-green-400/30">
                    <span className="text-green-300 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">
                      View Results
                    </h3>
                    <p className="text-sm text-white/70">
                      Review AI-based skin cancer detection scores
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-16 border-t border-white/10 bg-white/5 backdrop-blur-md">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 text-green-400 mr-2" />
                AI Skin Cancer Classifier
              </h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Advanced AI-powered medical imaging tool for skin lesion
                classification and early detection of skin cancer.
              </p>
            </div>
            <div>
              <h4 className="text-base font-semibold text-white mb-4">
                Medical Disclaimer
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                This tool is for educational and research purposes only. It is
                not intended to replace professional medical diagnosis,
                treatment, or advice. Always consult qualified healthcare
                professionals for medical concerns.
              </p>
            </div>
            <div>
              <h4 className="text-base font-semibold text-white mb-4">
                Supported Conditions
              </h4>
              <ul className="text-xs text-white/60 space-y-1">
                <li>• Actinic keratoses (AKIEC)</li>
                <li>• Basal cell carcinoma (BCC)</li>
                <li>• Benign keratosis (BKL)</li>
                <li>• Dermatofibroma (DF)</li>
                <li>• Melanoma (MEL)</li>
                <li>• Melanocytic nevi (NV)</li>
                <li>• Vascular lesions (VASC)</li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-xs text-white/50 mb-2 md:mb-0">
                © {new Date().getFullYear()} AI Skin Cancer Classifier. All
                rights reserved.
              </p>
              <p className="text-xs text-white/50">
                Powered by Deep Learning & TensorFlow
              </p>
            </div>
          </div>
        </div>
      </footer>

      <ImageModal
        imageUrl={expandedImage}
        onClose={() => setExpandedImage(null)}
      />
    </div>
  );
};

export default MedicalImageClassifier;
