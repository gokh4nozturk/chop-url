import apiClient from '@/lib/api/client';
import axios from 'axios';
import { AxiosError } from 'axios';
import { create } from 'zustand';

interface FeedbackState {
  feedback: Feedback[];
  isLoading: boolean;
  error: AxiosError | null;
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
      const response = await apiClient.post('/api/admin/feedback', feedback);
      set({ feedback: response.data });
    } catch (error) {
      set({ error: error as AxiosError });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useFeedbackStore;
