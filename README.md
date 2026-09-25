# BarTab

BarTab is een offline-first PWA voor drankrekeningen op een bar. De app gebruikt alleen HTML, CSS en vanilla JavaScript; er is geen buildstap nodig.

## Starten

Open de map via een lokale webserver, bijvoorbeeld de VS Code Live Server-extensie. Een service worker werkt niet wanneer `index.html` direct via `file://` wordt geopend. Bezoek daarna de pagina op de Lenovo Tab P11 en kies in de browser **Toevoegen aan startscherm**.

## Eigen iconen toevoegen

Maak zelf twee PNG-bestanden en plaats ze in een nieuwe map `icons/`:

- `icons/icon-192.png`: exact 192 x 192 pixels
- `icons/icon-512.png`: exact 512 x 512 pixels

De verwijzingen staan al in `manifest.json` en `index.html`. Zonder deze bestanden werkt de app wel, maar toont Android geen aangepast app-icoon.

## Gebruik

Het hoofdscherm toont `Thuis` en alle klanten. Tik op een klant om een bestelling met aantallen samen te stellen. Een bestelling verlaagt direct de balans, vermindert de voorraad en komt in de geschiedenis. `Thuis` wordt wel gelogd, maar heeft geen balans.

Het tandwiel opent na wachtwoordcontrole het adminpaneel. Het standaardwachtwoord is `bier123` en staat bovenaan `script.js` in `ADMIN_PASSWORD`. Binnen een paginasessie wordt het wachtwoord onthouden. Daar beheer je voorraad, assortiment, klanten, groepen, geschiedenis en balansen.

## Data en uitbreiden

Alle gegevens worden lokaal opgeslagen onder localStorage-sleutel `bartab-state-v1`. Bedragen worden intern als hele centen opgeslagen; daardoor blijven berekeningen stabiel. De standaarddranken staan bovenaan `script.js` in `DEFAULT_DRINKS`. Een bestaande oude tab-structuur wordt bij het laden eenmalig omgezet naar klanten en geschiedenis.
