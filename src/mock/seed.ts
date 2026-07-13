import type {
  FeedbackComment,
  FeedbackItem,
  Notification,
  Project,
  ProjectMember,
  User,
} from "@/types";

export const MOCK_USERS: User[] = [
  {
    id: "user-admin-1",
    email: "dev@agency.nl",
    name: "Alex Developer",
    role: "admin",
  },
  {
    id: "user-client-1",
    email: "klant@bakkerij.nl",
    name: "Maria Bakker",
    role: "client",
  },
  {
    id: "user-client-2",
    email: "info@restaurant.nl",
    name: "Jan de Vries",
    role: "client",
  },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "Bakkerij Van Dijk",
    targetUrl: "https://bakkerijvandijk.nl",
    description: "Nieuwe website voor de bakkerij met online bestelformulier.",
    adminId: "user-admin-1",
    createdAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "proj-2",
    name: "Restaurant De Haven",
    targetUrl: "https://restaurantdehaven.nl",
    description: "Redesign van de homepage en reserveringspagina.",
    adminId: "user-admin-1",
    createdAt: "2026-06-15T14:30:00.000Z",
  },
];

export const MOCK_PROJECT_MEMBERS: ProjectMember[] = [
  { projectId: "proj-1", userId: "user-client-1" },
  { projectId: "proj-2", userId: "user-client-2" },
];

export const MOCK_FEEDBACK_ITEMS: FeedbackItem[] = [
  {
    id: "fb-1",
    projectId: "proj-1",
    pageUrl: "/",
    cssSelector: ".hero-cta",
    x: 320,
    y: 180,
    screenshotUrl: "",
    problemDescription: "De call-to-action knop is te klein op mobiel.",
    definitionOfDone: "De CTA-knop is minimaal 44px hoog en goed zichtbaar op mobiel.",
    type: "bug",
    status: "open",
    deviceType: "mobile",
    createdBy: "user-client-1",
    createdAt: "2026-07-01T09:15:00.000Z",
    updatedAt: "2026-07-01T09:15:00.000Z",
  },
  {
    id: "fb-2",
    projectId: "proj-1",
    pageUrl: "/",
    cssSelector: ".hero-title",
    x: 450,
    y: 95,
    screenshotUrl: "",
    problemDescription: "De titel overlapt met het logo op tablet.",
    definitionOfDone: "Titel en logo staan naast elkaar zonder overlap op tablet viewport.",
    type: "bug",
    status: "in_progress",
    deviceType: "tablet",
    createdBy: "user-client-1",
    createdAt: "2026-07-02T11:30:00.000Z",
    updatedAt: "2026-07-03T08:00:00.000Z",
  },
  {
    id: "fb-3",
    projectId: "proj-1",
    pageUrl: "/contact",
    cssSelector: ".contact-form",
    x: 200,
    y: 350,
    screenshotUrl: "",
    problemDescription: "Het contactformulier mist een veld voor telefoonnummer.",
    definitionOfDone: "Contactformulier bevat een optioneel telefoonnummerveld.",
    type: "feature",
    status: "in_review",
    deviceType: "desktop",
    createdBy: "user-client-1",
    createdAt: "2026-06-28T16:45:00.000Z",
    updatedAt: "2026-07-05T10:20:00.000Z",
  },
  {
    id: "fb-4",
    projectId: "proj-2",
    pageUrl: "/",
    cssSelector: ".menu-section",
    x: 150,
    y: 420,
    screenshotUrl: "",
    problemDescription: "Het menu is moeilijk leesbaar door het contrast.",
    definitionOfDone: "Menu-tekst voldoet aan WCAG AA contrast (min. 4.5:1).",
    type: "bug",
    status: "done",
    deviceType: "desktop",
    createdBy: "user-client-2",
    createdAt: "2026-06-20T13:00:00.000Z",
    updatedAt: "2026-06-25T09:00:00.000Z",
  },
];

export const MOCK_FEEDBACK_COMMENTS: FeedbackComment[] = [
  {
    id: "fc-1",
    feedbackItemId: "fb-2",
    userId: "user-admin-1",
    text: "Ik ga de responsive breakpoints aanpassen voor tablet.",
    createdAt: "2026-07-03T08:00:00.000Z",
  },
  {
    id: "fc-2",
    feedbackItemId: "fb-3",
    userId: "user-admin-1",
    text: "Telefoonnummer veld is toegevoegd. Kun je dit verifiëren?",
    createdAt: "2026-07-05T10:20:00.000Z",
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    userId: "user-admin-1",
    type: "new_feedback",
    referenceId: "fb-1",
    message: "Nieuwe feedback op Bakkerij Van Dijk",
    read: false,
    createdAt: "2026-07-01T09:15:00.000Z",
  },
  {
    id: "notif-2",
    userId: "user-client-1",
    type: "status_change",
    referenceId: "fb-3",
    message: "Feedback 'contactformulier' is gemarkeerd als klaar",
    read: false,
    createdAt: "2026-07-05T10:20:00.000Z",
  },
  {
    id: "notif-3",
    userId: "user-admin-1",
    type: "new_comment",
    referenceId: "fb-2",
    message: "Reactie op feedback 'titel overlapt'",
    read: true,
    createdAt: "2026-07-03T08:00:00.000Z",
  },
];
