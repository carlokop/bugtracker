# PRD: Bugtracker — Website Feedback & Annotatie Platform

## 1. Samenvatting

Bugtracker is een webapplicatie waarmee webdevelopers structureel feedback kunnen verzamelen op websites die zij bouwen. Een admin (developer/agency) maakt projecten aan en geeft klanten toegang. Klanten krijgen toegang tot een viewer waarin de website van het project wordt getoond met een transparante overlay. Klanten klikken op een specifiek element/gebied op de pagina en melden daar een bug. De developer kan in dezelfde viewer features aanmaken en opleveren. De developer beheert deze feedback-items (status, reacties), en beide partijen worden via notificaties en (in de doelarchitectuur) e-mail op de hoogte gehouden van updates.

Vergelijkbare bestaande producten ter referentie: Marker.io, BugHerd, Markup.io, PageProofer.

### 1.1 Status van de implementatie

De huidige codebase is een **frontend-only prototype** (React + TypeScript, Zustand als mock-datastore, geen backend/database/e-mail). Secties 6 (techstack) en delen van 4.4 (e-mail) beschrijven de **doelarchitectuur** en zijn nog niet gebouwd. De overige secties van dit document zijn bijgewerkt om de daadwerkelijke UX/gedrag van het prototype te volgen; waar het prototype (bewust of nog niet) afwijkt van het oorspronkelijke ontwerp staat dit expliciet vermeld, samen met een verwijzing naar [PLAN.md](./PLAN.md) waar relevant.

## 2. Doelen & Succescriteria

- Webdevelopers kunnen sneller, gestructureerder feedback van klanten verzamelen dan via e-mail/Word-documenten/screenshots.
- Klanten kunnen zonder technische kennis feedback geven direct op de plek waar het probleem zich voordoet.
- Feedback heeft een duidelijke status-cyclus (open → in behandeling → klaar → geverifieerd) zodat niets tussen wal en schip valt.
- Beide partijen blijven geïnformeerd via in-app notificaties en e-mail zonder de applicatie continu te moeten checken.

Succes = een developer kan binnen 5 minuten een project + klant aanmaken, en een klant kan zonder instructie feedback plaatsen op een element.

## 3. Rollen & Toegang

- **Admin (developer/agency)**: superuser. Maakt projecten aan, beheert klanten, ziet alle feedback van alle projecten, kan feedback van status wijzigen en beantwoorden.
- **Klant (client)**: toegang tot exact de projecten waarvoor hij/zij is uitgenodigd (kan er meerdere zijn). Ziet alleen data van "zijn" project(en). Kan feedback plaatsen, reageren op bestaande feedback, en (optioneel) status "geverifieerd/akkoord" zetten nadat de developer iets als "klaar" heeft gemarkeerd.
- (Toekomst, niet in MVP) **Teamlid/developer-rol** naast admin, voor agencies met meerdere developers per project.

Authenticatie: e-mail + wachtwoord, rol-gebaseerd (admin/klant).

**Huidige implementatie (prototype):** de admin maakt een klantaccount direct aan (e-mailadres + zelf gekozen wachtwoord) op de projectgebruikerspagina; er is nog geen invite-link/magic-link-e-mail en geen zelfservice wachtwoord-reset. Klant en admin kunnen daarna simpelweg inloggen met e-mail + wachtwoord. Invite-via-e-mail en wachtwoord-reset via e-mail blijven het doel voor de productieversie (zie sectie 6, e-mailprovider) en zijn afhankelijk van een backend.

## 4. Kernfunctionaliteit

### 4.1 Projectbeheer (admin)
- Project aanmaken met naam, doel-URL, omschrijving.
- Klanten toevoegen aan een project: admin maakt een klantaccount aan (e-mailadres + wachtwoord) op de projectgebruikerspagina — géén invite-e-mail in de huidige implementatie (zie 3, Authenticatie). Admin kan klantaccounts ook bewerken (e-mail/naam/wachtwoord) of verwijderen.
- Eén klant kan aan meerdere projecten gekoppeld zijn; bij meerdere projecten kiest de gebruiker na inloggen op een projectkeuzescherm welk project hij opent (bij precies één project wordt automatisch doorgeschakeld).
- Projectoverzicht (dashboard) met status/voortgang per project: aantal open/in behandeling/ter goedkeuring/gedaan bugs en aangevraagd/in ontwikkeling/opgeleverd/geaccepteerd features.

### 4.2 Website-viewer met overlay-annotatie
- Viewer toont de doelwebsite van het project in een frame, met een transparante overlay-laag erboven.
- **Bug melden (primair gebruik viewer, alle rollen):** gebruiker klikt op een element → pin/marker → automatisch screenshot → formulier ("Wat gaat er mis?" / "Hoe hoort het te werken?"). Pin, coördinaten, CSS-selector, pagina-URL en screenshot zijn **verplicht** voor bugs.
- **Feature aanmaken — huidige implementatie (admin-only):** in de viewer is de knop "Feature" alleen zichtbaar voor de admin. De admin plaatst een pin, vult "Wat wordt er gebouwd?" en "Acceptatiecriteria" in; het item krijgt direct status **Goedgekeurd** (de status "Aangevraagd" bestaat in het datamodel maar is in de huidige UI niet bereikbaar — er is geen manier voor een klant om zelf een feature aan te vragen). Dit is een bewuste vereenvoudiging van het prototype: features functioneren nu als een roadmap/aankondiging vanuit de developer, niet als een klantverzoek. Of klant-initiated feature-aanvragen (zoals oorspronkelijk bedoeld) alsnog wenselijk zijn, is een openstaande productbeslissing (zie sectie 8).
- Bij feature-oplevering plaatst de admin via een apart flow ("Locatie aangeven en opleveren") een pin + screenshot en een toelichting wat er gebouwd is; dit is dus altijd gekoppeld aan een locatie op de pagina, ook al is de pin bij het aanmaken van de feature optioneel.
- Elke bug-pin (en elke feature-pin, indien geplaatst) registreert: klik-coördinaten, CSS-selector, pagina-URL en screenshot.
- Bestaande pins worden getoond als klikbare markers op de pagina zodat je de discussie per punt kan volgen.
- Klanten kunnen feedback geven op elk apparaattype: desktop, tablet en mobiel. De viewer/overlay moet op al deze apparaten bruikbaar zijn.
- **Apparaattype — huidige implementatie:** wordt automatisch afgeleid uit viewportbreedte en schermoriëntatie op het moment van indienen, en getoond als label in het formulier (niet handmatig aan te passen door de gebruiker). Het apparaattype wordt bij het feedback-item opgeslagen en getoond/filterbaar in het overzicht. Een handmatige override (zoals oorspronkelijk bedoeld, voor het geval een klant bijvoorbeeld een mobiel-screenshot bekijkt maar feedback geeft vanaf desktop) is niet geïmplementeerd.

**Technische uitdaging — website embedden:** de meeste sites blokkeren embedding via `X-Frame-Options`/CSP. Aanbevolen aanpak voor de PRD:
- **MVP-aanpak (recommended):** een server-side proxy. De applicatie haalt de doel-URL server-side op, herschrijft relatieve links/assets naar de proxy, verwijdert/negeert blokkerende response-headers (`X-Frame-Options`, `frame-ancestors` in CSP), en injecteert een overlay-script in de HTML voordat deze aan de klant wordt getoond. Dit werkt zonder dat de klant iets aan hun eigen site moet aanpassen, en is de meest gebruiksvriendelijke optie voor een developer die feedback wil van een niet-technische klant.
- **Kanttekening:** sites met veel client-side JS-navigatie (SPA's), authenticatie-vereisten, of anti-scraping bescherming kunnen problemen geven via een proxy. Als fallback/toekomstige optie: een klein JS-snippet dat de klant zelf op hun (staging-)site plaatst, wat de overlay direct injecteert zonder proxy — betrouwbaarder maar vereist een technische stap bij de klant.
- Beide opties worden als open technisch risico benoemd in sectie 8; aanbevolen om dit met een technische spike te valideren voordat build start.

### 4.3 Feedback-beheer
- Lijst/overzicht per project (kanbanbord, drag & drop voor admin) met tabs **Bugs | Features | Alles**, filterbaar op status en pagina/URL.
- Twee typen feedback met aparte workflows:
  - **Bugs:** Open → In behandeling → Ter goedkeuring → Gedaan
  - **Features:** Aangevraagd → Goedgekeurd → In ontwikkeling → Opgeleverd → Geaccepteerd (zie 4.2 voor de huidige, admin-only manier waarop features worden aangemaakt)
- Bij bugs: developer neemt in behandeling → zet ter goedkeuring; klant keurt goed (**Gedaan**) of af (terug naar **In behandeling**). Bij features: admin start ontwikkeling → levert op met pin + toelichting; klant accepteert (**Geaccepteerd**) of wijst af (terug naar **In ontwikkeling**). Goedkeuring/acceptatie kan achteraf ongedaan gemaakt worden.
- Admin kan de status van elk item ook handmatig wijzigen via een dropdown, los van de knoppen-flow.
- Afgeronde items (bug: Gedaan, feature: Geaccepteerd) kunnen door de admin verwijderd worden (met bevestiging).
- Chronologische reacties per feedback-item: klant en developer kunnen om en om reageren op één item. **Let op:** dit is momenteel een platte lijst (geen echte "threads" met reply-op-reactie, en geen @mentions — dat blijft toekomstig werk).
- **Bug ↔ feature-koppeling (`linkedFeatureId`) — deels geïmplementeerd:** het datamodel en de store ondersteunen een koppeling van een bug aan een feature (`createBug` accepteert `linkedFeatureId`, `getBugsForFeature` haalt gekoppelde bugs op), maar er is nog **geen UI** om deze koppeling te maken of te tonen (geen "Bug melden bij deze feature"-knop, geen sectie met gerelateerde bugs op de feature-detailpagina). Zie [PLAN.md](./PLAN.md) fase 2.
- **"Omzetten naar bug" (`convertFeatureToBug`) — wél geïmplementeerd, in tegenspraak met de oorspronkelijke intentie:** een klant kan een opgeleverde feature (status Opgeleverd) via de viewer omzetten naar een bug-item. Dit **overschrijft het bestaande feature-item** (type en status wijzigen, feature-data gaat verloren) in plaats van er een nieuwe, gekoppelde bug bij aan te maken. Dit is dus het tegenovergestelde van de "geen type-wissel"-aanpak die in sectie 10 als uitgangspunt staat. Dit moet nog opgelost worden: [PLAN.md](./PLAN.md) beschrijft het voornemen om `convertFeatureToBug` te verwijderen ten gunste van de koppeling hierboven — dat is nog niet uitgevoerd.
- Toewijzen van feedback aan een specifieke developer (bij meerdere teamleden, toekomst).

### 4.4 Notificaties & e-mail
- In-app notificaties: nieuwe bug/feature, nieuwe reactie, status-wijziging. **Huidige implementatie:** dit zijn mock in-app notificaties in de store; er is nog geen zichtbaar notificatiecentrum-overzicht met leesstatus-beheer, geen @mentions en geen e-mailverzending.
- E-mailnotificaties bij dezelfde events, met instelbare voorkeuren (direct / dagelijkse samenvatting / uit) per gebruiker — **niet geïmplementeerd**, vereist backend + e-mailprovider.
- Transactionele e-mails: uitnodiging klant, wachtwoord-reset, verificatie — **niet geïmplementeerd** (zie 3, Authenticatie).
- E-mail verzending via een provider (bv. Postmark/SendGrid/Resend) — geen eigen mailserver.

### 4.5 Dashboard
- Admin: overzicht van alle projecten met open/klaar-telling, recente activiteit.
- Klant: overzicht van het/de eigen project(en) met status van hun feedback.

## 5. Niet-functionele eisen

- Responsief werkend in de browser op desktop, tablet en mobiel: klanten moeten op elk van deze apparaattypen feedback kunnen geven.
- Feedback-data en screenshots worden per project geïsoleerd opgeslagen (klant A mag nooit data van klant B/project B zien).
- Basale audit-log: wie heeft wanneer welke statuswijziging gedaan.

## 6. Voorgestelde techstack

- **Backend:** Node.js (bv. Express of Fastify), REST API.
- **Database:** PostgreSQL (gekozen i.p.v. MySQL — betere JSON/JSONB-ondersteuning voor annotatie-metadata zoals selectors/coördinaten, en robuuste full-text/filtering mogelijkheden).
- **ORM:** Prisma.
- **Frontend:** React SPA met TypeScript, gebundeld met Webpack. Geen Next.js en geen server-side rendering — een pure client-side single-page app die via de backend-API praat. Overlay/annotatie-laag als losse client-side module (canvas/DOM-positionering boven de proxy-iframe).
- **Auth:** sessie- of JWT-gebaseerd, met rol-gebaseerde autorisatie (admin vs klant) en project-scoped toegang.
- **E-mail:** transactionele e-mailprovider (Postmark/Resend/SendGrid) via API.
- **Opslag screenshots:** lokale opslag op de server (bestandssysteem), geen externe object storage nodig.
- **Hosting:** draait direct op de server (bv. via een process manager zoals PM2); geen Docker-container vereist.

## 7. Datamodel (high-level)

- `users` (id, email, naam, wachtwoord-hash, rol: admin/client)
- `projects` (id, naam, doel_url, omschrijving, admin_id, aangemaakt_op)
- `project_members` (project_id, user_id) — koppeltabel klant↔project
- `feedback_items` (id, project_id, type: bug/feature, status, problem_description, definition_of_done, apparaattype, pagina_url/css_selector/x/y/screenshot_url **(verplicht voor bugs, optioneel voor features)**, has_location, linked_feature_id **(bugs)**, aangemaakt_door, aangemaakt_op, bijgewerkt_op)
- `feedback_comments` (id, feedback_item_id, user_id, tekst, aangemaakt_op)
- `notifications` (id, user_id, type, referentie_id, gelezen, aangemaakt_op)

## 8. Open vragen / risico's (te valideren voor build)

- Proxy-aanpak voor het embedden van de doelsite: technische spike nodig om te bepalen hoe robuust dit werkt tegen SPA's, auth-vereisten en dynamische content op echte klantsites.
- Hoe om te gaan met wachtwoord-beveiligde staging-omgevingen van klanten (basic auth / login-flow doorgeven via de proxy)?
- Screenshot-generatie (nu verplicht bij elk feedback-item, dus kritiek pad): server-side (bv. headless browser) of client-side canvas-capture van het zichtbare gebied? Moet robuust en snel genoeg zijn om de feedback-flow niet te vertragen, en werken op desktop/tablet/mobiel.
- Mate van real-time nodig (bv. WebSockets voor live notificaties) versus polling — voorstel: polling/refresh voor MVP, WebSockets als latere iteratie.
- Overlay/pin-interactie op tablet en mobiel (touch-precisie, kleinere viewport, geen hover-states) vereist mogelijk een aangepaste interactie-flow t.o.v. desktop — te valideren met een UX-spike.

## 9. Fasering (voorstel)

- **Fase 1 (MVP):** auth, projecten + klant-uitnodigingen, proxy-viewer met overlay (responsief voor desktop/tablet/mobiel), pin plaatsen + tekst-feedback + apparaattype-selectie + verplichte screenshot per feedback-item, statuscyclus, e-mailnotificaties (direct, geen digest), basis dashboard.
- **Fase 2:** threaded reacties, in-app notificatiecentrum, e-mail-voorkeuren/digest.
- **Fase 3:** meerdere developer-teamleden per project, toewijzen van feedback, audit-log.

## 10. Out of scope (voor nu)

- Ondersteuning voor native mobile apps (alleen websites).
- Automatische visuele regressie-detectie (screenshot-diffing tussen versies).
- Facturatie/abonnementen (multi-tenant SaaS-billing).
- Feature-prioriteit en `rejected`-status met reden.
- Klant-initiated feature-aanvragen (in de huidige implementatie maakt alleen de admin features aan, zie 4.2) — expliciete productbeslissing nodig of dit terugkomt.
- **Nog niet out of scope, maar wel inconsistent met het product:** `convertFeatureToBug` bestaat nog in de code (zie 4.3) terwijl het uitgangspunt is dat er géén type-wissel tussen bug en feature is. Dit moet volgens [PLAN.md](./PLAN.md) verwijderd worden ten gunste van een bug↔feature-koppeling; tot die opruiming is uitgevoerd is "geen type-wissel" dus nog geen feit in de huidige codebase.
