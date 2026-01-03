export interface FeedbackElement {
  id: string;
  module_id: string;
  content: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface FeedbackModule {
  id: string;
  title: string;
  description?: string;
  position: number;
  created_at: string;
  updated_at: string;
  elements: FeedbackElement[];
}

export interface FeedbackResponse {
  success: boolean;
  message?: string;
  modules?: FeedbackModule[];
  module?: FeedbackModule;
}
