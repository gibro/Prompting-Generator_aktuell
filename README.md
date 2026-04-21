# Prompting-Generator für Moodle (`mod_data`)

Diese Vorlage stellt eine Prompt-Bibliothek in einer Moodle-Datenbankaktivität (`mod_data`) bereit.  
Einträge können als wiederverwendbare Prompt-Templates gepflegt, mit Platzhaltern konfiguriert und als finaler Prompt in die Zwischenablage kopiert werden.

## Rechte zuerst einrichten

Bevor die Vorlagen eingesetzt werden, sollten die Rechte der Datenbank-Aktivität sauber gesetzt werden. Die ausgeblendeten Buttons in den Templates sind nur UI; maßgeblich sind die Moodle-Berechtigungen.

- Für Teilnehmende, die Einträge nicht löschen dürfen, muss in der Aktivität mindestens `mod/data:manageentries` auf `Verbieten` bzw. `Nicht gesetzt` bleiben.
- Wenn Teilnehmende gar keine eigenen Einträge bearbeiten oder löschen dürfen, muss zusätzlich `mod/data:writeentry` entzogen werden.
- Wichtig: In der Standard-Datenbankaktivität umfasst `mod/data:writeentry` nicht nur das Anlegen, sondern auch das Bearbeiten und Löschen eigener Einträge. Es gibt dort keine getrennte Standard-Berechtigung nur für „eigene Einträge löschen“.
- Wenn Teilnehmende nur lesen sollen, gib ihnen `mod/data:readentry` bzw. die üblichen Anzeige-Rechte, aber nicht `mod/data:writeentry`.
- Wenn Referent*innen Einträge pflegen sollen, gib diese Rechte nur der entsprechenden Rolle oder setze sie über eine Rollenüberschreibung direkt in der Aktivität.

Empfohlener Weg in Moodle:

1. Datenbank-Aktivität öffnen.
2. `Mehr > Rechte` oder `Rollen überschreiben` öffnen.
3. Für die Teilnehmenden-Rolle `mod/data:manageentries` nicht erlauben.
4. Für die Teilnehmenden-Rolle `mod/data:writeentry` ebenfalls nicht erlauben, wenn sie keine eigenen Einträge verändern oder löschen dürfen.
5. Referent*innen/Trainer*innen die Pflege-Rechte nur dort geben, wo sie wirklich benötigt werden.

## Funktionen

- Prompt-Karten in Listen- und Einzelansicht mit einheitlichem UI (inkl. responsivem Grid).
- Dynamische Platzhalter-Erkennung im Prompt über `{Platzhaltername}`.
- Automatische Eingabefelder pro erkanntem Platzhalter.
- Live-Vorschau: Platzhalter werden farblich markiert, ausgefüllte Werte direkt angezeigt.
- Copy-Flow: Beim Kopieren wird `Systemprompt + Prompt` zu einem finalen Text zusammengeführt.
- Kategorie-Filter in der Listenansicht.
- Kartenfokus per Overlay: Karte auswählen, erweitern, bearbeiten.
- „Mehr“-Bereich zum Ein-/Ausklappen des Systemprompts.
- Sammelaktion für Referent*innen: ausgewählten Einträgen in der Listenansicht eine zusätzliche Kategorie zuweisen.
- Mehrfachauswahl und Sammellöschen mit gemeinsamer Bestätigung.
- Rollenabhängige UI-Ausblendung:
  - Für Teilnehmende/Studierende werden Bearbeiten/Löschen und Bulk-Aktionen ausgeblendet.
- Kategorie-Farbcodierung: Kartenfarbe wird aus der ersten Kategorie automatisch gesetzt.

## Datenmodell (Felder aus `preset.xml`)

- `Titel` (Text)
- `Prompt` (Textbereich)
- `Kategorie` (Checkbox, Mehrfachauswahl)
- `Systemprompt` (Textbereich)
- `Beispiel-Output` (Textbereich)

## Dateien in diesem Repository

- `preset.xml` – Felddefinitionen und Basis-Einstellungen für die Datenbankaktivität.
- `addtemplate.html` – Eingabeformular für neue Prompts.
- `listtemplateheader.html` – Kopfbereich der Listenansicht (Filter + Bulk-Bar).
- `listtemplate.html` – Kartenansicht je Datensatz.
- `listtemplatefooter.html` – Listenabschluss (Overlay + Wrapper-Ende).
- `singletemplate.html` – Einzelansicht eines Datensatzes.
- `csstemplate.css` – Styles für List/Single/Add inklusive Rollen-UI.
- `jstemplate.js` – Interaktionen (Platzhalter, Vorschau, Filter, Kopieren, Auswahl, Bulk).
- `asearchtemplate.html`, `rsstemplate.html`, `rsstitletemplate.html` – derzeit leer.

## Installation in Moodle als `mod_data`

### Voraussetzungen

- Moodle mit aktivierter Aktivität **Datenbank** (`mod_data`).
- Bearbeitungsrechte im Kurs (mindestens Trainer:in mit Aktivitätserstellung).

### Schritt 1: Datenbankaktivität anlegen

1. Im Kurs auf **Aktivität oder Material anlegen** klicken.<img width="801" height="184" alt="Screenshot 2026-04-21 122809" src="https://github.com/user-attachments/assets/f9d97077-540d-4720-8297-e82f2cfbe875" />

1. **Datenbank** auswählen.<img width="1116" height="757" alt="Screenshot 2026-04-21 123404" src="https://github.com/user-attachments/assets/47a64973-a4c1-4694-8c04-de7badeeadc0" />

1. Aktivität benennen (z. B. `Prompting-Generator`), speichern.<img width="813" height="512" alt="Screenshot 2026-04-21 123522" src="https://github.com/user-attachments/assets/7a0089ba-378a-474b-866b-fe135c264000" />


### Schritt 2: Preset importieren

1. Die angelegte Datenbank öffnen.<img width="797" height="427" alt="Screenshot 2026-04-21 123656" src="https://github.com/user-attachments/assets/3dd52939-ac74-4a99-b264-7edbce647b6d" />

2. Reiter **Vorlagen** oder **Voreinstellungen** (je nach Moodle-Version/Theme) öffnen.
3. **Preset importieren** auswählen.
4. Datei `preset.xml` aus diesem Repository hochladen.
5. Import bestätigen.

Damit werden die benötigten Felder (`Titel`, `Prompt`, `Kategorie`, `Systemprompt`, `Beispiel-Output`) angelegt.

### Schritt 3: Templates einfügen

In der Datenbankaktivität unter **Vorlagen** die Inhalte aus den Dateien einfügen:

1. **Listentitel/Kopf** → Inhalt aus `listtemplateheader.html`
2. **Listenansicht** → Inhalt aus `listtemplate.html`
3. **Listenfuß** → Inhalt aus `listtemplatefooter.html`
4. **Einzelansicht** → Inhalt aus `singletemplate.html`
5. **Eingabevorlage (Add template)** → Inhalt aus `addtemplate.html`
6. **CSS-Vorlage** → Inhalt aus `csstemplate.css`
7. **JavaScript-Vorlage** → Inhalt aus `jstemplate.js`

Optional:

- `asearchtemplate.html` für erweiterte Suche (derzeit leer).
- RSS-Templates (`rsstemplate.html`, `rsstitletemplate.html`) bei Bedarf.

### Schritt 4: Rechte/Rollen prüfen

Die CSS-Regeln blenden Bearbeiten/Löschen für Teilnehmende anhand von Body-Klassen aus (`role-student`, `role-teilnehmer`, `role-teilnehmende`).  
Zusätzlich müssen die Moodle-Rechte korrekt gesetzt sein, damit Teilnehmende keine unerlaubten Aktionen ausführen können. Maßgeblich sind dabei vor allem `mod/data:manageentries` und `mod/data:writeentry` aus der Einleitung oben.

### Schritt 5: Funktionstest

1. Testeintrag mit Platzhaltern anlegen, z. B.  
   `Erstelle einen Unterrichtsplan für {Fach} in Klasse {Klassenstufe}.`
2. Listenansicht öffnen:
   - Kategorie filtern
   - Mehrere Einträge markieren und testweise einer vorhandenen Kategorie zuordnen
   - Karte auswählen
   - Platzhalter ausfüllen
   - **In die Zwischenablage kopieren** testen
3. Prüfen, ob der kopierte Text `Systemprompt` + ausgefüllten Prompt enthält.

## Pflege und Anpassung

- Neue Kategorien können in `preset.xml` im Feld `Kategorie` (`<param1>...</param1>`) ergänzt werden.
- UI/Branding wird über `csstemplate.css` gesteuert.
- Interaktionslogik (Platzhalter, Copy, Filter, Bulk) liegt in `jstemplate.js`.
