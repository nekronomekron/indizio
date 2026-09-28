/**
 * Die Versionsnummer des Spiels, `<Jahr>.<Nummer>`.
 *
 * Eingesetzt beim Bauen aus der `package.json` — die einzige Stelle, an der
 * sie gepflegt wird. Hochgezaehlt wird sie mit `npm run bump`.
 *
 * Diese Datei ist die **einzige**, die den eingesetzten Wert anfasst. Der Rest
 * der App importiert eine ganz normale Konstante und muss von der Bau-Magie
 * nichts wissen.
 */
export const APP_VERSION: string = __APP_VERSION__;
