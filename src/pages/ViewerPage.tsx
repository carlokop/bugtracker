import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toPng } from "html-to-image";
import { ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MockWebsite } from "@/mock/MockWebsite";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { PinMarker, PendingPin } from "@/components/viewer/PinMarker";
import { ViewerUrlBar } from "@/components/viewer/ViewerUrlBar";
import { useAuthStore } from "@/store/useAuthStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { cn } from "@/lib/utils";
import { getDeviceTypeFromOrientation } from "@/lib/device";
import { isMockPath, normalizeViewerUrl } from "@/lib/viewer-url";
import type { FeedbackItem, Project, FeedbackType } from "@/types";
import { DEVICE_TYPE_LABELS } from "@/types";

type ViewportSize = "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTHS: Record<ViewportSize, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function ViewerPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const convertFromId = searchParams.get("convertFrom");
  const { currentUser } = useAuthStore();
  const { getProject } = useProjectStore();
  const { fetchFeedback, createFeedback, getFeedbackItem, convertFeatureToBug } =
    useFeedbackStore();
  const { addNotification } = useNotificationStore();

  const [project, setProject] = useState<Project | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [pageUrl, setPageUrl] = useState("");
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [pendingPin, setPendingPin] = useState<{
    x: number;
    y: number;
    selector: string;
  } | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [annotateMode, setAnnotateMode] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [convertItem, setConvertItem] = useState<FeedbackItem | null>(null);

  const isConvertMode = Boolean(convertFromId && convertItem?.type === "feature");

  const viewerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const navigateToUrl = useCallback(
    (rawUrl: string) => {
      if (isConvertMode) return;
      const normalized = normalizeViewerUrl(rawUrl, project?.targetUrl);
      setPageUrl(normalized);
      setSearchParams({ url: normalized }, { replace: true });
      setActivePinId(null);
      setPendingPin(null);
      setIframeError(false);
    },
    [isConvertMode, project?.targetUrl, setSearchParams],
  );

  useEffect(() => {
    if (!convertFromId) {
      setConvertItem(null);
      return;
    }
    getFeedbackItem(convertFromId).then((item) => {
      if (item?.type === "feature") {
        setConvertItem(item);
        setPageUrl(item.pageUrl);
        setSearchParams(
          { url: item.pageUrl, convertFrom: convertFromId },
          { replace: true },
        );
        setAnnotateMode(true);
      } else {
        setConvertItem(null);
      }
    });
  }, [convertFromId, getFeedbackItem, setSearchParams]);

  useEffect(() => {
    if (!projectId) return;
    getProject(projectId).then((p) => {
      setProject(p ?? null);
      if (convertFromId) return;
      if (p) {
        const fromQuery = searchParams.get("url");
        const initial = fromQuery || p.targetUrl || "/";
        setPageUrl(initial);
        if (!fromQuery && p.targetUrl) {
          setSearchParams({ url: p.targetUrl }, { replace: true });
        }
      }
    });
  }, [projectId, getProject, convertFromId]);

  const loadData = useCallback(async () => {
    if (!projectId || !pageUrl) return;
    const items = await fetchFeedback(projectId, { pageUrl });
    setFeedbackItems(items);
  }, [projectId, pageUrl, fetchFeedback]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const captureScreenshot = async (): Promise<string> => {
    if (!contentRef.current) return "";
    try {
      const dataUrl = await toPng(contentRef.current, {
        quality: 0.85,
        pixelRatio: 1,
      });
      return dataUrl;
    } catch {
      return "";
    }
  };

  const handleOverlayClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!annotateMode || pendingPin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const target = document.elementFromPoint(e.clientX, e.clientY);
    const selector = target ? getCssSelector(target) : "unknown";

    setPendingPin({ x, y, selector });
    const screenshot = await captureScreenshot();
    setScreenshotPreview(screenshot);
  };

  const handleSubmitFeedback = async (
    problemDescription: string,
    definitionOfDone: string,
    type: FeedbackType,
  ) => {
    if (!pendingPin || !projectId || !currentUser) return;
    setIsSubmitting(true);

    let screenshot = screenshotPreview;
    if (!screenshot) {
      screenshot = await captureScreenshot();
    }

    const deviceType = getDeviceTypeFromOrientation();

    if (isConvertMode && convertFromId) {
      await convertFeatureToBug(convertFromId, {
        pageUrl,
        cssSelector: pendingPin.selector,
        x: pendingPin.x,
        y: pendingPin.y,
        screenshotUrl: screenshot,
        problemDescription,
        definitionOfDone,
        deviceType,
      });

      if (currentUser.role === "client") {
        await addNotification(
          project?.adminId ?? "user-admin-1",
          "status_change",
          convertFromId,
          "Feature omgezet naar bug — review vereist",
        );
      }

      setIsSubmitting(false);
      navigate(`/feedback/${convertFromId}`);
      return;
    }

    const item = await createFeedback(
      {
        projectId,
        pageUrl,
        cssSelector: pendingPin.selector,
        x: pendingPin.x,
        y: pendingPin.y,
        screenshotUrl: screenshot,
        problemDescription,
        definitionOfDone,
        deviceType,
        type,
      },
      currentUser.id,
    );

    if (currentUser.role === "client") {
      await addNotification(
        project?.adminId ?? "user-admin-1",
        "new_feedback",
        item.id,
        `Nieuwe feedback op ${project?.name ?? "project"}`,
      );
    }

    setPendingPin(null);
    setScreenshotPreview("");
    setIsSubmitting(false);
    loadData();
  };

  const pageFeedback = feedbackItems.filter(
    (f) => f.pageUrl === pageUrl && f.id !== convertFromId,
  );
  const showMock = isMockPath(pageUrl);

  if (!project) {
    return <p className="text-muted-foreground">Project laden...</p>;
  }

  return (
    <div className="relative -mx-4 flex h-[calc(100vh-3.5rem)] flex-col md:-mx-6">
      <div className="flex flex-col gap-3 border-b bg-background px-3 py-3 sm:px-4">
        <div className="flex items-center gap-3">
          <Link
            to={
              isConvertMode && convertFromId
                ? `/feedback/${convertFromId}`
                : "/projects"
            }
          >
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0 shrink-0">
            <h1 className="truncate text-sm font-semibold">{project.name}</h1>
            <p className="text-xs text-muted-foreground">
              {isConvertMode ? "Feature omzetten naar bug" : "Viewer"}
            </p>
          </div>
        </div>

        {isConvertMode && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-muted-foreground">
            Plaats een <strong className="text-foreground">marker</strong> op de
            pagina waar de bug zit. Beschrijf daarna het probleem en de definition
            of done.
          </div>
        )}

        {!isConvertMode && (
          <ViewerUrlBar
            key={pageUrl}
            value={pageUrl}
            defaultUrl={project.targetUrl}
            onNavigate={navigateToUrl}
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex shrink-0 rounded-lg border">
            {(["desktop", "tablet", "mobile"] as ViewportSize[]).map((vp) => {
              const icons = {
                desktop: Monitor,
                tablet: Tablet,
                mobile: Smartphone,
              };
              const Icon = icons[vp];
              return (
                <button
                  key={vp}
                  type="button"
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    viewport === vp
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                  onClick={() => setViewport(vp)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {vp}
                </button>
              );
            })}
          </div>

          {!showMock && (
            <span className="text-xs text-muted-foreground">
              Demo: gebruik <button type="button" className="text-primary hover:underline" onClick={() => navigateToUrl("/")}>/</button>
              {" "}of{" "}
              <button type="button" className="text-primary hover:underline" onClick={() => navigateToUrl("/contact")}>/contact</button>
              {" "}voor mock-site
            </span>
          )}

          {!isConvertMode && (
            <Button
              variant={annotateMode ? "default" : "outline"}
              size="sm"
              className="ml-auto"
              onClick={() => setAnnotateMode(!annotateMode)}
            >
              {annotateMode ? "Annoteren aan" : "Annoteren uit"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-auto bg-muted/50 p-4">
        <div
          ref={viewerRef}
          className="relative overflow-hidden rounded-xl border bg-background shadow-lg transition-all duration-300"
          style={{
            width: VIEWPORT_WIDTHS[viewport],
            maxWidth: "100%",
            minHeight: viewport === "mobile" ? "667px" : "600px",
          }}
        >
          <div ref={contentRef} className="relative min-h-[inherit]">
            {showMock ? (
              <MockWebsite pageUrl={pageUrl} />
            ) : (
              <>
                <iframe
                  src={pageUrl}
                  title="Website viewer"
                  className="h-full min-h-[inherit] w-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  onLoad={() => setIframeError(false)}
                  onError={() => setIframeError(true)}
                />
                {iframeError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/80 p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Deze website kan niet worden ingeladen (mogelijk
                      X-Frame-Options). Probeer een andere URL of de mock-site
                      via <code className="text-xs">/</code>.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div
            className={cn(
              "absolute inset-0",
              annotateMode ? "cursor-crosshair" : "pointer-events-none",
            )}
            onClick={handleOverlayClick}
          >
            {pageFeedback.map((item, index) => (
              <PinMarker
                key={item.id}
                item={item}
                index={index}
                isActive={activePinId === item.id}
                onClick={() =>
                  setActivePinId(activePinId === item.id ? null : item.id)
                }
              />
            ))}

            {pendingPin && <PendingPin x={pendingPin.x} y={pendingPin.y} />}
          </div>

          {pendingPin && (
            <FeedbackForm
              screenshotPreview={screenshotPreview}
              deviceLabel={DEVICE_TYPE_LABELS[getDeviceTypeFromOrientation()]}
              onSubmit={handleSubmitFeedback}
              onCancel={() => {
                setPendingPin(null);
                setScreenshotPreview("");
                if (isConvertMode && convertFromId) {
                  navigate(`/feedback/${convertFromId}`);
                }
              }}
              isSubmitting={isSubmitting}
              fixedType={isConvertMode ? "bug" : undefined}
              title={
                isConvertMode ? "Feature omzetten naar bug" : "Nieuwe feedback"
              }
              problemLabel={
                isConvertMode ? "Wat is de bug?" : "Probleem beschrijven"
              }
              submitLabel={isConvertMode ? "Omzetten naar bug" : "Opslaan"}
            />
          )}

          {activePinId && !pendingPin && (
            <div className="absolute bottom-4 left-4 right-4 z-40 mx-auto max-w-md rounded-xl border bg-popover p-4 shadow-lg">
              {(() => {
                const item = pageFeedback.find((f) => f.id === activePinId);
                if (!item) return null;
                return (
                  <>
                    <p className="mb-2 text-sm font-medium">
                      {item.problemDescription}
                    </p>
                    <Link
                      to={`/feedback/${item.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Bekijk details →
                    </Link>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getCssSelector(el: Element): string {
  if (el.id) return `#${el.id}`;
  if (el.className && typeof el.className === "string") {
    const classes = el.className
      .split(" ")
      .filter((c) => c && !c.startsWith("hover:"))
      .slice(0, 2);
    if (classes.length > 0) return `.${classes.join(".")}`;
  }
  return el.tagName.toLowerCase();
}
