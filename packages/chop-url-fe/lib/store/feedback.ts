import apiClient from '@/lib/api/client';
import { ApiError } from '@/lib/api/error';
import { create } from 'zustand';

interface FeedbackState {
  feedback: Feedback[];
  isLoading: boolean;
  error: ApiError | null;
  sendFeedback: (feedback: Feedback) => Promise<void>;
}

interface Feedback {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  description: string;
  category: string;
  priority: string;
  title: string;
}

const useFeedbackStore = create<FeedbackState>((set) => ({
  feedback: [],
  isLoading: false,
  error: null,
  sendFeedback: async (feedback: Feedback) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post('/admin/feedback', feedback);
      set({ feedback: response.data });
    } catch (error) {
      set({ error: error as ApiError });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useFeedbackStore;
