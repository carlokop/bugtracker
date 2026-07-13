import { create } from "zustand";
import { MOCK_FEEDBACK_COMMENTS, MOCK_FEEDBACK_ITEMS } from "@/mock/seed";
import { delay } from "@/lib/utils";
import type {
  CreateFeedbackInput,
  ConvertFeatureToBugInput,
  FeedbackComment,
  FeedbackFilters,
  FeedbackItem,
  FeedbackStatus,
  FeedbackType,
} from "@/types";

interface FeedbackState {
  items: FeedbackItem[];
  comments: FeedbackComment[];
  isLoading: boolean;
  fetchFeedback: (projectId: string, filters?: FeedbackFilters) => Promise<FeedbackItem[]>;
  getFeedbackItem: (id: string) => Promise<FeedbackItem | undefined>;
  createFeedback: (input: CreateFeedbackInput, userId: string) => Promise<FeedbackItem>;
  updateStatus: (id: string, status: FeedbackStatus) => Promise<FeedbackItem>;
  updateType: (id: string, type: FeedbackType) => Promise<FeedbackItem>;
  convertFeatureToBug: (
    id: string,
    input: ConvertFeatureToBugInput,
  ) => Promise<FeedbackItem>;
  deleteFeedback: (id: string) => Promise<void>;
  addComment: (feedbackItemId: string, userId: string, text: string) => Promise<FeedbackComment>;
  getComments: (feedbackItemId: string) => Promise<FeedbackComment[]>;
  getCountsByProject: (projectId: string) => Promise<Record<FeedbackStatus, number>>;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  items: [...MOCK_FEEDBACK_ITEMS],
  comments: [...MOCK_FEEDBACK_COMMENTS],
  isLoading: false,

  fetchFeedback: async (projectId: string, filters?: FeedbackFilters) => {
    set({ isLoading: true });
    await delay();
    let result = get().items.filter((item) => item.projectId === projectId);
    if (filters?.status) {
      result = result.filter((item) => item.status === filters.status);
    }
    if (filters?.pageUrl) {
      result = result.filter((item) => item.pageUrl === filters.pageUrl);
    }
    if (filters?.deviceType) {
      result = result.filter((item) => item.deviceType === filters.deviceType);
    }
    set({ isLoading: false });
    return result;
  },

  getFeedbackItem: async (id: string) => {
    await delay(50);
    return get().items.find((item) => item.id === id);
  },

  createFeedback: async (input: CreateFeedbackInput, userId: string) => {
    await delay();
    const item: FeedbackItem = {
      id: `fb-${Date.now()}`,
      ...input,
      status: "open",
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ items: [...state.items, item] }));
    return item;
  },

  updateStatus: async (id: string, status: FeedbackStatus) => {
    await delay();
    let updated: FeedbackItem | undefined;
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id === id) {
          updated = { ...item, status, updatedAt: new Date().toISOString() };
          return updated;
        }
        return item;
      }),
    }));
    if (!updated) throw new Error("Feedback item not found");
    return updated;
  },

  updateType: async (id: string, type: FeedbackType) => {
    await delay();
    let updated: FeedbackItem | undefined;
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id === id) {
          updated = { ...item, type, updatedAt: new Date().toISOString() };
          return updated;
        }
        return item;
      }),
    }));
    if (!updated) throw new Error("Feedback item not found");
    return updated;
  },

  convertFeatureToBug: async (id: string, input: ConvertFeatureToBugInput) => {
    await delay();
    let updated: FeedbackItem | undefined;
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== id) return item;
        if (item.type !== "feature") {
          throw new Error("Alleen features kunnen worden omgezet naar een bug");
        }
        updated = {
          ...item,
          ...input,
          type: "bug",
          status: "open",
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }),
    }));
    if (!updated) throw new Error("Feedback item not found");
    return updated;
  },

  deleteFeedback: async (id: string) => {
    await delay();
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      comments: state.comments.filter((c) => c.feedbackItemId !== id),
    }));
  },

  addComment: async (feedbackItemId: string, userId: string, text: string) => {
    await delay();
    const comment: FeedbackComment = {
      id: `fc-${Date.now()}`,
      feedbackItemId,
      userId,
      text,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ comments: [...state.comments, comment] }));
    return comment;
  },

  getComments: async (feedbackItemId: string) => {
    await delay(50);
    return get()
      .comments.filter((c) => c.feedbackItemId === feedbackItemId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  },

  getCountsByProject: async (projectId: string) => {
    await delay(50);
    const items = get().items.filter((i) => i.projectId === projectId);
    return {
      open: items.filter((i) => i.status === "open").length,
      in_progress: items.filter((i) => i.status === "in_progress").length,
      in_review: items.filter((i) => i.status === "in_review").length,
      done: items.filter((i) => i.status === "done").length,
    };
  },
}));
