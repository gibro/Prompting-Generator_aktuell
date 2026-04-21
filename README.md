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

1. Schaltfläche **Vorlagensatz importieren** anklicken.<img width="802" height="529" alt="Screenshot 2026-04-21 125017" src="https://github.com/user-attachments/assets/03992f65-2d42-4784-a6be-8236c361f0de" />

1. Datei auswählen <img width="797" height="427" alt="Screenshot 2026-04-21 123656" src="https://github.com/user-attachments/assets/10269b3b-9d32-491f-9dcd-1a55641f08b0" />

1. Datei "Prompting-Generator-Vorlagensatz" anklicken <img width="659" height="110" alt="Screenshot 2026-04-21 125416" src="https://github.com/user-attachments/assets/a67297e1-ef5c-4174-bdaa-ad5681d85f9f" />

1. Datei hochladen <img width="852" height="568" alt="Screenshot 2026-04-21 125432" src="https://github.com/user-attachments/assets/a8a2243d-ebdf-4a76-a52a-2488a4ba75a9" />

1. Vorlagensatz importiern und anwenden <img width="781" height="499" alt="Screenshot 2026-04-21 125441" src="https://github.com/user-attachments/assets/c6c31faa-277c-4805-bac1-91ffdfcd3f17" /> 
   
1. Das Ergebnis sollte so aussehen: <img width="806" height="684" alt="Screenshot 2026-04-21 125459" src="https://github.com/user-attachments/assets/bee94b7c-a3d6-4a4d-8561-bcd495f3e638" />

1. Den Reiter **Datenbank** wählen 
 <img width="731" height="366" alt="Screenshot 2026-04-21 130710" src="https://github.com/user-attachments/assets/b885f23e-b32c-40c0-ad2c-2ef94e6e269b" /> und **Einträge importieren**
" anklicken.

1. Datei auswählen <img width="875" height="585" alt="Screenshot 2026-04-21 130732" src="https://github.com/user-attachments/assets/b521caaa-66a5-49eb-a655-2a4b64ed0463" />

1. "Prompt-Generator-irgendwas.csv" wählen <img width="615" height="86" alt="Screenshot 2026-04-21 130746" src="https://github.com/user-attachments/assets/30643322-3fb5-438f-b36f-925aacb17b7d" />

1. Datei hochladen <img width="849" height="549" alt="Screenshot 2026-04-21 130759" src="https://github.com/user-attachments/assets/43ae8a7c-a1a6-414f-81f8-d07114c36837" />

1. Speichern <img width="813" height="696" alt="Screenshot 2026-04-21 130810" src="https://github.com/user-attachments/assets/c7ab3bcd-ee8b-4a55-a903-7960087a4a7a" />

1. Das Ergebnis sollte so aussehen: <img width="623" height="751" alt="Screenshot 2026-04-21 130827" src="https://github.com/user-attachments/assets/453a8397-a435-4a7a-b052-c3adbd0c8e44" />

1. Beim nächsten Anwählen des Reites **Datenbank** sollten diese Einträge zu sehen sein: <img width="810" height="733" alt="Screenshot 2026-04-21 132010" src="https://github.com/user-attachments/assets/aa19e35c-05e4-4afb-b0d0-ed52d1e05f83" />




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
