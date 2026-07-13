import { formatDate } from "@/lib/utils";
import type { FeedbackComment } from "@/types";

export function CommentThread({ comments }: { comments: FeedbackComment[] }) {
  if (comments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        Nog geen reacties
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="rounded-lg border bg-card p-4 shadow-xs"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">
              {comment.userName ?? "Onbekend"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">
            {comment.text}
          </p>
        </div>
      ))}
    </div>
  );
}
