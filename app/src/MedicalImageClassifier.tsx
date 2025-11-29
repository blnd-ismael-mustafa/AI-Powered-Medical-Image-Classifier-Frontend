"use client";
import React, { useState, ChangeEvent, useEffect } from "react";
import {
  Upload,
  Image,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2,
  BarChart3,
  Microscope,
} from "lucide-react";

interface TopClass {
  index: number;
  name: string;
  probability: number;
}

interface ClassificationResult {
  result: string; // "cancer" or "not cancer"
  result_confidence: number;
  cancer_probability: number;
  not_cancer_probability: number;
  top_class: TopClass;
  all_class_probabilities: number[] | Record<string, number>; // Array of probabilities or object with class names
}

interface ClassProbability {
  name: string;
  probability: number;
}

interface HealthCheck {
  status: string;
  model_loaded: boolean;
  num_classes: number | null;
  expected_classes: number;
  supported_classes: string[];
  cancer_classes: string[];
  not_cancer_classes: string[];
}

interface PlotsResponse {
  plots: Record<string, string>;
  count: number;
  all_available: boolean;
}

type ViewMode = "prediction" | "graphs";

const MedicalImageClassifier: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("prediction");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [classProbabilities, setClassProbabilities] = useState<ClassProbability[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null);
  const [plots, setPlots] = useState<PlotsResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(false);
  const [loadingPlots, setLoadingPlots] = useState<boolean>(false);

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
      console.log("all_class_probabilities type:", typeof rawData.all_class_probabilities);
      console.log("all_class_probabilities value:", rawData.all_class_probabilities);
      
      // Normalize all_class_probabilities - handle both array and object formats
      let normalizedProbabilities: ClassProbability[] = [];
      
      if (rawData.all_class_probabilities) {
        if (Array.isArray(rawData.all_class_probabilities)) {
          // Check if it's an array of objects (with class_index, class_name, probability)
          const firstElement = rawData.all_class_probabilities[0];
          if (firstElement && typeof firstElement === 'object' && 'class_name' in firstElement && 'probability' in firstElement) {
            // Array of objects format: [{class_index, class_name, probability}, ...]
            console.log("Detected array of objects format");
            normalizedProbabilities = rawData.all_class_probabilities.map((item: any) => ({
              name: item.class_name || `Class ${item.class_index ?? 'Unknown'}`,
              probability: formatProbability(item.probability),
            }));
            // Sort by probability descending to show highest first
            normalizedProbabilities.sort((a, b) => b.probability - a.probability);
          } else {
            // Array of numbers format: [0.5, 0.3, ...]
            console.log("Detected array of numbers format");
            normalizedProbabilities = rawData.all_class_probabilities.map((prob: number, idx: number) => ({
              name: `Class ${idx}`,
              probability: formatProbability(prob),
            }));
          }
        } else if (typeof rawData.all_class_probabilities === 'object' && rawData.all_class_probabilities !== null && !Array.isArray(rawData.all_class_probabilities)) {
          // If it's an object with class names as keys, convert to array
          const probObject = rawData.all_class_probabilities as Record<string, number>;
          console.log("Converting object to array:", probObject);
          console.log("Object keys:", Object.keys(probObject));
          console.log("Object entries:", Object.entries(probObject));
          
          normalizedProbabilities = Object.entries(probObject).map(([name, prob]) => {
            console.log(`Processing: ${name} = ${prob} (type: ${typeof prob})`);
            // Use the probability as-is, formatProbability will handle validation
            const normalizedProb = formatProbability(prob);
            console.log(`  -> Normalized to: ${normalizedProb}`);
            
            return {
              name: name,
              probability: normalizedProb,
            };
          });
          
          console.log("Normalized probabilities array:", normalizedProbabilities);
          console.log("Array length:", normalizedProbabilities.length);
          // Sort by probability descending to show highest first
          normalizedProbabilities.sort((a, b) => b.probability - a.probability);
          console.log("After sorting:", normalizedProbabilities);
        } else {
          console.log("all_class_probabilities is not in expected format:", rawData.all_class_probabilities);
        }
      }
      
      console.log("Final normalizedProbabilities:", normalizedProbabilities);
      
      const data: ClassificationResult = {
        ...rawData,
        all_class_probabilities: normalizedProbabilities.map(cp => cp.probability), // Keep as array for compatibility
      };
      
      setResult(data);
      setClassProbabilities(normalizedProbabilities);
      console.log("Set classProbabilities state:", normalizedProbabilities);
    } catch (err) {
      let errorMessage = "Failed to classify image.";
      
      if (err instanceof Error) {
        if (err.message.includes("Network error") || err.message.includes("Failed to fetch")) {
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
      const response = await fetch("http://localhost:5001/api/health").catch((fetchError) => {
        throw new Error(
          `Unable to connect to the backend server at http://localhost:5001. ` +
          `Please ensure the server is running. Error: ${fetchError.message}`
        );
      });
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }
      const data: HealthCheck = await response.json();
      setHealthCheck(data);
    } catch (err) {
      const errorMessage = err instanceof Error 
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
      const response = await fetch("http://localhost:5001/api/plots/all").catch((fetchError) => {
        throw new Error(
          `Unable to connect to the backend server at http://localhost:5001. ` +
          `Please ensure the server is running. Error: ${fetchError.message}`
        );
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch plots: ${response.status} ${response.statusText}`);
      }
      const data: PlotsResponse = await response.json();
      setPlots(data);
    } catch (err) {
      const errorMessage = err instanceof Error 
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Activity className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">
              AI Skin Cancer Classifier
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Upload dermoscopic images for AI-powered skin lesion classification.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Supports: Skin Lesion Analysis melanoma, benign{" "}
          </p>
          
          {/* View Toggle Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setViewMode("prediction")}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
                viewMode === "prediction"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <Microscope className="w-5 h-5 mr-2" />
              Prediction
            </button>
            <button
              onClick={() => setViewMode("graphs")}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
                viewMode === "graphs"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Graphs
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          {viewMode === "prediction" ? (
            <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                <Upload className="w-6 h-6 mr-2 text-blue-600" />
                Upload Image
              </h2>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {preview ? (
                    <div className="space-y-4">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <p className="text-sm text-gray-600">
                        {selectedFile?.name}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Image className="w-16 h-16 mx-auto text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          Click to upload image
                        </p>
                        <p className="text-sm text-gray-500">
                          PNG, JPG, JPEG up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={classifyImage}
                  disabled={!selectedFile || loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5 mr-2" />
                      Classify Image
                    </>
                  )}
                </button>

                {(preview || result) && (
                  <button
                    onClick={reset}
                    className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Upload New Image
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                <Activity className="w-6 h-6 mr-2 text-purple-600" />
                Analysis Results
              </h2>

              {!result && !loading && (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Results will appear here after classification</p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                    <p className="text-gray-600">
                      Analyzing image with AI model...
                    </p>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  {/* Binary Result */}
                  <div
                    className={`rounded-xl p-4 border ${
                      result.result === "cancer"
                        ? "bg-gradient-to-r from-red-50 to-orange-50 border-red-200"
                        : "bg-gradient-to-r from-green-50 to-blue-50 border-green-200"
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <CheckCircle
                        className={`w-6 h-6 mr-2 ${
                          result.result === "cancer"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      />
                      <h3 className="text-lg font-semibold text-gray-800">
                        Binary Classification
                      </h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1 capitalize">
                      {result.result === "cancer" ? "Cancer Detected" : "Not Cancer"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Confidence: {formatPercentage(result.result_confidence)}%
                    </p>
                  </div>

                  {/* Cancer Probabilities */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Cancer Probability
                      </h4>
                      <p className="text-2xl font-bold text-red-600">
                        {formatPercentage(result.cancer_probability)}%
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-red-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${formatProbability(result.cancer_probability) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Not Cancer Probability
                      </h4>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPercentage(result.not_cancer_probability)}%
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${formatProbability(result.not_cancer_probability) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Top Class */}
                  {result.top_class && (
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        Top Class Prediction
                      </h3>
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="font-medium text-gray-800">
                              Class {result.top_class.index}: {result.top_class.name || "Unknown"}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-purple-600">
                            {formatPercentage(result.top_class.probability)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${formatProbability(result.top_class.probability) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Class Probabilities */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                      All Class Probabilities ({classProbabilities.length} Classes)
                    </h3>
                    {classProbabilities && classProbabilities.length > 0 ? (
                      <div className="space-y-3">
                        {classProbabilities.map((classProb, idx) => {
                          // Debug log
                          if (idx === 0) {
                            console.log("Rendering classProbabilities:", classProbabilities);
                            console.log("First item:", classProb);
                          }
                          
                          const validProb = formatProbability(classProb.probability);
                          const percentage = validProb * 100;

                          return (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-gray-800">
                                  {classProb.name}
                                </span>
                                <span className="text-sm font-semibold text-blue-600">
                                  {formatPercentage(classProb.probability)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                          Class probabilities data is not available. (Length: {classProbabilities?.length || 0})
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Disclaimer:</strong> This is an AI-assisted tool
                      for educational purposes only. Always consult healthcare
                      professionals for medical diagnosis and treatment.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          ) : (
            /* Graphs View */
            <div className="space-y-6">
              {/* Health Check Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                  <Activity className="w-6 h-6 mr-2 text-blue-600" />
                  Model Health Status
                </h2>
                {loadingHealth ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
                    <p className="text-gray-600">Loading health check...</p>
                  </div>
                ) : healthCheck ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-lg border-2 ${
                        healthCheck.status === 'healthy' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center mb-2">
                          <CheckCircle className={`w-5 h-5 mr-2 ${
                            healthCheck.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                          }`} />
                          <span className="font-semibold text-gray-800">Status</span>
                        </div>
                        <p className="text-lg font-bold capitalize">{healthCheck.status}</p>
                      </div>
                      <div className={`p-4 rounded-lg border-2 ${
                        healthCheck.model_loaded 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-center mb-2">
                          <Activity className="w-5 h-5 mr-2 text-blue-600" />
                          <span className="font-semibold text-gray-800">Model Loaded</span>
                        </div>
                        <p className="text-lg font-bold">
                          {healthCheck.model_loaded ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h3 className="font-semibold text-gray-800 mb-2">Model Configuration</h3>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Number of Classes:</span> {healthCheck.num_classes ?? 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Expected Classes:</span> {healthCheck.expected_classes}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <h3 className="font-semibold text-gray-800 mb-2">Class Information</h3>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Supported Classes:</span> {healthCheck.supported_classes.length}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Cancer Classes:</span> {healthCheck.cancer_classes.length}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Not Cancer Classes:</span> {healthCheck.not_cancer_classes.length}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="font-semibold text-gray-800 mb-2">Supported Classes</h3>
                      <div className="flex flex-wrap gap-2">
                        {healthCheck.supported_classes.map((className, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              healthCheck.cancer_classes.includes(className)
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {className}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Unable to load health check information</p>
                  </div>
                )}
              </div>

              {/* Plots Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-800">
                  <BarChart3 className="w-6 h-6 mr-2 text-purple-600" />
                  Model Training Plots
                </h2>
                {loadingPlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin mr-3" />
                    <p className="text-gray-600">Loading plots...</p>
                  </div>
                ) : plots && plots.count > 0 ? (
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Available Plots:</span> {plots.count} of 4
                        {plots.all_available && (
                          <span className="ml-2 text-green-600 font-medium">✓ All plots available</span>
                        )}
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      {Object.entries(plots.plots).map(([plotName, plotUrl]) => (
                        <div key={plotName} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h3 className="font-semibold text-gray-800 mb-3 capitalize">
                            {plotName.replace(/_/g, ' ')}
                          </h3>
                          <div className="relative">
                            <img
                              src={`http://localhost:5001${plotUrl}`}
                              alt={plotName.replace(/_/g, ' ')}
                              className="w-full h-auto rounded-lg shadow-md"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'text-center py-4 text-red-600';
                                errorDiv.textContent = 'Failed to load plot';
                                target.parentElement?.appendChild(errorDiv);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No plots available. Please train the model first.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions - Only show in prediction view */}
          {viewMode === "prediction" && (
            <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                How to Use
              </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">
                    Upload Image
                  </h3>
                  <p className="text-sm text-gray-600">Select a skin image</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 rounded-full p-2 flex-shrink-0">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Classify</h3>
                  <p className="text-sm text-gray-600">
                    Click the classify button to analyze with AI
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">
                    View Results
                  </h3>
                  <p className="text-sm text-gray-600">
                    Review AI-based skin cancer detection scores
                  </p>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalImageClassifier;
