# Plan: Bugs en features scheiden

> **Status:** concept  
> **Datum:** 13 juli 2026  
> **Gerelateerd:** [PRD.md](./PRD.md)  
> **Doel:** klanten kunnen bugs op de pagina aanwijzen én features voorstellen — als twee duidelijke taken, niet als één verwarrende flow.

---

## Inhoudsopgave

1. [Probleemanalyse](#1-probleemanalyse)
2. [Gewenste situatie](#2-gewenste-situatie)
3. [Ontwerpkeuzes](#3-ontwerpkeuzes)
4. [Fasering](#4-fasering)
5. [Datamodel](#5-datamodel)
6. [UI & flows](#6-ui--flows)
7. [Bestanden & wijzigingen](#7-bestanden--wijzigingen)
8. [Acceptatiecriteria](#8-acceptatiecriteria)
9. [Risico's](#9-risicos)
10. [PRD-wijzigingen](#10-prd-wijzigingen)
11. [Out of scope](#11-out-of-scope)

---

## 1. Probleemanalyse

### Huidige situatie

De applicatie behandelt bugs en features als één `FeedbackItem` met een `type`-toggle. Beide doorlopen dezelfde flow:

1. Klik op de pagina → pin plaatsen
2. Screenshot maken (verplicht)
3. Formulier invullen (“Probleem beschrijven” + “Definition of done”)
4. Opslaan op hetzelfde kanban-bord

Daarnaast bestaat een `convertFeatureToBug`-flow: een feature-item wordt overschreven met bug-data nadat de klant opnieuw een pin plaatst.

### Waarom dit onlogisch is

| Probleem | Impact |
|---|---|
| Pin is verplicht voor alles | Features zoals “voeg dark mode toe” hebben geen zinvolle locatie op de pagina |
| Zelfde formulier voor beide types | “Probleem beschrijven” en “Definition of done” passen niet bij feature-wensen |
| Bug/feature-toggle ná het klikken | De klant weet niet vooraf welke actie hij uitvoert |
| `convertFeatureToBug` | Overschrijft het feature-item; oorspronkelijke wens gaat verloren |
| Eén statusflow | Features hebben een andere levenscyclus dan bugs (goedkeuring vóór bouw) |
| Geen koppeling | “Feature slecht gebouwd” is een bug *bij* een feature, geen type-wissel |

### Wat klanten echt willen doen

1. **Bug melden** — “Hier op de pagina gaat iets mis” → locatie, screenshot, beschrijving van het probleem.
2. **Feature voorstellen** — “Ik wil iets nieuws” → beschrijving van de wens, optioneel een plek op de site.
3. **Feature niet goed uitgevoerd** — “De feature is gebouwd maar werkt fout” → nieuwe bug, gekoppeld aan de bestaande feature.

---

## 2. Gewenste situatie

### Kernprincipes

- **Bugs zijn locatiegebonden** — pin + screenshot verplicht.
- **Features zijn intentiegebonden** — tekst verplicht, locatie optioneel.
- **Geen type-wissel** — koppel bugs aan features in plaats van omzetten.
- **Aparte workflows** — elk type heeft eigen statussen en acties.
- **Duidelijke ingangen** — de klant kiest de taak vóór het invullen, niet erna.

### Overzicht per type

| Aspect | Bug | Feature |
|---|---|---|
| Vraag | Wat gaat er mis? | Wat wil je nieuw? |
| Pin op pagina | Verplicht | Optioneel |
| Screenshot | Verplicht | Optioneel (alleen bij pin) |
| Veld 1 | Wat gaat er mis? | Wat wil je bereiken? |
| Veld 2 | Hoe hoort het te werken? | Wanneer ben je tevreden? |
| Aanmaken via | Viewer (annotatiemodus) | Formulier op bord of viewer |
| Workflow | Open → In behandeling → Ter goedkeuring → Gedaan | Aangevraagd → Goedgekeurd → In ontwikkeling → Opgeleverd → Geaccepteerd |
| Koppeling | Kan `linkedFeatureId` hebben | Heeft gerelateerde bugs |

---

## 3. Ontwerpkeuzes

### 3.1 Terminologie (UI)

| Intern (code) | UI (Nederlands) |
|---|---|
| `bug` | Bug melden |
| `feature` | Idee voorstellen |
| `problemDescription` | Wat gaat er mis? / Wat wil je bereiken? |
| `definitionOfDone` | Hoe hoort het te werken? / Wanneer ben je tevreden? |

### 3.2 Statusflows

**Bugs** (`BugStatus`):

```
open → in_progress → in_review → done
```

| Status | Label | Wie acteert |
|---|---|---|
| `open` | Open | Developer pakt op |
| `in_progress` | In behandeling | Developer werkt eraan |
| `in_review` | Ter goedkeuring | Klant of admin keurt goed/af |
| `done` | Gedaan | Afgerond |

**Features** (`FeatureStatus`):

```
requested → approved → in_progress → delivered → accepted
```

| Status | Label | Wie acteert |
|---|---|---|
| `requested` | Aangevraagd | Admin keurt goed of wijst af |
| `approved` | Goedgekeurd | Admin start ontwikkeling |
| `in_progress` | In ontwikkeling | Admin levert op |
| `delivered` | Opgeleverd | Klant accepteert of wijst af |
| `accepted` | Geaccepteerd | Afgerond |

### 3.3 Koppeling bug ↔ feature

- Een bug kan optioneel `linkedFeatureId` hebben.
- Bij “Bug melden bij deze feature” wordt een **nieuw** bug-item aangemaakt; het feature-item blijft ongewijzigd.
- Op feature-detail: lijst met gerelateerde bugs.
- Op bug-detail: link naar de gekoppelde feature.

### 3.4 Wat we verwijderen

- `convertFeatureToBug` (store + UI + query-param `convertFrom`)
- `updateType` (type wijzigen achteraf)
- Bug/feature-toggle in het pin-formulier
- `ConvertFeatureToBugInput` type

---

## 4. Fasering

### Overzicht

| Fase | Naam | Duur | Oplevert |
|---|---|---|---|
| 0 | Voorbereiding | ½ dag | Beslissingen + PRD-update |
| 1 | UX-scheiding | 2–3 dagen | Twee flows, tabs op bord |
| 2 | Koppeling | 2 dagen | Bug ↔ feature relatie |
| 3 | Workflows | 1–2 dagen | Aparte statusacties per type |
| 4 | Afronding | 1 dag | Mock data, copy, polish |

**Totaal:** ~6–8 dagen

```
Fase 0 ──► Fase 1 ──► Fase 2 ──► Fase 3 ──► Fase 4
 besluiten   UX         koppeling   workflows   polish
```

---

### Fase 0 — Voorbereiding

**Doel:** scope en terminologie vastleggen vóór code.

#### Taken

- [ ] Terminologie en statusflows accorderen (sectie 3)
- [ ] PRD secties 4.2, 4.3 en 7 bijwerken (zie [sectie 10](#10-prd-wijzigingen))
- [ ] Dit plan reviewen en status op “goedgekeurd” zetten

#### Deliverable

- Bijgewerkte PRD + goedgekeurd PLAN.md

---

### Fase 1 — UX-scheiding

**Doel:** twee duidelijke ingangen, zonder groot datamodel-refactor.

#### 1.1 Viewer: twee modi

**Bestand:** `src/pages/ViewerPage.tsx`

- [ ] Toolbar met twee knoppen: **Bug melden** en **Idee voorstellen**
- [ ] Bug-modus: annotatiemodus aan, klik = pin + screenshot + `BugReportForm`
- [ ] Feature-modus: `FeatureRequestForm` als overlay/modal, geen pin verplicht
- [ ] Optioneel in feature-modus: “Locatie op de site aangeven” → schakelt tijdelijk pin-modus in
- [ ] Verwijder `convertFrom` / `isConvertMode` logica volledig
- [ ] Verwijder bug/feature-toggle uit pin-flow

#### 1.2 Nieuwe formulieren

**Nieuw:** `src/components/feedback/BugReportForm.tsx`

- Pin-preview (screenshot)
- Apparaattype (automatisch)
- “Wat gaat er mis?”
- “Hoe hoort het te werken?”
- Opslaan / Annuleren

**Nieuw:** `src/components/feedback/FeatureRequestForm.tsx`

- “Wat wil je bereiken?”
- “Wanneer ben je tevreden?”
- Checkbox/toggle: “Locatie op de site aangeven”
- Bij locatie: pin-flow met optionele screenshot
- Opslaan / Annuleren

**Verwijderen of refactoren:** `src/components/feedback/FeedbackForm.tsx`

#### 1.3 Store-validatie

**Bestand:** `src/store/useFeedbackStore.ts`

- [ ] Bij `createFeedback` met `type: "bug"`: valideer dat pin, screenshot en coördinaten aanwezig zijn
- [ ] Bij `type: "feature"`: pin/screenshot optioneel; `hasLocation: boolean` zetten

**Bestand:** `src/types/index.ts`

- [ ] `CreateFeatureInput` met optionele locatievelden
- [ ] `hasLocation?: boolean` op `FeedbackItem`

#### 1.4 Feedbackbord: tabs

**Bestand:** `src/pages/FeedbackBoardPage.tsx`

- [ ] Tabs: **Bugs | Features | Alles**
- [ ] Filter items op `type`
- [ ] Kolomtitels blijven bug-statussen in Fase 1; feature-kolommen in Fase 3

#### 1.5 Detailpagina opschonen

**Bestand:** `src/pages/FeedbackDetailPage.tsx`

- [ ] Verwijder “Omzetten naar bug”-sectie
- [ ] Verwijder “Type wijzigen naar feature”-knop
- [ ] Labels conditioneel per `item.type`

#### Te verwijderen in Fase 1

| Locatie | Wat |
|---|---|
| `useFeedbackStore.ts` | `convertFeatureToBug`, `updateType` |
| `types/index.ts` | `ConvertFeatureToBugInput` |
| `ViewerPage.tsx` | `convertFrom` query-param, `convertItem` state |

---

### Fase 2 — Koppeling bug ↔ feature

**Doel:** bugs kunnen gekoppeld worden aan features zonder type-wissel.

#### 2.1 Types uitbreiden

**Bestand:** `src/types/index.ts`

```ts
export interface FeedbackItem {
  // ...bestaande velden
  linkedFeatureId?: string;  // alleen op bugs
  hasLocation?: boolean;     // alleen op features
}
```

#### 2.2 Store-functies

**Bestand:** `src/store/useFeedbackStore.ts`

- [ ] `createBug(input, userId, linkedFeatureId?)` — wrapper om `createFeedback`
- [ ] `createFeature(input, userId)` — wrapper met optionele locatie
- [ ] `getBugsForFeature(featureId): FeedbackItem[]`
- [ ] `getFeaturesForProject(projectId): FeedbackItem[]`

#### 2.3 “Bug melden bij deze feature”

**Bestand:** `src/pages/FeedbackDetailPage.tsx`

- [ ] Op feature-detail: knop **Bug melden bij deze feature**
- [ ] Link naar `/projects/:id/viewer?linkFeature=:featureId&mode=bug`

**Bestand:** `src/pages/ViewerPage.tsx`

- [ ] Lees `linkFeature` query-param
- [ ] Bij submit: nieuw bug-item met `linkedFeatureId`
- [ ] Feature-item blijft ongewijzigd
- [ ] Notificatie: “Bug gekoppeld aan feature”

#### 2.4 Koppelingen tonen

- [ ] Feature-detail: sectie “Gerelateerde bugs” met links
- [ ] Bug-detail: badge/link “Hoort bij feature #X”

---

### Fase 3 — Workflows en notificaties

**Doel:** bugs en features doorlopen hun eigen levenscyclus.

#### 3.1 Feature-workflow (admin)

**Bestand:** `src/components/feedback/FeedbackItemActions.tsx`

| Huidige status | Actie (admin) | Nieuwe status |
|---|---|---|
| `requested` | Goedkeuren | `approved` |
| `requested` | Afwijzen | verwijderen of `rejected` (toekomst) |
| `approved` | Start ontwikkeling | `in_progress` |
| `in_progress` | Opleveren | `delivered` |

| Huidige status | Actie (klant) | Nieuwe status |
|---|---|---|
| `delivered` | Accepteren | `accepted` |
| `delivered` | Afwijzen | `in_progress` |

#### 3.2 Bug-workflow (ongewijzigd)

- Developer wijzigt status via dropdown
- Klant: “Aangeven als gedaan” bij `in_progress` → `in_review`
- Beide: goedkeuren / afkeuren bij `in_review`

#### 3.3 Feature-kanban kolommen

**Bestand:** `src/pages/FeedbackBoardPage.tsx`

- [ ] Bij tab “Features”: kolommen `requested | approved | in_progress | delivered | accepted`
- [ ] Bij tab “Bugs”: bestaande kolommen `open | in_progress | in_review | done`

#### 3.4 Notificaties

**Bestand:** `src/types/index.ts`, `src/store/useNotificationStore.ts`

- [ ] `new_bug` en `new_feature` als notification types (of onderscheid in message)
- [ ] “Feature goedgekeurd”
- [ ] “Feature opgeleverd — acceptatie vereist”
- [ ] “Bug gekoppeld aan feature #X”

#### 3.5 Dashboard

**Bestand:** `src/pages/DashboardPage.tsx`

- [ ] Aparte tellingen: open bugs vs aangevraagde features
- [ ] Recente activiteit per type

---

### Fase 4 — Afronding en polish

#### Taken

- [ ] Mock data bijwerken (`src/mock/seed.ts`):
  - Features met en zonder pin
  - Bug gekoppeld aan feature
  - Items in diverse feature-statussen
- [ ] Lege staten en helpteksten in viewer en bord
- [ ] Feature zonder screenshot: placeholder in detailweergave
- [ ] Navigatie-labels evalueren (“Feedback” → “Bugs & ideeën”?)
- [ ] PRD definitief synchroniseren met implementatie
- [ ] Lint + build controleren

---

## 5. Datamodel

### Huidig (vereenvoudigd)

```
feedback_items
  id, project_id, page_url, css_selector, x, y,
  screenshot_url, problem_description, definition_of_done,
  type (bug|feature), status, device_type,
  created_by, created_at, updated_at
```

### Nieuw

```
feedback_items
  id, project_id,
  type (bug|feature),
  status,                    -- BugStatus | FeatureStatus (gevalideerd per type)
  problem_description,
  definition_of_done,
  device_type,
  -- Locatie (verplicht voor bugs, optioneel voor features)
  page_url,                  -- nullable voor features zonder locatie
  css_selector,              -- nullable
  x, y,                      -- nullable
  screenshot_url,            -- nullable voor features zonder locatie
  has_location,              -- boolean, default false
  linked_feature_id,         -- nullable, alleen op bugs (FK → feedback_items.id)
  created_by, created_at, updated_at
```

### TypeScript types (doel)

```ts
export type BugStatus = "open" | "in_progress" | "in_review" | "done";
export type FeatureStatus =
  | "requested"
  | "approved"
  | "in_progress"
  | "delivered"
  | "accepted";

export type FeedbackType = "bug" | "feature";

export interface FeedbackItem {
  id: string;
  projectId: string;
  type: FeedbackType;
  status: BugStatus | FeatureStatus;
  problemDescription: string;
  definitionOfDone: string;
  deviceType: DeviceType;
  pageUrl: string | null;
  cssSelector: string | null;
  x: number | null;
  y: number | null;
  screenshotUrl: string | null;
  hasLocation: boolean;
  linkedFeatureId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### Validatieregels

| Regel | Bug | Feature |
|---|---|---|
| `problemDescription` verplicht | ✓ | ✓ |
| `definitionOfDone` verplicht | ✓ | ✓ |
| `pageUrl` + coördinaten + screenshot | Verplicht | Alleen als `hasLocation` |
| `linkedFeatureId` | Optioneel | N.v.t. |
| Status transitie | Alleen `BugStatus` | Alleen `FeatureStatus` |

---

## 6. UI & flows

### 6.1 Bug melden (klant)

```
Viewer openen
  → "Bug melden" actief
  → Klik op pagina (pin)
  → Screenshot automatisch
  → BugReportForm invullen
  → Opslaan
  → Pin zichtbaar op pagina + item op bug-bord (status: open)
```

### 6.2 Feature voorstellen (klant)

```
Viewer of feedbackbord
  → "Idee voorstellen"
  → FeatureRequestForm (geen pin nodig)
  → Optioneel: "Locatie aangeven" → pin plaatsen
  → Opslaan
  → Item op feature-bord (status: aangevraagd)
```

### 6.3 Bug melden bij feature (klant)

```
Feature-detail openen
  → "Bug melden bij deze feature"
  → Viewer met linkFeature-param
  → Pin plaatsen op foutlocatie
  → BugReportForm invullen
  → Opslaan als nieuw bug-item met linkedFeatureId
  → Feature blijft ongewijzigd
```

### 6.4 Feature-workflow (admin + klant)

```
Klant: idee voorstellen (requested)
  → Admin: goedkeuren (approved)
  → Admin: start ontwikkeling (in_progress)
  → Admin: opleveren (delivered)
  → Klant: accepteren (accepted) of afwijzen (terug naar in_progress)
```

### 6.5 Bug-workflow (bestaand)

```
Klant: bug melden (open)
  → Admin: in behandeling (in_progress)
  → Klant: aangeven als gedaan (in_review)
  → Admin/klant: goedkeuren (done) of afkeuren (in_progress)
```

### 6.6 Schermstructuur per project

```
Project
├── Viewer          → primair voor bugs (+ optionele feature-locatie)
├── Feedbackbord
│   ├── Tab: Bugs
│   ├── Tab: Features
│   └── Tab: Alles
└── Detailpagina    → per item, type-specifieke acties
```

---

## 7. Bestanden & wijzigingen

### Nieuw

| Bestand | Beschrijving |
|---|---|
| `src/components/feedback/BugReportForm.tsx` | Formulier voor bug met pin |
| `src/components/feedback/FeatureRequestForm.tsx` | Formulier voor feature, pin optioneel |
| `PLAN.md` | Dit document |

### Groot (significante wijzigingen)

| Bestand | Wijziging |
|---|---|
| `src/pages/ViewerPage.tsx` | Twee modi, verwijder convert-flow, linkFeature |
| `src/pages/FeedbackDetailPage.tsx` | Type-specifieke UI, koppelingen, verwijder convert |
| `src/pages/FeedbackBoardPage.tsx` | Tabs, feature-kanban kolommen |
| `src/types/index.ts` | BugStatus, FeatureStatus, linkedFeatureId, nullable locatie |
| `src/store/useFeedbackStore.ts` | Nieuwe functies, validatie, verwijder convert |

### Medium

| Bestand | Wijziging |
|---|---|
| `src/components/feedback/FeedbackItemActions.tsx` | Acties per type + status |
| `src/components/feedback/KanbanCard.tsx` | Feature zonder screenshot weergave |
| `src/components/feedback/StatusBadge.tsx` | Feature-status labels |
| `src/pages/DashboardPage.tsx` | Tellingen per type |
| `src/mock/seed.ts` | Nieuwe voorbeelddata |
| `PRD.md` | Zie sectie 10 |

### Verwijderen / deprecaten

| Bestand | Wat |
|---|---|
| `src/components/feedback/FeedbackForm.tsx` | Vervangen door BugReportForm + FeatureRequestForm |
| `useFeedbackStore.ts` | `convertFeatureToBug`, `updateType` |
| `types/index.ts` | `ConvertFeatureToBugInput` |

---

## 8. Acceptatiecriteria

### Fase 1 (MVP UX)

- [ ] Klant kan een bug melden door op de pagina te klikken
- [ ] Klant kan een feature voorstellen zonder pin te plaatsen
- [ ] Klant kan een feature voorstellen mét optionele locatie
- [ ] Geen bug/feature-toggle meer in één formulier
- [ ] Feedbackbord heeft tabs Bugs / Features / Alles
- [ ] `convertFeatureToBug` is volledig verwijderd

### Fase 2 (Koppeling)

- [ ] Klant kan een bug melden bij een bestaande feature
- [ ] Feature-item blijft intact na bug-melding
- [ ] Koppeling zichtbaar op feature-detail (gerelateerde bugs)
- [ ] Koppeling zichtbaar op bug-detail (link naar feature)

### Fase 3 (Workflows)

- [ ] Feature doorloopt volledige eigen statusflow
- [ ] Bug-workflow werkt ongewijzigd
- [ ] Notificaties onderscheiden bug vs feature events
- [ ] Dashboard toont aparte tellingen per type

### Fase 4 (Polish)

- [ ] Mock data dekt alle scenario's
- [ ] PRD is gesynchroniseerd met implementatie
- [ ] Build en lint slagen

### Eindcriterium (gebruikerstest)

> Een klant kan zonder instructie een bug op de pagina aanwijzen én een feature voorstellen, en begrijpt het verschil tussen beide acties.

---

## 9. Risico's

| Risico | Kans | Impact | Mitigatie |
|---|---|---|---|
| `BugStatus \| FeatureStatus` union wordt complex | Medium | Medium | Validatie in store per `type`; overweeg later aparte tabellen |
| Bestaande mock-data breekt | Hoog | Laag | Migratie in `seed.ts` bij start Fase 1 |
| Feature zonder pin past niet op kanban | Medium | Laag | Kaart zonder screenshot + icoon “geen locatie” |
| PRD en code lopen uit elkaar | Medium | Medium | PRD updaten in Fase 0 en 4 |
| Feature-kanban met 5 kolommen past niet op mobiel | Medium | Laag | Horizontaal scrollen (zoals nu) of compacte weergave |
| Nullable locatievelden breken bestaande componenten | Medium | Medium | `FeedbackScreenshot` conditioneel renderen |

---

## 10. PRD-wijzigingen

Na goedkeuring van dit plan moeten de volgende PRD-secties worden bijgewerkt:

### Sectie 4.2 — Website-viewer

**Was:** pin + screenshot verplicht voor alle feedback.

**Wordt:**
- Viewer is primair voor **bug-meldingen** (pin + screenshot verplicht).
- **Feature-aanvragen** kunnen ook via een apart formulier, zonder pin.
- Optioneel: feature met locatie via pin in de viewer.

### Sectie 4.3 — Feedback-beheer

**Was:** één statusflow voor alle feedback.

**Wordt:**
- Twee typen: bugs en features.
- Bug-statussen: Open → In behandeling → Ter goedkeuring → Gedaan.
- Feature-statussen: Aangevraagd → Goedgekeurd → In ontwikkeling → Opgeleverd → Geaccepteerd.
- Bugs kunnen gekoppeld worden aan features (`linked_feature_id`).
- Geen type-wissel; “feature slecht gebouwd” = nieuwe bug gekoppeld aan feature.

### Sectie 7 — Datamodel

**Was:** `feedback_items` met verplichte screenshot en één status.

**Wordt:** zie [sectie 5](#5-datamodel) van dit plan.

### Sectie 10 — Out of scope

**Toevoegen:**
- Type-wissel (bug ↔ feature)
- `convertFeatureToBug`-flow

---

## 11. Out of scope

De volgende items vallen **niet** onder dit plan:

- Backend API en database-implementatie (nu mock/Zustand)
- Feature-prioriteit of story points
- Admin “feature afwijzen” met reden (status `rejected`)
- E-mailnotificaties per type (alleen in-app mock)
- Aparte API-endpoints `/bugs` en `/features`
- Native mobile apps

---

## Changelog

| Datum | Wijziging |
|---|---|
| 2026-07-13 | Eerste versie op basis van UX-analyse bugs vs features |
