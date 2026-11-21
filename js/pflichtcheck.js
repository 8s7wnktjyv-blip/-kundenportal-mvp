/* =====================================================================
   PFLICHTEN-CHECK (Seite hausverwaltungen.html)
   Prüft grob, ob ein Objekt unter § 60b GModG (Heizungsprüfung) fällt.
   Stand der Regeln: November 2026. Keine Rechtsberatung.
   Nichts wird gespeichert oder verschickt.
   ===================================================================== */
(function () {
  "use strict";
  var box = document.getElementById("pflichtcheck");
  if (!box) return;

  var einheiten = document.getElementById("pc-einheiten");
  var art = document.getElementById("pc-art");
  var jahr = document.getElementById("pc-jahr");
  var aus = document.getElementById("pc-ergebnis");
  var heute = new Date().getFullYear();

  // Auswahl für das Einbaujahr füllen
  var opts = [["alt", "vor Oktober 2009"], ["2009", "Oktober bis Dezember 2009"]];
  for (var y = 2010; y <= heute; y++) opts.push([String(y), String(y)]);
  opts.push(["unklar", "Weiß ich nicht"]);
  opts.forEach(function (o) {
    var el = document.createElement("option");
    el.value = o[0]; el.textContent = o[1];
    jahr.appendChild(el);
  });

  var CTA = '<p style="margin:12px 0 0"><a class="btn btn-signal" href="kontakt.html">Prüfung organisieren lassen</a></p>';

  function zeige(stufe, titel, text, mitCta) {
    aus.className = "pc-ergebnis pc-" + stufe;
    aus.innerHTML = "<strong>" + titel + "</strong><p>" + text + "</p>" + (mitCta ? CTA : "");
  }

  function pruefe() {
    var e = einheiten.value, a = art.value, j = jahr.value;
    if (!e || !a || (a === "kessel" && !j)) { aus.className = "pc-ergebnis"; aus.innerHTML = ""; return; }

    if (e === "klein") {
      return zeige("ok", "Keine Heizungsprüfung nach § 60b nötig.",
        "Die Pflicht gilt erst ab 6 Einheiten. Gibt es eine zentrale Heizung für mehrere Mietparteien, müssen die Heizkostenzähler in der Regel trotzdem bis 31.12.2026 fernablesbar sein.", false);
    }
    if (a === "unklar") {
      return zeige("info", "Das klären wir gemeinsam.",
        "Ob die Pflicht greift, hängt von der Heizungsart und dem Einbaujahr ab. Beides steht meist im Protokoll des Schornsteinfegers.", true);
    }
    if (a === "wp") {
      return zeige("info", "Für Wärmepumpen gilt eine eigene Betriebsprüfung (§ 60a).",
        "Wärmepumpen in Betrieb seit 2024 werden innerhalb von 2 Jahren geprüft, danach spätestens alle 5 Jahre – außer bei Fernkontrolle oder Wartungsvertrag. Zum 01.01.2027 sind Änderungen angekündigt, das prüfen wir im Einzelfall.", true);
    }
    if (j === "unklar") {
      return zeige("info", "Wahrscheinlich betroffen – das Einbaujahr entscheidet.",
        "Das Einbaujahr steht auf dem Typenschild der Heizung oder im Protokoll des Schornsteinfegers.", true);
    }
    if (j === "alt") {
      return zeige("warn", "Betroffen: Prüfung bis 30.09.2027.",
        "Heizungsbauer sind vor der Frist erfahrungsgemäß knapp. Je früher der Termin steht, desto entspannter.", true);
    }
    var faellig = Number(j) + 16; // 15 Jahre + 1 Jahr Frist
    if (faellig < heute) {
      return zeige("warn", "Wahrscheinlich überfällig.",
        "Die Prüfung war im Jahr " + (faellig - 1) + " oder " + faellig + " fällig (15 Jahre nach Einbau, dann 1 Jahr Frist). Bitte zeitnah nachholen.", true);
    }
    if (faellig <= heute + 1) {
      return zeige("warn", "Bald fällig: spätestens " + faellig + ".",
        "Die Prüfung ist innerhalb eines Jahres fällig, nachdem die Heizung 15 Jahre alt ist. Der genaue Termin hängt vom Einbaumonat ab.", true);
    }
    return zeige("ok", "Fällig im Jahr " + faellig + ".",
      "Noch Zeit – mit dem Fristen-Service erinnern wir Sie rechtzeitig und beauftragen den Fachbetrieb nach Ihrer Freigabe.", false);
  }

  [einheiten, art, jahr].forEach(function (el) { el.addEventListener("change", pruefe); });
  art.addEventListener("change", function () {
    // Einbaujahr nur bei Heizkessel abfragen
    jahr.closest(".field").hidden = art.value !== "kessel";
  });
  jahr.closest(".field").hidden = true;
})();
