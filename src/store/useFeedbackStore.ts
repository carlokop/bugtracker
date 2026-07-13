import { create } from "zustand";
import { MOCK_FEEDBACK_COMMENTS, MOCK_FEEDBACK_ITEMS } from "@/mock/seed";
import { delay } from "@/lib/utils";
import type {
  BugStatus,
  ConvertFeatureToBugInput,
  CreateBugInput,
  CreateFeatureInput,
  DeliverFeatureInput,
  FeatureStatus,
  FeedbackComment,
  FeedbackFilters,
  FeedbackItem,
  ItemStatus,
  ProjectFeedbackCounts,
} from "@/types";
import { BOARD_STATUSES, FEATURE_BOARD_STATUSES } from "@/types";

function isValidBugStatus(status: ItemStatus): status is BugStatus {
  return (BOARD_STATUSES as string[]).includes(status);
}

function isValidFeatureStatus(status: ItemStatus): status is FeatureStatus {
  return (FEATURE_BOARD_STATUSES as string[]).includes(status);
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
  items: [...MOCK_FEEDBACK_ITEMS],
  comments: [...MOCK_FEEDBACK_COMMENTS],
  isLoading: false,

  fetchFeedback: async (projectId: string, filters?: FeedbackFilters) => {
    set({ isLoading: true });
    await delay();
    let result = get().items.filter((item) => item.projectId === projectId);
    if (filters?.type) {
      result = result.filter((item) => item.type === filters.type);
    }
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

  createBug: async (input: CreateBugInput, userId: string) => {
    if (!input.pageUrl || !input.screenshotUrl) {
      throw new Error("Bugs vereisen een locatie en screenshot");
    }
    await delay();
    const item: FeedbackItem = {
      id: `fb-${Date.now()}`,
      projectId: input.projectId,
      type: "bug",
      status: "open",
      problemDescription: input.problemDescription,
      definitionOfDone: input.definitionOfDone,
      deviceType: input.deviceType,
      hasLocation: true,
      pageUrl: input.pageUrl,
      cssSelector: input.cssSelector,
      x: input.x,
      y: input.y,
      screenshotUrl: input.screenshotUrl,
      linkedFeatureId: input.linkedFeatureId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ items: [...state.items, item] }));
    return item;
  },

  createFeature: async (input: CreateFeatureInput, userId: string) => {
    await delay();
    const hasLocation =
      input.pageUrl != null &&
      input.x != null &&
      input.y != null &&
      input.screenshotUrl != null;
    const item: FeedbackItem = {
      id: `fb-${Date.now()}`,
      projectId: input.projectId,
      type: "feature",
      status: "approved",
      problemDescription: input.problemDescription,
      definitionOfDone: input.definitionOfDone,
      deviceType: input.deviceType,
      hasLocation,
      pageUrl: input.pageUrl ?? null,
      cssSelector: hasLocation ? (input.cssSelector ?? null) : null,
      x: hasLocation ? (input.x ?? null) : null,
      y: hasLocation ? (input.y ?? null) : null,
      screenshotUrl: hasLocation ? (input.screenshotUrl ?? null) : null,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ items: [...state.items, item] }));
    return item;
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
        if (item.status !== "delivered") {
          throw new Error(
            "Alleen opgeleverde features kunnen worden omgezet naar een bug",
          );
        }
        updated = {
          ...item,
          type: "bug",
          status: "open",
          problemDescription: input.problemDescription,
          definitionOfDone: input.definitionOfDone,
          deviceType: input.deviceType,
          hasLocation: true,
          pageUrl: input.pageUrl,
          cssSelector: input.cssSelector,
          x: input.x,
          y: input.y,
          screenshotUrl: input.screenshotUrl,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }),
    }));
    if (!updated) throw new Error("Feedback item not found");
    return updated;
  },

  deliverFeature: async (id: string, input: DeliverFeatureInput) => {
    await delay();
    let updated: FeedbackItem | undefined;
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== id) return item;
        if (item.type !== "feature") {
          throw new Error("Alleen features kunnen worden opgeleverd");
        }
        if (item.status !== "in_progress") {
          throw new Error(
            "Alleen features in ontwikkeling kunnen worden opgeleverd",
          );
        }
        updated = {
          ...item,
          status: "delivered",
          hasLocation: true,
          pageUrl: input.pageUrl,
          cssSelector: input.cssSelector,
          x: input.x,
          y: input.y,
          screenshotUrl: input.screenshotUrl,
          deliveryDescription: input.deliveryDescription,
          deviceType: input.deviceType,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }),
    }));
    if (!updated) throw new Error("Feedback item not found");
    return updated;
  },

  updateStatus: async (id: string, status: ItemStatus) => {
    await delay();
    let updated: FeedbackItem | undefined;
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== id) return item;
        if (item.type === "bug" && !isValidBugStatus(status)) {
          throw new Error("Ongeldige status voor bug");
        }
        if (item.type === "feature" && !isValidFeatureStatus(status)) {
          throw new Error("Ongeldige status voor feature");
        }
        updated = { ...item, status, updatedAt: new Date().toISOString() };
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

  getBugsForFeature: async (featureId: string) => {
    await delay(50);
    return get().items.filter(
      (item) => item.type === "bug" && item.linkedFeatureId === featureId,
    );
  },

  getCountsByProject: async (projectId: string) => {
    await delay(50);
    const items = get().items.filter((i) => i.projectId === projectId);
    const bugs = items.filter((i) => i.type === "bug");
    const features = items.filter((i) => i.type === "feature");
    return {
      bugs: {
        open: bugs.filter((i) => i.status === "open").length,
        in_progress: bugs.filter((i) => i.status === "in_progress").length,
        in_review: bugs.filter((i) => i.status === "in_review").length,
        done: bugs.filter((i) => i.status === "done").length,
      },
      features: {
        requested: features.filter((i) => i.status === "requested").length,
        approved: features.filter((i) => i.status === "approved").length,
        in_progress: features.filter((i) => i.status === "in_progress").length,
        delivered: features.filter((i) => i.status === "delivered").length,
        accepted: features.filter((i) => i.status === "accepted").length,
      },
    };
  },
}));
