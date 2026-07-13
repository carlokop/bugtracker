import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toPng } from "html-to-image";
import { ArrowLeft, Bug, MapPin, Monitor, Smartphone, Sparkles, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MockWebsite } from "@/mock/MockWebsite";
import { BugReportForm } from "@/components/feedback/BugReportForm";
import { FeatureDeliverForm } from "@/components/feedback/FeatureDeliverForm";
import { ViewerFeatureForm } from "@/components/feedback/ViewerFeatureForm";
import { PinMarker, PendingPin } from "@/components/viewer/PinMarker";
import { ViewerPageFeedbackList } from "@/components/viewer/ViewerPageFeedbackList";
import { ViewerUrlBar } from "@/components/viewer/ViewerUrlBar";
import { useAuthStore } from "@/store/useAuthStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { cn } from "@/lib/utils";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { getDeviceTypeFromOrientation } from "@/lib/device";
import { isMockPath, normalizeViewerUrl } from "@/lib/viewer-url";
import type { FeedbackItem, Project } from "@/types";
import { DEVICE_TYPE_LABELS } from "@/types";

type ViewportSize = "desktop" | "tablet" | "mobile";
type FeedbackTypeMode = "bug" | "feature";

const VIEWPORT_WIDTHS: Record<ViewportSize, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function ViewerPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const convertFeatureId = searchParams.get("convertFeature");
  const deliverFeatureId = searchParams.get("deliverFeature");
  const { currentUser } = useAuthStore();
  const { getProject } = useProjectStore();
  const {
    fetchFeedback,
    createBug,
    createFeature,
    convertFeatureToBug,
    deliverFeature,
    getFeedbackItem,
  } = useFeedbackStore();
  const { addNotification } = useNotificationStore();

  const [project, setProject] = useState<Project | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [pageUrl, setPageUrl] = useState("");
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [feedbackType, setFeedbackType] = useState<FeedbackTypeMode>("bug");
  const [markerActive, setMarkerActive] = useState(false);
  const [pendingPin, setPendingPin] = useState<{
    x: number;
    y: number;
    selector: string;
  } | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convertItem, setConvertItem] = useState<FeedbackItem | null>(null);
  const [deliverItem, setDeliverItem] = useState<FeedbackItem | null>(null);

  const isConvertMode = Boolean(
    convertFeatureId && convertItem?.type === "feature",
  );
  const isDeliverMode = Boolean(
    deliverFeatureId && deliverItem?.type === "feature",
  );
  const isSpecialMode = isConvertMode || isDeliverMode;
  const isAdmin = currentUser?.role === "admin";
  const canPlaceMarker = isSpecialMode || markerActive;

  const viewerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    if (mq.matches) setViewport("mobile");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setViewport("mobile");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const navigateToUrl = useCallback(
    (rawUrl: string) => {
      const normalized = normalizeViewerUrl(rawUrl, project?.targetUrl);
      setPageUrl(normalized);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("url", normalized);
          return next;
        },
        { replace: true },
      );
      setActivePinId(null);
      if (!isSpecialMode) {
        setPendingPin(null);
      }
    },
    [isSpecialMode, project?.targetUrl, setSearchParams],
  );

  useEffect(() => {
    if (!convertFeatureId) {
      setConvertItem(null);
      return;
    }
    getFeedbackItem(convertFeatureId).then((item) => {
      if (item?.type === "feature" && item.status === "delivered") {
        setConvertItem(item);
        const url = item.pageUrl ?? project?.targetUrl ?? "/";
        setPageUrl(url);
        setFeedbackType("bug");
        setMarkerActive(true);
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set("convertFeature", convertFeatureId);
            next.set("url", url);
            return next;
          },
          { replace: true },
        );
      } else {
        setConvertItem(null);
      }
    });
  }, [convertFeatureId, getFeedbackItem, project?.targetUrl, setSearchParams]);

  useEffect(() => {
    if (!deliverFeatureId) {
      setDeliverItem(null);
      return;
    }
    getFeedbackItem(deliverFeatureId).then((item) => {
      if (item?.type === "feature" && item.status === "in_progress") {
        setDeliverItem(item);
        const url =
          item.pageUrl ?? project?.targetUrl ?? searchParams.get("url") ?? "/";
        setPageUrl(url);
        setFeedbackType("bug");
        setMarkerActive(true);
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set("deliverFeature", deliverFeatureId);
            next.set("url", url);
            return next;
          },
          { replace: true },
        );
      } else {
        setDeliverItem(null);
      }
    });
  }, [deliverFeatureId, getFeedbackItem, project?.targetUrl, searchParams, setSearchParams]);

  useEffect(() => {
    if (!projectId) return;
    getProject(projectId).then((p) => {
      setProject(p ?? null);
      if (isSpecialMode) return;
      if (p) {
        const fromQuery = searchParams.get("url");
        const initial = fromQuery || p.targetUrl || "/";
        setPageUrl(initial);
        if (!fromQuery && p.targetUrl) {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set("url", p.targetUrl);
              return next;
            },
            { replace: true },
          );
        }
      }
    });
  }, [projectId, getProject, isSpecialMode]);

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
      return await toPng(contentRef.current, {
        quality: 0.85,
        pixelRatio: 1,
      });
    } catch {
      return "";
    }
  };

  const handleOverlayClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canPlaceMarker || pendingPin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const selector = target ? getCssSelector(target) : "unknown";

    setPendingPin({ x, y, selector });
    const screenshot = await captureScreenshot();
    setScreenshotPreview(screenshot);
  };

  const handleSubmitBug = async (
    problemDescription: string,
    definitionOfDone: string,
  ) => {
    if (!pendingPin || !projectId || !currentUser) return;
    setIsSubmitting(true);

    let screenshot = screenshotPreview;
    if (!screenshot) screenshot = await captureScreenshot();

    const deviceType = getDeviceTypeFromOrientation();

    if (isConvertMode && convertFeatureId) {
      const updated = await convertFeatureToBug(convertFeatureId, {
        pageUrl,
        cssSelector: pendingPin.selector,
        x: pendingPin.x,
        y: pendingPin.y,
        screenshotUrl: screenshot,
        problemDescription,
        definitionOfDone,
        deviceType,
      });

      await addNotification(
        project?.adminId ?? "user-admin-1",
        "status_change",
        convertFeatureId,
        "Feature omgezet naar bug door klant",
      );

      setIsSubmitting(false);
      navigate(`/feedback/${updated.id}`);
      return;
    }

    const item = await createBug(
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
      },
      currentUser.id,
    );

    if (currentUser.role === "client") {
      await addNotification(
        project?.adminId ?? "user-admin-1",
        "new_bug",
        item.id,
        `Nieuwe feedback op ${project?.name ?? "project"}`,
      );
    }

    setPendingPin(null);
    setScreenshotPreview("");
    setIsSubmitting(false);
    loadData();
  };

  const handleSubmitFeature = async (
    problemDescription: string,
    definitionOfDone: string,
  ) => {
    if (!pendingPin || !projectId || !currentUser) return;
    setIsSubmitting(true);

    const deviceType = getDeviceTypeFromOrientation();

    let screenshot = screenshotPreview;
    if (!screenshot) screenshot = await captureScreenshot();

    const item = await createFeature(
      {
        projectId,
        problemDescription,
        definitionOfDone,
        deviceType,
        pageUrl,
        cssSelector: pendingPin.selector,
        x: pendingPin.x,
        y: pendingPin.y,
        screenshotUrl: screenshot,
      },
      currentUser.id,
    );

    setPendingPin(null);
    setScreenshotPreview("");
    setMarkerActive(false);
    setIsSubmitting(false);
    loadData();
    navigate(`/feedback/${item.id}`);
  };

  const resetAnnotateState = () => {
    setPendingPin(null);
    setScreenshotPreview("");
  };

  const selectFeedbackType = (type: FeedbackTypeMode) => {
    if (type === feedbackType) return;
    setFeedbackType(type);
    resetAnnotateState();
  };

  const toggleMarkerActive = () => {
    setMarkerActive((active) => {
      if (active) resetAnnotateState();
      return !active;
    });
  };

  const handleSubmitDeliver = async (deliveryDescription: string) => {
    if (!pendingPin || !deliverFeatureId || !currentUser) return;
    setIsSubmitting(true);

    let screenshot = screenshotPreview;
    if (!screenshot) screenshot = await captureScreenshot();

    const updated = await deliverFeature(deliverFeatureId, {
      pageUrl,
      cssSelector: pendingPin.selector,
      x: pendingPin.x,
      y: pendingPin.y,
      screenshotUrl: screenshot,
      deliveryDescription,
      deviceType: getDeviceTypeFromOrientation(),
    });

    const projectMembers = await getProject(projectId!);
    if (projectMembers) {
      const notifyIds = new Set<string>();
      if (updated.createdBy) notifyIds.add(updated.createdBy);
      for (const id of notifyIds) {
        if (id !== currentUser.id) {
          await addNotification(
            id,
            "status_change",
            updated.id,
            "Feature is opgeleverd — beoordeling vereist",
          );
        }
      }
    }

    setIsSubmitting(false);
    navigate(`/feedback/${updated.id}`);
  };

  const pageBugs = feedbackItems.filter((f) => f.type === "bug");
  const pageFeatures = feedbackItems.filter((f) => f.type === "feature");

  const pagePins = feedbackItems.filter(
    (f) =>
      f.hasLocation &&
      f.pageUrl === pageUrl &&
      f.x != null &&
      f.y != null &&
      f.id !== convertFeatureId &&
      f.id !== deliverFeatureId,
  );

  const bugPinIndex = (item: FeedbackItem) =>
    pagePins.filter((p) => p.type === "bug").findIndex((p) => p.id === item.id);

  const showMock = isMockPath(pageUrl);
  const activeItem = pagePins.find((f) => f.id === activePinId);

  const pageTitle = isDeliverMode
    ? "Feature opleveren"
    : isConvertMode
      ? "Feature omzetten naar bug"
      : "Viewer";

  if (!project) {
    return <p className="text-muted-foreground">Project laden...</p>;
  }

  return (
    <div className="relative -mx-3 sm:-mx-4 lg:-mx-6">
      <div className="flex flex-col gap-3 border-b border-border/80 bg-background/95 px-3 py-3 backdrop-blur-sm sm:px-4">
        <div className="flex items-center gap-2">
          <Link
            to={
              isConvertMode && convertFeatureId
                ? `/feedback/${convertFeatureId}`
                : isDeliverMode && deliverFeatureId
                  ? `/feedback/${deliverFeatureId}`
                  : "/projects"
            }
          >
            <Button variant="ghost" size="icon" className="shrink-0" aria-label="Terug">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold sm:text-base">
              {project.name}
            </h1>
            <p className="truncate text-xs text-muted-foreground">{pageTitle}</p>
          </div>
          {!isSpecialMode && (
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant={feedbackType === "bug" ? "default" : "outline"}
                size="sm"
                onClick={() => selectFeedbackType("bug")}
              >
                <Bug className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Bug melden</span>
                <span className="sm:hidden">Bug</span>
              </Button>
              {isAdmin && (
                <Button
                  variant={feedbackType === "feature" ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectFeedbackType("feature")}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Feature
                </Button>
              )}
            </div>
          )}
        </div>

        {isDeliverMode && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
            Plaats een <strong className="text-foreground">marker</strong> waar
            de feature is gebouwd en leg uit wat de klant kan controleren.
          </div>
        )}

        {isConvertMode && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
            Plaats een <strong className="text-foreground">marker</strong> op de
            plek waar het niet klopt en beschrijf de bug.
          </div>
        )}

        {!isSpecialMode && (
          <>
            <ViewerUrlBar
              key={pageUrl}
              value={pageUrl}
              defaultUrl={project.targetUrl}
              onNavigate={navigateToUrl}
            />

            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl
                value={viewport}
                onChange={setViewport}
                size="sm"
                className="flex-1 sm:flex-none"
                options={[
                  { value: "mobile", label: "Mobiel", icon: Smartphone },
                  { value: "tablet", label: "Tablet", icon: Tablet },
                  { value: "desktop", label: "Desktop", icon: Monitor },
                ]}
              />
              <button
                type="button"
                className={cn(
                  "flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-all sm:h-10",
                  markerActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "bg-background text-muted-foreground hover:bg-accent",
                )}
                onClick={toggleMarkerActive}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {markerActive ? "Marker aan" : "Marker uit"}
                </span>
              </button>
            </div>

            {markerActive && (
              <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                {feedbackType === "bug"
                  ? "Tik op de pagina om een bug te melden"
                  : "Tik op de pagina om een feature toe te voegen"}
              </p>
            )}
          </>
        )}

        {isSpecialMode && (
          <p className="text-xs text-muted-foreground">
            Pagina: <span className="font-mono">{pageUrl}</span>
            {pageUrl !== "/" && (
              <button
                type="button"
                className="ml-2 text-primary hover:underline"
                onClick={() => navigateToUrl("/")}
              >
                Naar home
              </button>
            )}
            {pageUrl !== "/contact" && (
              <button
                type="button"
                className="ml-2 text-primary hover:underline"
                onClick={() => navigateToUrl("/contact")}
              >
                Naar contact
              </button>
            )}
          </p>
        )}
      </div>

      <div className="bg-muted/40">
        <div className="flex flex-col items-center px-3 py-4 sm:px-4">
          <div
            ref={viewerRef}
            className="relative overflow-hidden rounded-2xl border border-border/80 bg-background shadow-lg transition-all duration-300"
            style={{
              width: VIEWPORT_WIDTHS[viewport],
              maxWidth: "100%",
              minHeight: viewport === "mobile" ? "667px" : "600px",
            }}
          >
          <div ref={contentRef} className="relative min-h-[inherit]">
            {showMock ? (
              <MockWebsite pageUrl={pageUrl} onNavigate={navigateToUrl} />
            ) : (
              <iframe
                src={pageUrl}
                title="Website viewer"
                className="h-full min-h-[inherit] w-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            )}
          </div>

          <div
            className={cn(
              "absolute inset-0",
              canPlaceMarker ? "cursor-crosshair" : "pointer-events-none",
            )}
            onClick={handleOverlayClick}
          >
            {pagePins.map((item) => (
              <PinMarker
                key={item.id}
                item={item}
                index={item.type === "bug" ? bugPinIndex(item) : 0}
                isActive={activePinId === item.id}
                onClick={() =>
                  setActivePinId(activePinId === item.id ? null : item.id)
                }
              />
            ))}
            {pendingPin && <PendingPin x={pendingPin.x} y={pendingPin.y} />}
          </div>

          {pendingPin && isDeliverMode && deliverItem && (
            <FeatureDeliverForm
              featureTitle={deliverItem.problemDescription}
              screenshotPreview={screenshotPreview}
              deviceLabel={DEVICE_TYPE_LABELS[getDeviceTypeFromOrientation()]}
              onSubmit={handleSubmitDeliver}
              onCancel={() => {
                setPendingPin(null);
                setScreenshotPreview("");
                navigate(`/feedback/${deliverFeatureId}`);
              }}
              isSubmitting={isSubmitting}
            />
          )}

          {pendingPin && !isDeliverMode && feedbackType === "bug" && (
            <BugReportForm
              screenshotPreview={screenshotPreview}
              deviceLabel={DEVICE_TYPE_LABELS[getDeviceTypeFromOrientation()]}
              onSubmit={handleSubmitBug}
              onCancel={() => {
                resetAnnotateState();
                if (isConvertMode && convertFeatureId) {
                  navigate(`/feedback/${convertFeatureId}`);
                }
              }}
              isSubmitting={isSubmitting}
              title={
                isConvertMode ? "Feature omzetten naar bug" : "Bug melden"
              }
              submitLabel={
                isConvertMode ? "Omzetten naar bug" : "Bug opslaan"
              }
            />
          )}

          {pendingPin &&
            feedbackType === "feature" &&
            !isSpecialMode && (
              <ViewerFeatureForm
                screenshotPreview={screenshotPreview}
                deviceLabel={DEVICE_TYPE_LABELS[getDeviceTypeFromOrientation()]}
                onSubmit={handleSubmitFeature}
                onCancel={resetAnnotateState}
                isSubmitting={isSubmitting}
              />
            )}

          {activeItem && !pendingPin && (
            <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-2xl border border-border/80 bg-popover/95 p-4 shadow-xl backdrop-blur-sm sm:inset-x-auto sm:bottom-4 sm:left-4 sm:right-4">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                {activeItem.type === "feature" ? "Feature" : "Feedback"}
              </p>
              <p className="mb-2 text-sm font-medium">
                {activeItem.deliveryDescription ?? activeItem.problemDescription}
              </p>
              <Link
                to={`/feedback/${activeItem.id}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Bekijk details →
              </Link>
            </div>
          )}
          </div>
        </div>

        {!isSpecialMode && (
          <ViewerPageFeedbackList
            bugs={pageBugs}
            features={pageFeatures}
            pageUrl={pageUrl}
            activeItemId={activePinId}
            onItemClick={(item) =>
              setActivePinId(activePinId === item.id ? null : item.id)
            }
          />
        )}
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
