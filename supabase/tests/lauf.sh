#!/bin/sh
# Lokaler Test: frische Datenbank, Supabase-Nachbau, Schema, Prüfungen
H=${PGHOST:?}; PORT=${PGPORT:-5433}
psql -h $H -p $PORT -U postgres -q -c 'drop database if exists kundario_test' -c 'create database kundario_test' >/dev/null
for f in tests/00_supabase_nachbau.sql migrations/001_kundario_schema.sql migrations/003_rechnungen_festschreiben.sql migrations/004_ausbau.sql migrations/005_einkauf_finanzen.sql migrations/006_belege_kalkulation.sql migrations/007_kasse_steuer.sql migrations/008_fristen.sql migrations/009_anfragelink.sql tests/10_zugriff_test.sql tests/20_festschreiben_test.sql tests/30_ausbau_test.sql tests/40_einkauf_test.sql tests/50_belege_test.sql tests/60_kasse_test.sql tests/70_fristen_test.sql tests/80_anfragelink_test.sql; do
  out=$(psql -h $H -p $PORT -U postgres -d kundario_test -v ON_ERROR_STOP=1 -q -f $f 2>&1) || { echo "$out"; echo "FEHLER in $f"; exit 1; }
  echo "$out" | grep -v '^NOTICE:  OK' | grep -v '^$' || true
done
