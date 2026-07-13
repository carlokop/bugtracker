import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import type { FeedbackItem } from "@/types";

const bugItem: FeedbackItem = {
  id: "fb-1",
  projectId: "proj-1",
  type: "bug",
  status: "open",
  problemDescription: "Test",
  definitionOfDone: "Done",
  deviceType: "desktop",
  hasLocation: true,
  pageUrl: "/",
  cssSelector: ".btn",
  x: 10,
  y: 20,
  screenshotUrl: null,
  createdBy: "user-1",
  createdAt: "2026-07-13T10:00:00.000Z",
  updatedAt: "2026-07-13T10:00:00.000Z",
};

describe("StatusBadge", () => {
  it("renders bug status label", () => {
    render(<StatusBadge item={bugItem} />);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("renders feature status label", () => {
    const featureItem: FeedbackItem = {
      ...bugItem,
      type: "feature",
      status: "approved",
    };
    render(<StatusBadge item={featureItem} />);
    expect(screen.getByText("Goedgekeurd")).toBeInTheDocument();
  });
});
