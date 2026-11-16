/* Verbindung zur Kundario-Datenbank (Supabase, Frankfurt).
   Beide Werte sind öffentlich und dürfen im Browser stehen.
   Der geheime service_role-Schlüssel gehört NIE hierher. */
window.KUNDARIO_CONFIG = {
  supabaseUrl: "https://yalcxqfsihyxftuiajwy.supabase.co",
  supabaseKey: "sb_publishable_ExZRcz_WY9eQ9IIJLuKQ0Q_1M4cY7Dr"
};
// Mit ?testmodus in der Adresse läuft die App ohne Server, nur im Browser (zum Ausprobieren).
if (/[?&]testmodus\b/.test(location.search)) window.KUNDARIO_CONFIG = {};
