#!/bin/sh
# Lokaler Test: frische Datenbank, Supabase-Nachbau, Schema, Prüfungen
H=${PGHOST:?}; PORT=${PGPORT:-5433}
psql -h $H -p $PORT -U postgres -q -c 'drop database if exists kundario_test' -c 'create database kundario_test' >/dev/null
for f in tests/00_supabase_nachbau.sql migrations/*.sql tests/10_zugriff_test.sql; do
  psql -h $H -p $PORT -U postgres -d kundario_test -v ON_ERROR_STOP=1 -q -f $f 2>&1 | grep -v '^NOTICE:  OK' || exit 1
done
