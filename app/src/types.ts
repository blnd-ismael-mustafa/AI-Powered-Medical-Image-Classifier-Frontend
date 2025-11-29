export interface TopClass {
  index: number;
  name: string;
  probability: number;
}

export interface ClassificationResult {
  result: string;
  result_confidence: number;
  cancer_probability: number;
  not_cancer_probability: number;
  top_class: TopClass;
  all_class_probabilities: number[] | Record<string, number>;
}

export interface ClassProbability {
  name: string;
  probability: number;
}

export interface HealthCheck {
  status: string;
  model_loaded: boolean;
  num_classes: number | null;
  expected_classes: number;
  supported_classes: string[];
  cancer_classes: string[];
  not_cancer_classes: string[];
}

export interface PlotsResponse {
  plots: Record<string, string>;
  count: number;
  all_available: boolean;
}

export interface ClassProbabilityItem {
  class_index?: number;
  class_name?: string;
  probability: number;
}

