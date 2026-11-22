#!/bin/sh
# Alle Tests der App nacheinander: sh tools/alle_tests.sh   (startet bei Bedarf den lokalen Server auf Port 8765)
cd "$(dirname "$0")/.." || exit 1
curl -s -o /dev/null http://localhost:8765/app/ || { python3 -m http.server 8765 >/dev/null 2>&1 & sleep 1; }
fehler=0
for t in e2e_app e2e_ausbau e2e_handwerk e2e_profi e2e_bauteile e2e_vorort e2e_verwaltung e2e_verwaltung_import e2e_preise e2e_anfragelink e2e_uebergabe e2e_gesamt e2e_eingang e2e_sprache e2e_partner; do
  aus=$(node tools/$t.js 2>&1); code=$?
  echo "$t: $(echo "$aus" | grep -c '^OK') OK, $(echo "$aus" | grep -c '^FEHLER') FEHLER"
  [ $code -ne 0 ] && { echo "$aus" | grep '^FEHLER\|Error' | head -5; fehler=1; }
done
node tools/test_provision.js >/dev/null 2>&1 && echo "test_provision: OK" || { echo "test_provision: FEHLER"; fehler=1; }
[ $fehler -eq 0 ] && echo "ALLE TESTS GRÜN" || echo "ES GIBT FEHLER"
exit $fehler
