import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeedbackTypeBadge } from "@/components/feedback/FeedbackTypeBadge";

describe("FeedbackTypeBadge", () => {
  it("renders bug label", () => {
    render(<FeedbackTypeBadge type="bug" />);
    expect(screen.getByText("Bug")).toBeInTheDocument();
  });

  it("renders feature label", () => {
    render(<FeedbackTypeBadge type="feature" />);
    expect(screen.getByText("Feature")).toBeInTheDocument();
  });
});
