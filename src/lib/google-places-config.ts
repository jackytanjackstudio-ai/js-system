// ─── Google Places API — Outlet Place IDs ────────────────────────────────────
// How to find a Place ID:
//   1. Go to https://developers.google.com/maps/documentation/places/web-service/place-id
//   2. Or: open Google Maps → search the outlet → share → copy link
//      The link contains: maps/place/.../@lat,lng,...  — use the Place ID Finder tool
//   3. Or in Maps URL: look for "1s<PLACE_ID>" after the coordinates
//
// Leave placeId as "" for outlets not yet configured — they'll show as "Not configured".

export interface OutletPlaceConfig {
  outletKey:  string;  // matches OUTLET_TARGETS_2026 key
  outletName: string;
  placeId:    string;  // ChIJ... format from Google Maps
}

export const OUTLET_PLACE_CONFIGS: OutletPlaceConfig[] = [
  { outletKey: "aeon-bukit-tinggi", outletName: "AEON BUKIT TINGGI",  placeId: "" },
  { outletKey: "main-place",        outletName: "MAIN PLACE",          placeId: "" },
  { outletKey: "paradigm-mall",     outletName: "PARADIGM MALL",       placeId: "" },
  { outletKey: "east-coast-mall",   outletName: "EAST COAST MALL",     placeId: "" },
  { outletKey: "aeon-permas-jaya",  outletName: "AEON PERMAS JAYA",    placeId: "" },
  { outletKey: "aeon-bukit-indah",  outletName: "AEON BUKIT INDAH",    placeId: "" },
  { outletKey: "aeon-seremban",     outletName: "AEON SEREMBAN",       placeId: "" },
  { outletKey: "aeon-wangsa-maju",  outletName: "AEON WANGSA MAJU",   placeId: "" },
  { outletKey: "alamanda",          outletName: "ALAMANDA",            placeId: "" },
  { outletKey: "berjaya-times-sq",  outletName: "BERJAYA TIMES SQ",   placeId: "" },
  { outletKey: "aeon-kulaijaya",    outletName: "AEON KULAIJAYA",      placeId: "" },
  { outletKey: "sunway-carnival",   outletName: "SUNWAY CARNIVAL",     placeId: "" },
  { outletKey: "mayang-mall",       outletName: "MAYANG MALL",         placeId: "" },
];

export const CONFIGURED_OUTLETS = OUTLET_PLACE_CONFIGS.filter(o => o.placeId !== "");
