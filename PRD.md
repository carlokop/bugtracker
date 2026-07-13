# PRD: Bugtracker — Website Feedback & Annotatie Platform

## 1. Samenvatting

Bugtracker is een webapplicatie waarmee webdevelopers structureel feedback kunnen verzamelen op websites die zij bouwen. Een admin (developer/agency) maakt projecten aan en nodigt klanten uit. Klanten krijgen toegang tot een viewer waarin de website van het project wordt getoond met een transparante overlay. Klanten klikken op een specifiek element/gebied op de pagina en geven daar contextuele feedback op. De developer beheert deze feedback-items (status, reacties), en beide partijen worden via notificaties en e-mail op de hoogte gehouden van updates.

Vergelijkbare bestaande producten ter referentie: Marker.io, BugHerd, Markup.io, PageProofer.

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

Authenticatie: e-mail + wachtwoord, klanten worden uitgenodigd via e-mail met een invite-link (magic link) om hun account te activeren. Wachtwoord-reset via e-mail.

## 4. Kernfunctionaliteit

### 4.1 Projectbeheer (admin)
- Project aanmaken met naam, doel-URL, omschrijving.
- Klanten toevoegen/verwijderen aan een project via e-mailadres (invite-flow).
- Eén klant kan aan meerdere projecten gekoppeld zijn.
- Projectoverzicht met status/voortgang: aantal open/klaar/geverifieerd feedback-items.

### 4.2 Website-viewer met overlay-annotatie
- Viewer toont de doelwebsite van het project in een frame, met een transparante overlay-laag erboven.
- Gebruiker (klant of admin) klikt op een element op de pagina → een pin/marker wordt geplaatst → een formulier verschijnt om feedback te typen (tekst) → bij het opslaan wordt automatisch een screenshot gemaakt.
- Elke feedback-pin registreert: de klik-coördinaten, een CSS-selector/XPath van het onderliggende element (voor herkenning ook als de pagina licht wijzigt), de pagina-URL, en **verplicht** een automatisch gemaakte screenshot die de plek op de website toont waar de feedback op van toepassing is (bv. de viewport met de pin erop gemarkeerd, of een uitsnede rond het element). Zonder screenshot kan een feedback-item niet worden opgeslagen — dit is geen optionele toevoeging maar een vast onderdeel van elk feedback-item, zodat direct zichtbaar is waar op de pagina het probleem zich voordoet.
- Bestaande pins worden getoond als klikbare markers op de pagina zodat je de discussie per punt kan volgen.
- Klanten kunnen feedback geven op elk apparaattype: desktop, tablet en mobiel. De viewer/overlay moet op al deze apparaten bruikbaar zijn.
- Bij het aanmaken van een feedback-item geeft de klant (of admin) aan op welk apparaattype de feedback van toepassing is (**Desktop / Tablet / Mobiel**). Dit apparaattype wordt bij het feedback-item opgeslagen en getoond/filterbaar in het overzicht, zodat de developer weet in welke context (viewport/apparaat) het probleem zich voordoet — dit kan namelijk afwijken van het apparaat waarop de feedback daadwerkelijk is geplaatst (bv. een klant bekijkt een screenshot van mobiel maar geeft feedback vanaf desktop).

**Technische uitdaging — website embedden:** de meeste sites blokkeren embedding via `X-Frame-Options`/CSP. Aanbevolen aanpak voor de PRD:
- **MVP-aanpak (recommended):** een server-side proxy. De applicatie haalt de doel-URL server-side op, herschrijft relatieve links/assets naar de proxy, verwijdert/negeert blokkerende response-headers (`X-Frame-Options`, `frame-ancestors` in CSP), en injecteert een overlay-script in de HTML voordat deze aan de klant wordt getoond. Dit werkt zonder dat de klant iets aan hun eigen site moet aanpassen, en is de meest gebruiksvriendelijke optie voor een developer die feedback wil van een niet-technische klant.
- **Kanttekening:** sites met veel client-side JS-navigatie (SPA's), authenticatie-vereisten, of anti-scraping bescherming kunnen problemen geven via een proxy. Als fallback/toekomstige optie: een klein JS-snippet dat de klant zelf op hun (staging-)site plaatst, wat de overlay direct injecteert zonder proxy — betrouwbaarder maar vereist een technische stap bij de klant.
- Beide opties worden als open technisch risico benoemd in sectie 8; aanbevolen om dit met een technische spike te valideren voordat build start.

### 4.3 Feedback-beheer
- Lijst/overzicht van alle feedback-items per project, filterbaar op status en op pagina/URL.
- Statussen: **Open → In behandeling → Klaar (opgelost) → Geverifieerd (klant akkoord)**, plus **Afgewezen/niet van toepassing**.
- Threaded reacties per feedback-item: klant en developer kunnen over-en-weer reageren op één item (bv. developer vraagt verduidelijking, klant reageert).
- Wanneer developer status op "Klaar" zet, wordt de klant gevraagd te verifiëren; klant kan opnieuw feedback geven op datzelfde item als het nog niet goed is (heropent het item / nieuwe reactie-ronde).
- Toewijzen van feedback aan een specifieke developer (bij meerdere teamleden, toekomst).

### 4.4 Notificaties & e-mail
- In-app notificatiecentrum: nieuwe feedback, nieuwe reactie, status-wijziging, @mentions.
- E-mailnotificaties bij dezelfde events, met instelbare voorkeuren (direct / dagelijkse samenvatting / uit) per gebruiker.
- Transactionele e-mails: uitnodiging klant, wachtwoord-reset, verificatie.
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
- `feedback_items` (id, project_id, pagina_url, css_selector, x, y, screenshot_url **(verplicht)**, tekst, status, apparaattype: desktop/tablet/mobiel, aangemaakt_door, aangemaakt_op, bijgewerkt_op)
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
