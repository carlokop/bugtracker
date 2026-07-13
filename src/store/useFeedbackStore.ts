import { create } from "zustand";
import * as feedbackApi from "@/api/feedback";
import type {
  ConvertFeatureToBugInput,
  CreateBugInput,
  CreateFeatureInput,
  DeliverFeatureInput,
  FeedbackComment,
  FeedbackFilters,
  FeedbackItem,
  ItemStatus,
  ProjectFeedbackCounts,
} from "@/types";

async function resolveScreenshotUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) {
    const { url: uploadedUrl } = await feedbackApi.uploadScreenshot(url);
    return uploadedUrl;
  }
  return url;
}

interface FeedbackState {
  items: FeedbackItem[];
  comments: FeedbackComment[];
  isLoading: boolean;
  fetchFeedback: (
    projectId: string,
    filters?: FeedbackFilters,
  ) => Promise<FeedbackItem[]>;
  getFeedbackItem: (id: string) => Promise<FeedbackItem | undefined>;
  createBug: (input: CreateBugInput, userId: string) => Promise<FeedbackItem>;
  createFeature: (
    input: CreateFeatureInput,
    userId: string,
  ) => Promise<FeedbackItem>;
  convertFeatureToBug: (
    id: string,
    input: ConvertFeatureToBugInput,
  ) => Promise<FeedbackItem>;
  deliverFeature: (
    id: string,
    input: DeliverFeatureInput,
  ) => Promise<FeedbackItem>;
  updateStatus: (id: string, status: ItemStatus) => Promise<FeedbackItem>;
  deleteFeedback: (id: string) => Promise<void>;
  addComment: (
    feedbackItemId: string,
    userId: string,
    text: string,
  ) => Promise<FeedbackComment>;
  getComments: (feedbackItemId: string) => Promise<FeedbackComment[]>;
  getBugsForFeature: (featureId: string) => Promise<FeedbackItem[]>;
  getCountsByProject: (projectId: string) => Promise<ProjectFeedbackCounts>;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  items: [],
  comments: [],
  isLoading: false,

  fetchFeedback: async (projectId: string, filters?: FeedbackFilters) => {
    set({ isLoading: true });
    try {
      const { items } = await feedbackApi.fetchFeedback(projectId, filters);
      set({ items, isLoading: false });
      return items;
    } catch {
      set({ isLoading: false });
      return [];
    }
  },

  getFeedbackItem: async (id: string) => {
    try {
      const { item } = await feedbackApi.getFeedbackItem(id);
      set((state) => {
        const exists = state.items.some((i) => i.id === item.id);
        return {
          items: exists
            ? state.items.map((i) => (i.id === item.id ? item : i))
            : [...state.items, item],
        };
      });
      return item;
    } catch {
      return get().items.find((item) => item.id === id);
    }
  },

  createBug: async (input: CreateBugInput, _userId: string) => {
    const screenshotUrl = await resolveScreenshotUrl(input.screenshotUrl);
    const { item } = await feedbackApi.createBug(input.projectId, {
      pageUrl: input.pageUrl,
      cssSelector: input.cssSelector,
      x: input.x,
      y: input.y,
      screenshotUrl,
      problemDescription: input.problemDescription,
      definitionOfDone: input.definitionOfDone,
      deviceType: input.deviceType,
      linkedFeatureId: input.linkedFeatureId,
    });
    set((state) => ({ items: [...state.items, item] }));
    return item;
  },

  createFeature: async (input: CreateFeatureInput, _userId: string) => {
    const screenshotUrl = input.screenshotUrl
      ? await resolveScreenshotUrl(input.screenshotUrl)
      : input.screenshotUrl;
    const { item } = await feedbackApi.createFeature(input.projectId, {
      problemDescription: input.problemDescription,
      definitionOfDone: input.definitionOfDone,
      deviceType: input.deviceType,
      pageUrl: input.pageUrl,
      cssSelector: input.cssSelector,
      x: input.x,
      y: input.y,
      screenshotUrl,
    });
    set((state) => ({ items: [...state.items, item] }));
    return item;
  },

  convertFeatureToBug: async (id: string, input: ConvertFeatureToBugInput) => {
    const screenshotUrl = await resolveScreenshotUrl(input.screenshotUrl);
    const { item } = await feedbackApi.convertFeatureToBug(id, {
      ...input,
      screenshotUrl,
    });
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? item : i)),
    }));
    return item;
  },

  deliverFeature: async (id: string, input: DeliverFeatureInput) => {
    const screenshotUrl = await resolveScreenshotUrl(input.screenshotUrl);
    const { item } = await feedbackApi.deliverFeature(id, {
      ...input,
      screenshotUrl,
    });
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? item : i)),
    }));
    return item;
  },

  updateStatus: async (id: string, status: ItemStatus) => {
    const { item } = await feedbackApi.updateFeedbackStatus(id, status);
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? item : i)),
    }));
    return item;
  },

  deleteFeedback: async (id: string) => {
    await feedbackApi.deleteFeedback(id);
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      comments: state.comments.filter((c) => c.feedbackItemId !== id),
    }));
  },

  addComment: async (feedbackItemId: string, _userId: string, text: string) => {
    const { comment } = await feedbackApi.addComment(feedbackItemId, text);
    set((state) => ({ comments: [...state.comments, comment] }));
    return comment;
  },

  getComments: async (feedbackItemId: string) => {
    const { comments } = await feedbackApi.getComments(feedbackItemId);
    set((state) => ({
      comments: [
        ...state.comments.filter((c) => c.feedbackItemId !== feedbackItemId),
        ...comments,
      ],
    }));
    return comments;
  },

  getBugsForFeature: async (featureId: string) => {
    const { items } = await feedbackApi.getBugsForFeature(featureId);
    return items;
  },

  getCountsByProject: async (projectId: string) => {
    const { counts } = await feedbackApi.getFeedbackCounts(projectId);
    return counts;
  },
}));
