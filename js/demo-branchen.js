/* =====================================================================
   DEMO JE BRANCHE
   ---------------------------------------------------------------------
   Die Demo ist mit Beispieldaten eines SHK-Betriebs gebaut. Diese Datei
   „übersetzt“ beim Anzeigen und beim Vorlesen alle Begriffe in die
   gewählte Branche (Maler, Elektro, Dach/Fenster, Reinigung, IT-Service,
   Hausmeister/GaLaBau, Sicherheits-/Klimatechnik). Alle Funktionen
   bleiben gleich. Die Branche kommt aus der Adresse: demo.html?branche=maler
   ===================================================================== */
(function () {
  "use strict";

  /* Begriffe der Beispieldaten (SHK) → Platzhalter. Reihenfolge: lange vor kurz. */
  var SCHLUESSEL = [
    ["Musterbetrieb Haustechnik", "BETRIEB"], ["Anlagenmechaniker SHK", "AZUBI"], ["Auszubildende SHK", "AZUBI_PL"], ["SHK / Fliesen", "GEWERK2"],
    ["Bad & Wärme Schmitt", "P2"], ["Fliesen Yilmaz", "P1"],
    ["Tausch Ölheizung gegen Wärmepumpe", "GROSS_LANG"], ["Wärmepumpe statt Ölheizung", "GROSS"], ["Neue Wärmepumpe", "GROSS_NEU"],
    ["Wärmepumpe – Beratung", "GROSS_BER"], ["Beratung Wärmepumpe", "GROSS_BER"], ["Wärmepumpe", "GROSS_KURZ"],
    ["Störung Gasheizung, Fehler F28 (Zündung)", "NOT_LANG"], ["Heizung geht seit heute früh nicht", "NOT_SATZ"], ["Haushalt ohne Heizung", "NOT_DRING"], ["Heizung ausgefallen", "NOT"],
    ["Heizungstausch", "HAUPT"], ["Heizungswartung", "WART"], ["Jährliche Wartung Gasheizung", "WART"], ["Wartung Gasheizung", "WART"], ["Wartung Ölheizung", "WART"], ["Wartung Heizung", "WART"], ["Heizungsprüfung", "WART"],
    ["Wartungsvertrag Ölheizung", "WARTV"], ["Wartungsvertrag Gasheizung", "WARTV"],
    ["Heizungsanlagen", "ANLAGEN"], ["Heizungsanlage", "ANLAGE"], ["Heizungsaufträgen", "AUFTRAEGE"],
    ["Heizkörper tauschen", "KLEIN"], ["Heizkörpern", "KLEINOBJ_PL"], ["Heizkörper", "KLEINOBJ"], ["Heizraum", "RAUM3"],
    ["Neue Gas-Brennwertheizung", "GERAET_NEU"], ["Gasbrennwerttherme", "GERAET"], ["Brennwerttherme", "GERAET"], ["Brennwertgerät", "GERAET"], ["Gasthermen", "GERAET_PL"], ["Gastherme", "GERAET"],
    ["Alte Therme", "GERAET_ALT_A"], ["Neue Therme", "GERAET_NEU"], ["Therme", "GERAET"],
    ["Gasheizung", "GERAET_ALT"], ["Ölheizung", "GERAET_ALT"], ["Ölbrenner", "GERAET_ALT"], ["Heizung", "GERAET_ALT"],
    ["Abgasrohr DN 80, 2 m", "MAT1"], ["Abgasrohr DN 80", "MAT1"], ["Abgasrohr", "MAT1"], ["Abgasleitung", "MAT1"], ["Abgaswerte gemessen", "PRUEF1"], ["Abgasweg", "MASS"],
    ["Brenner gereinigt", "PRUEF2"], ["Kondensatpumpe", "MAT2"], ["Dichtungssatz Armatur", "MAT3"], ["Dichtungssatz", "MAT3"], ["Dichtungen", "MAT3"], ["Ölfilter und Düse", "MAT4"],
    ["Strangsanierung", "WEG"], ["Sanierung Sanitäranlagen", "OEFF"], ["Sanitär-Pauschale (Dusche, WC, Waschtisch)", "PAUSCH"], ["Sanitärobjekte", "OBJEKTE"], ["Sanitär", "SANITAER"],
    ["Badsanierungen", "PROJ_PL"], ["Badsanierung", "PROJ"], ["Bad sanieren", "PROJ_VERB"], ["Komplettsanierung Bad", "PROJ"], ["Modernisierung Bad", "PROJ"],
    ["Neue Badarmaturen", "REP2"], ["Badarmaturen", "REP2"],
    ["Küchenwasserhahn tropft", "REP"], ["Wasserhahn tropft", "REP"], ["Küchenarmatur tropft", "REP"], ["Armaturen", "TEIL_PL"], ["Armatur", "TEIL"],
    ["bodengleicher Dusche", "WUNSCH"], ["bodengleiche Dusche", "WUNSCH"], ["Bodengleiche Dusche", "WUNSCH"], ["Dusche undicht", "MANGEL"], ["Undichte Dusche", "MANGEL"], ["Dusche", "TEIL2"],
    ["Gäste-WC", "RAUM2"], ["Bodenfliesen", "MAT_B"], ["Wandfliesen", "MAT_W"], ["Fliesen", "MAT_F"], ["Inbetriebnahme", "ABSCHLUSS"],
    ["Bad", "RAUM1", true], ["SHK", "GEWERK", true]
  ];
  /* Begriffe der Oberfläche für Branchen außerhalb des Handwerks */
  var OBERFLAECHE = [["Montage-App", "APP"], ["für die Baustelle", "F_BAUST"], ["der Baustelle zugeordnet", "D_BAUST"], ["zur Baustelle", "Z_BAUST"], ["die aktuelle Baustelle", "A_BAUST"], ["Montagekräfte", "MK_PL"], ["Montagekraft", "MK"], ["Monteur", "MK"], ["Regieberichte", "RB_PL"], ["Regiebericht", "RB"], ["Aufmaß", "AUFMASS"], ["Baustellen", "BAUST_PL"], ["Baustelle", "BAUST"]];

  var B = {
    shk: { name: "SHK & Heizung", betrieb: "Musterbetrieb Haustechnik", w: {} },
    maler: { name: "Maler & Lackierer", betrieb: "Malerbetrieb Muster", w: {
      BETRIEB: "Malerbetrieb Muster", AZUBI: "Maler und Lackierer", AZUBI_PL: "Auszubildende Maler", GEWERK: "Maler", GEWERK2: "Maler / Boden", P1: "Bodenbeläge Yilmaz", P2: "Farbe & Raum Schmitt",
      GROSS_LANG: "Fassadenanstrich mit Dämmung, Einfamilienhaus", GROSS: "Fassade neu streichen", GROSS_NEU: "Neuer Fassadenanstrich", GROSS_BER: "Beratung Fassadengestaltung", GROSS_KURZ: "Fassadenanstrich",
      NOT_LANG: "Wasserschaden an der Decke, Fleck wird größer", NOT_SATZ: "Nach einem Wasserschaden ist die Decke fleckig", NOT_DRING: "Mieter zieht am Montag ein", NOT: "Wasserschaden Decke",
      HAUPT: "Wohnung renovieren", WART: "Nachanstrich Holzfassade", WARTV: "Pflegevertrag Holzfassade", ANLAGEN: "Treppenhäuser", ANLAGE: "Fassade", AUFTRAEGE: "Fassadenaufträgen",
      KLEIN: "Türen lackieren", KLEINOBJ_PL: "Türen", KLEINOBJ: "Tür", RAUM3: "Treppenhaus", RAUM2: "Flur", RAUM1: "Wohnzimmer",
      GERAET_NEU: "Neuer Anstrich", GERAET: "Fassade", GERAET_PL: "Fassaden", GERAET_ALT: "Holzfassade", GERAET_ALT_A: "Alter Anstrich",
      MAT1: "Fassadenfarbe 12,5 l", MAT2: "Tiefgrund 10 l", MAT3: "Abdeckvlies", MAT4: "Lack seidenmatt 2,5 l", MASS: "Wandfläche", PRUEF1: "Untergrund geprüft", PRUEF2: "Flächen abgeklebt",
      WEG: "Treppenhaus-Renovierung", OEFF: "Malerarbeiten", PAUSCH: "Malerpauschale (Wände, Decken, Türen)", OBJEKTE: "Tapeten", SANITAER: "Maler",
      PROJ_PL: "Renovierungen", PROJ: "Renovierung", PROJ_VERB: "Wohnung streichen", REP2: "Innentüren lackieren", REP: "Riss in der Wand ausbessern", TEIL_PL: "Türen", TEIL: "Tür",
      WUNSCH: "Akzentwand in Anthrazit", MANGEL: "Schimmel an der Wand", TEIL2: "Wand", MAT_B: "Wandfarbe", MAT_W: "Deckenfarbe", MAT_F: "Farbe", ABSCHLUSS: "Endabnahme" } },
    elektro: { name: "Elektro", betrieb: "Elektro Muster", ohneQm: true, w: {
      BETRIEB: "Elektro Muster", AZUBI: "Elektroniker", AZUBI_PL: "Auszubildende Elektroniker", GEWERK: "Elektro", GEWERK2: "Elektro / Smart Home", P1: "Elektro Yilmaz", P2: "Licht & Strom Schmitt",
      GROSS_LANG: "Photovoltaik mit Speicher, Einfamilienhaus", GROSS: "PV-Anlage mit Speicher", GROSS_NEU: "Neue PV-Anlage", GROSS_BER: "Beratung Photovoltaik", GROSS_KURZ: "PV-Anlage",
      NOT_LANG: "Stromausfall im Erdgeschoss, FI-Schalter löst aus", NOT_SATZ: "Seit heute früh fliegt immer wieder die Sicherung", NOT_DRING: "Haushalt teilweise ohne Strom", NOT: "Stromausfall",
      HAUPT: "Elektroinstallation erneuern", WART: "E-Check", WARTV: "Prüfvertrag E-Check", ANLAGEN: "Elektroanlagen", ANLAGE: "Elektroanlage", AUFTRAEGE: "Elektroaufträgen",
      KLEIN: "Wallbox installieren", KLEINOBJ_PL: "Steckdosen", KLEINOBJ: "Steckdose", RAUM3: "Hausanschlussraum", RAUM2: "Flur", RAUM1: "Küche",
      GERAET_NEU: "Neuer Zählerschrank", GERAET: "Zählerschrank", GERAET_PL: "Zählerschränke", GERAET_ALT: "Unterverteilung", GERAET_ALT_A: "Alte Unterverteilung",
      MAT1: "Leitung NYM-J 3×1,5, 50 m", MAT2: "FI-Schutzschalter", MAT3: "Abzweigdosen", MAT4: "Leitungsschutzschalter B16", MASS: "Leitungsweg", PRUEF1: "Isolationswiderstand gemessen", PRUEF2: "FI-Schalter ausgelöst",
      WEG: "Elektro-Sanierung der Steigleitungen", OEFF: "Erneuerung Elektroinstallation", PAUSCH: "Elektro-Pauschale (Steckdosen, Schalter, Licht)", OBJEKTE: "Schalter und Steckdosen", SANITAER: "Elektro",
      PROJ_PL: "Elektrosanierungen", PROJ: "Elektrosanierung", PROJ_VERB: "Elektrik erneuern", REP2: "Neue Schalter und Steckdosen", REP: "Steckdose ohne Funktion", TEIL_PL: "Schalter", TEIL: "Schalter",
      WUNSCH: "smarte Lichtsteuerung", MANGEL: "Sicherung löst aus", TEIL2: "Leitung", MAT_B: "Unterputzdosen", MAT_W: "Schalterprogramm", MAT_F: "Installationsmaterial", ABSCHLUSS: "Inbetriebnahme" } },
    dach: { name: "Dach, Fenster, Rollladen", betrieb: "Dach & Fenster Muster", w: {
      BETRIEB: "Dach & Fenster Muster", AZUBI: "Dachdecker", AZUBI_PL: "Auszubildende Dachdecker", GEWERK: "Dach", GEWERK2: "Dach / Fenster", P1: "Fensterbau Yilmaz", P2: "Dach & Rollladen Schmitt",
      GROSS_LANG: "Dachsanierung mit Dämmung, Einfamilienhaus", GROSS: "Dach neu eindecken", GROSS_NEU: "Neues Dach", GROSS_BER: "Beratung Dachsanierung", GROSS_KURZ: "Dachsanierung",
      NOT_LANG: "Sturmschaden: Ziegel fehlen, Wasser tropft", NOT_SATZ: "Seit dem Sturm heute Nacht tropft es durchs Dach", NOT_DRING: "Wasser läuft ins Haus", NOT: "Sturmschaden",
      HAUPT: "Dach eindecken", WART: "Dachinspektion", WARTV: "Wartungsvertrag Dach", ANLAGEN: "Dächer", ANLAGE: "Dachanlage", AUFTRAEGE: "Dachaufträgen",
      KLEIN: "Rollläden tauschen", KLEINOBJ_PL: "Rollläden", KLEINOBJ: "Rollladen", RAUM3: "Dachboden", RAUM2: "Gaube", RAUM1: "Dach",
      GERAET_NEU: "Neue Dachfenster", GERAET: "Dachfenster", GERAET_PL: "Dachfenster", GERAET_ALT: "Eindeckung", GERAET_ALT_A: "Alte Eindeckung",
      MAT1: "Dachziegel, 2 Paletten", MAT2: "Unterspannbahn", MAT3: "Rinnenhalter", MAT4: "Firstziegel", MASS: "Dachfläche", PRUEF1: "Dachfläche geprüft", PRUEF2: "Rinnen gereinigt",
      WEG: "Dachsanierung", OEFF: "Dachsanierung", PAUSCH: "Dach-Pauschale (Eindeckung, Rinnen, Anschlüsse)", OBJEKTE: "Ziegel", SANITAER: "Dach",
      PROJ_PL: "Fenstertausche", PROJ: "Fenstertausch", PROJ_VERB: "Fenster tauschen", REP2: "Neue Fenstergriffe", REP: "Rollladen klemmt", TEIL_PL: "Fenster", TEIL: "Fenster",
      WUNSCH: "Dreifachverglasung", MANGEL: "Fenster undicht", TEIL2: "Fenster", MAT_B: "Fensterbänke", MAT_W: "Rollladenkästen", MAT_F: "Fenster", ABSCHLUSS: "Abnahme" } },
    reinigung: { name: "Gebäudereinigung", betrieb: "Muster Gebäudedienste", ui: { APP: "Mitarbeiter-App", F_BAUST: "für das Objekt", D_BAUST: "dem Objekt zugeordnet", Z_BAUST: "zum Objekt", A_BAUST: "das aktuelle Objekt", MK: "Reinigungskraft", MK_PL: "Reinigungskräfte", RB: "Leistungsnachweis", RB_PL: "Leistungsnachweise", AUFMASS: "Objektaufnahme", BAUST: "Objekt", BAUST_PL: "Objekte" }, w: {
      BETRIEB: "Muster Gebäudedienste", AZUBI: "Gebäudereiniger", AZUBI_PL: "Auszubildende Gebäudereiniger", GEWERK: "Reinigung", GEWERK2: "Reinigung / Glas", P1: "Glasreinigung Yilmaz", P2: "Sauber & Klar Schmitt",
      GROSS_LANG: "Unterhaltsreinigung Bürogebäude, 1.200 m²", GROSS: "Unterhaltsreinigung Büro", GROSS_NEU: "Neue Unterhaltsreinigung", GROSS_BER: "Beratung Reinigungskonzept", GROSS_KURZ: "Unterhaltsreinigung",
      NOT_LANG: "Wasserschaden in der Praxis, Sofortreinigung nötig", NOT_SATZ: "Nach einem Rohrbruch steht im Flur Wasser", NOT_DRING: "Praxis kann nicht öffnen", NOT: "Sofortreinigung",
      HAUPT: "Bauendreinigung", WART: "Grundreinigung", WARTV: "Reinigungsvertrag", ANLAGEN: "Objekte", ANLAGE: "Objekt", AUFTRAEGE: "Reinigungsaufträgen",
      KLEIN: "Fenster reinigen", KLEINOBJ_PL: "Fenstern", KLEINOBJ: "Fenster", RAUM3: "Technikraum", RAUM2: "Teeküche", RAUM1: "Büro",
      GERAET_NEU: "Neuer Reinigungsautomat", GERAET: "Scheuersaugmaschine", GERAET_PL: "Objekte", GERAET_ALT: "Teppichboden", GERAET_ALT_A: "Alter Teppich",
      MAT1: "Reinigungsmittel, 10 l", MAT2: "Mikrofasertücher", MAT3: "Müllbeutel", MAT4: "Handtuchpapier", MASS: "Reinigungsfläche", PRUEF1: "Flächen kontrolliert", PRUEF2: "Verbrauchsmaterial aufgefüllt",
      WEG: "Treppenhausreinigung", OEFF: "Unterhaltsreinigung", PAUSCH: "Reinigungspauschale (Böden, Waschräume, Küche)", OBJEKTE: "Waschräume", SANITAER: "Reinigung",
      PROJ_PL: "Grundreinigungen", PROJ: "Grundreinigung", PROJ_VERB: "Grundreinigung", REP2: "Neue Spender montieren", REP: "Reklamation Küche", TEIL_PL: "Spender", TEIL: "Spender",
      WUNSCH: "tägliche Reinigung", MANGEL: "Reklamation", TEIL2: "Boden", MAT_B: "Bodenpflege", MAT_W: "Glasreiniger", MAT_F: "Reinigungsmittel", ABSCHLUSS: "Abnahme" } },
    it: { name: "IT-Service", betrieb: "Muster IT-Service", ohneQm: true, ui: { APP: "Techniker-App", F_BAUST: "für den Einsatz", D_BAUST: "dem Einsatz zugeordnet", Z_BAUST: "zum Einsatzort", A_BAUST: "der aktuelle Einsatz", MK: "Techniker", MK_PL: "Techniker", RB: "Einsatzbericht", RB_PL: "Einsatzberichte", AUFMASS: "Bestandsaufnahme", BAUST: "Einsatzort", BAUST_PL: "Einsätze" }, exakt: [["Anfragen", "Tickets"]], w: {
      BETRIEB: "Muster IT-Service", AZUBI: "Fachinformatiker", AZUBI_PL: "Auszubildende Fachinformatik", GEWERK: "IT", GEWERK2: "IT / Netzwerk", P1: "Netzwerk Yilmaz", P2: "Daten & Netz Schmitt",
      GROSS_LANG: "Neue Server- und Netzwerkumgebung, 25 Arbeitsplätze", GROSS: "Umstellung in die Cloud", GROSS_NEU: "Neue Serverumgebung", GROSS_BER: "Beratung Cloud", GROSS_KURZ: "Cloud-Umstellung",
      NOT_LANG: "Server ausgefallen, niemand kann arbeiten", NOT_SATZ: "Seit heute früh startet der Server nicht", NOT_DRING: "Büro kann nicht arbeiten", NOT: "Serverausfall",
      HAUPT: "Netzwerk erneuern", WART: "Wartung Server", WARTV: "Wartungsvertrag IT", ANLAGEN: "IT-Systeme", ANLAGE: "IT-Anlage", AUFTRAEGE: "IT-Aufträgen",
      KLEIN: "Arbeitsplätze einrichten", KLEINOBJ_PL: "Notebooks", KLEINOBJ: "Notebook", RAUM3: "Serverraum", RAUM2: "Empfang", RAUM1: "Büro",
      GERAET_NEU: "Neuer Server", GERAET: "Server", GERAET_PL: "Server", GERAET_ALT: "Altserver", GERAET_ALT_A: "Alter Server",
      MAT1: "Netzwerkkabel Cat 7, 50 m", MAT2: "Switch 24 Port", MAT3: "Patchkabel", MAT4: "SSD 1 TB", MASS: "Kabelweg", PRUEF1: "Datensicherung geprüft", PRUEF2: "Updates eingespielt",
      WEG: "Netzwerk-Erneuerung", OEFF: "IT-Ausstattung", PAUSCH: "IT-Pauschale (Einrichtung, Daten, Einweisung)", OBJEKTE: "Altgeräte", SANITAER: "IT",
      PROJ_PL: "IT-Umstellungen", PROJ: "IT-Umstellung", PROJ_VERB: "IT erneuern", REP2: "Neue Drucker", REP: "Drucker druckt nicht", TEIL_PL: "Drucker", TEIL: "Drucker",
      WUNSCH: "Fernzugriff fürs Homeoffice", MANGEL: "WLAN bricht ab", TEIL2: "WLAN", MAT_B: "Monitore", MAT_W: "Dockingstations", MAT_F: "Hardware", ABSCHLUSS: "Übergabe" } },
    hausmeister: { name: "Hausmeister & GaLaBau", betrieb: "Muster Hausmeisterservice", ui: { APP: "Mitarbeiter-App", F_BAUST: "für das Objekt", D_BAUST: "dem Objekt zugeordnet", Z_BAUST: "zum Objekt", A_BAUST: "das aktuelle Objekt", MK: "Mitarbeiter", MK_PL: "Mitarbeiter", RB: "Leistungsnachweis", RB_PL: "Leistungsnachweise", AUFMASS: "Objektbegehung", BAUST: "Objekt", BAUST_PL: "Objekte" }, w: {
      BETRIEB: "Muster Hausmeisterservice", AZUBI: "Gärtner GaLaBau", AZUBI_PL: "Auszubildende Gärtner", GEWERK: "Hausmeister", GEWERK2: "Hausmeister / Garten", P1: "Gartenbau Yilmaz", P2: "Grün & Sauber Schmitt",
      GROSS_LANG: "Gartenneuanlage mit Pflaster und Bepflanzung", GROSS: "Garten neu anlegen", GROSS_NEU: "Neue Gartenanlage", GROSS_BER: "Beratung Gartengestaltung", GROSS_KURZ: "Gartenneuanlage",
      NOT_LANG: "Baum nach Sturm umgestürzt, Zufahrt blockiert", NOT_SATZ: "Seit dem Sturm heute Nacht ist die Zufahrt blockiert", NOT_DRING: "Zufahrt gesperrt", NOT: "Sturmschaden",
      HAUPT: "Pflasterarbeiten", WART: "Winterdienst", WARTV: "Hausmeistervertrag", ANLAGEN: "Wohnanlagen", ANLAGE: "Außenanlage", AUFTRAEGE: "Gartenaufträgen",
      KLEIN: "Hecke schneiden", KLEINOBJ_PL: "Hecken", KLEINOBJ: "Hecke", RAUM3: "Keller", RAUM2: "Treppenhaus", RAUM1: "Garten",
      GERAET_NEU: "Neue Bepflanzung", GERAET: "Rasenmäher", GERAET_PL: "Wohnanlagen", GERAET_ALT: "Rasenfläche", GERAET_ALT_A: "Alte Bepflanzung",
      MAT1: "Streusplitt, 10 Säcke", MAT2: "Rasendünger", MAT3: "Leuchtmittel", MAT4: "Messer für Heckenschere", MASS: "Fläche", PRUEF1: "Wege geprüft", PRUEF2: "Laub entfernt",
      WEG: "Pflege der Außenanlagen", OEFF: "Grünpflege", PAUSCH: "Pflegepauschale (Rasen, Hecke, Wege)", OBJEKTE: "Pflanzen", SANITAER: "Hausmeister",
      PROJ_PL: "Gartenpflegen", PROJ: "Gartenpflege", PROJ_VERB: "Garten pflegen", REP2: "Neue Leuchtmittel", REP: "Licht im Treppenhaus defekt", TEIL_PL: "Leuchtmittel", TEIL: "Leuchtmittel",
      WUNSCH: "pflegeleichter Garten", MANGEL: "Gehweg glatt", TEIL2: "Weg", MAT_B: "Pflastersteine", MAT_W: "Rindenmulch", MAT_F: "Material", ABSCHLUSS: "Abnahme" } },
    sicherheit: { name: "Sicherheits- & Klimatechnik", betrieb: "Muster Sicherheitstechnik", ohneQm: true, ui: { APP: "Techniker-App", F_BAUST: "für den Einsatz", D_BAUST: "dem Einsatz zugeordnet", Z_BAUST: "zum Einsatzort", A_BAUST: "der aktuelle Einsatz", MK: "Techniker", MK_PL: "Techniker", RB: "Einsatzbericht", RB_PL: "Einsatzberichte", AUFMASS: "Anlagenaufnahme", BAUST: "Einsatzort", BAUST_PL: "Einsätze" }, w: {
      BETRIEB: "Muster Sicherheitstechnik", AZUBI: "Elektroniker für Sicherheitstechnik", AZUBI_PL: "Auszubildende Sicherheitstechnik", GEWERK: "Sicherheit", GEWERK2: "Sicherheit / Klima", P1: "Klima Yilmaz", P2: "Alarm & Klima Schmitt",
      GROSS_LANG: "Alarmanlage mit Videoüberwachung, Bürogebäude", GROSS: "Alarm- und Videoanlage", GROSS_NEU: "Neue Alarmanlage", GROSS_BER: "Beratung Sicherheitskonzept", GROSS_KURZ: "Alarmanlage",
      NOT_LANG: "Alarmanlage meldet Störung am Sabotagekontakt", NOT_SATZ: "Seit heute früh piept die Alarmanlage", NOT_DRING: "Objekt ungesichert", NOT: "Alarmanlage gestört",
      HAUPT: "Videoanlage installieren", WART: "Wartung Alarmanlage", WARTV: "Wartungsvertrag Alarmanlage", ANLAGEN: "Alarmanlagen", ANLAGE: "Klimaanlage", AUFTRAEGE: "Sicherheitsaufträgen",
      KLEIN: "Klimageräte tauschen", KLEINOBJ_PL: "Klimageräten", KLEINOBJ: "Klimagerät", RAUM3: "Technikraum", RAUM2: "Eingang", RAUM1: "Büro",
      GERAET_NEU: "Neue Alarmzentrale", GERAET: "Alarmzentrale", GERAET_PL: "Alarmzentralen", GERAET_ALT: "Klimaanlage", GERAET_ALT_A: "Alte Zentrale",
      MAT1: "Bewegungsmelder, 6 Stück", MAT2: "Akku 12 V", MAT3: "Magnetkontakte", MAT4: "Filter für Klimagerät", MASS: "Kabelweg", PRUEF1: "Melder ausgelöst und getestet", PRUEF2: "Übertragung zur Leitstelle geprüft",
      WEG: "Sicherheitskonzept", OEFF: "Sicherheitstechnik", PAUSCH: "Montagepauschale (Melder, Kabel, Einweisung)", OBJEKTE: "Melder", SANITAER: "Sicherheitstechnik",
      PROJ_PL: "Videoanlagen", PROJ: "Videoanlage", PROJ_VERB: "Video nachrüsten", REP2: "Neue Schließzylinder", REP: "Tür schließt nicht", TEIL_PL: "Schließzylinder", TEIL: "Schließzylinder",
      WUNSCH: "Steuerung per App", MANGEL: "Fehlalarm", TEIL2: "Melder", MAT_B: "Kameras", MAT_W: "Kabelkanäle", MAT_F: "Technik", ABSCHLUSS: "Inbetriebnahme" } }
  };
  /* Beispielkunden: Bei Firmenkunden-Branchen sind die Kunden Firmen statt Familien */
  var KUNDEN_ALT = ["Familie Huber", "Thomas Bauer", "Sabine Wimmer", "Max Lechner", "Familie Maier", "Petra Schmid", "Johann Forster", "Andrea Kraus", "Familie Brandl", "Claudia Fischer", "Familie Obermeier", "Martin Reiter", "Familie Roth", "Familie Stadler", "Familie Arslan", "Jonas Pfeiffer"];
  var KUNDEN = {"it": ["Kanzlei Huber", "Praxis Dr. Bauer", "Steuerbüro Wimmer", "Lechner Immobilien", "Autohaus Maier", "Ingenieurbüro Schmid", "Forster & Partner", "Physiotherapie Kraus", "Brandl Logistik", "Apotheke Fischer", "Obermeier GmbH", "Reiter Druck", "Roth Versicherungen", "Stadler Bau", "Arslan Personal", "Pfeiffer Consulting"], "reinigung": ["Praxis Dr. Huber", "Autohaus Bauer", "Büro Wimmer", "Fitnessstudio Lechner", "Möbelhaus Maier", "Bürohaus Schmid", "Kanzlei Forster", "Zahnarzt Kraus", "Brandl Logistik", "Apotheke Fischer", "Obermeier GmbH", "Hotel Reiter", "Café Roth", "Stadler Immobilien", "Arslan Gastro", "Optik Pfeiffer"], "sicherheit": ["Juwelier Huber", "Autohaus Bauer", "Praxis Wimmer", "Lager Lechner", "Elektromarkt Maier", "Bürohaus Schmid", "Kanzlei Forster", "Apotheke Kraus", "Brandl Logistik", "Getränke Fischer", "Obermeier GmbH", "Reiter Druck", "Roth Versicherungen", "Stadler Bau", "Arslan Gastro", "Optik Pfeiffer"]};

  var REIHE = ["shk", "maler", "elektro", "dach", "reinigung", "it", "hausmeister", "sicherheit"];

  var m = location.search.match(/[?&]branche=([a-z]+)/), key = m && B[m[1]] ? m[1] : "shk", br = B[key];
  window.DEMO_BRANCHE = key;

  /* Regeln bauen */
  var esc = function (x) { return x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };
  var regeln = [];
  if (KUNDEN[key]) KUNDEN_ALT.forEach(function (n, i) { regeln.push([new RegExp(esc(n), "g"), KUNDEN[key][i]]); });
  if (key !== "shk") {
    /* Materialzeile im Aufmaß: Fliesenpakete gibt es nur im SHK-/Fliesenbereich */
    regeln.push([/Bodenfliesen ([\d.,]+) m² \(\d+ Pakete\) · Wandfliesen ([\d.,]+) m² \(\d+ Pakete\)/g,
      key === "maler" ? "Abdeckvlies $1 m² · Wandfarbe für $2 m²" : "Bodenfläche $1 m² · Wandfläche $2 m²"]);
    SCHLUESSEL.forEach(function (s) { var v = br.w[s[1]]; if (v) regeln.push([new RegExp((s[2] ? "\\b" : "") + esc(s[0]) + (s[2] ? "\\b" : ""), "g"), v]); });
  }
  if (br.ui) OBERFLAECHE.forEach(function (s) { if (br.ui[s[1]]) regeln.push([new RegExp(esc(s[0]), "g"), br.ui[s[1]]]); });
  /* Flächenangaben aus den Beispieltexten passen nicht zu jeder Branche */
  if (br.ohneQm) { regeln.push([/,? \(ca\. \d+(,\d+)? m²\)/g, ""], [/,? ca\. \d+(,\d+)? m²/g, ""], [/ – \d+ m²/g, ""]); }
  var exakt = br.exakt || [];
  function ueber(t) {
    if (!t || !regeln.length) return t;
    for (var i = 0; i < regeln.length; i++) t = t.replace(regeln[i][0], regeln[i][1]);
    return t;
  }
  window.DEMO_UEBERSETZE = ueber;

  /* Text auf der Seite übersetzen – auch alles, was später neu erscheint */
  var gesehen = new WeakMap();
  function frei(el) { return !(el && el.closest && el.closest("[data-nt]")); }
  function knoten(n) {
    if (gesehen.get(n) === n.data || !frei(n.parentNode)) return;
    var alt = n.data, neu = ueber(alt);
    var e = exakt.filter(function (x) { return alt.trim() === x[0]; })[0];
    if (e) neu = alt.replace(e[0], e[1]);
    if (neu !== alt) n.data = neu;
    gesehen.set(n, n.data);
  }
  function feld(el) {
    if (!frei(el)) return;
    if (el.matches && el.matches("input[type=text], input:not([type]), textarea") && el.value) { var v = ueber(el.value); if (v !== el.value) el.value = v; }
    ["placeholder", "title", "aria-label", "alt"].forEach(function (a) { var x = el.getAttribute && el.getAttribute(a); if (x) { var y = ueber(x); if (y !== x) el.setAttribute(a, y); } });
  }
  function baum(root) {
    if (!regeln.length && !exakt.length) return;
    if (root.nodeType === 3) return knoten(root);
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE)$/.test(root.nodeName) || !frei(root)) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { return n.parentNode && /^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
    var n; while ((n = w.nextNode())) knoten(n);
    feld(root); root.querySelectorAll && root.querySelectorAll("input, textarea, [placeholder], [title], [aria-label], img[alt]").forEach(feld);
  }
  if (regeln.length || exakt.length) {
    new MutationObserver(function (ms) {
      ms.forEach(function (mu) {
        if (mu.type === "characterData") knoten(mu.target);
        else mu.addedNodes.forEach(baum);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    baum(document.body);
    /* Vorlesen: Sprechtext ebenfalls übersetzen */
    if (window.SpeechSynthesisUtterance) {
      var U = window.SpeechSynthesisUtterance;
      window.SpeechSynthesisUtterance = function (t) { return new U(ueber(t)); };
      window.SpeechSynthesisUtterance.prototype = U.prototype;
    }
  }

  /* Auswahlfeld „Branche“ oben und Firmenname */
  var sel = document.getElementById("branche");
  if (sel) {
    sel.innerHTML = REIHE.map(function (k) { return '<option value="' + k + '"' + (k === key ? " selected" : "") + ">" + B[k].name + "</option>"; }).join("");
    sel.addEventListener("change", function () {
      var u = location.pathname + (sel.value === "shk" ? "" : "?branche=" + sel.value) + location.hash;
      location.href = u;
    });
  }
  var firma = document.getElementById("app-firma");
  if (firma) firma.textContent = br.betrieb + " · Beispieldaten";
  document.documentElement.setAttribute("data-demo-branche", key);

  /* Höhe der oberen Leiste merken, damit die Seitenleiste darunter sitzt */
  var top = document.querySelector(".app-top");
  function hoehe() { if (top) document.documentElement.style.setProperty("--top-h", top.offsetHeight + "px"); }
  hoehe(); window.addEventListener("resize", hoehe);
})();
