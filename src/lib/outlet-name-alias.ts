// Maps DB outlet names → target keys used throughout the system.
// Add entries here whenever an outlet's DB name differs from its target key.
export const OUTLET_NAME_ALIAS: Record<string, string> = {
  // AEON SEREMBAN
  "AEON SEREMBAN 2":      "AEON SEREMBAN",
  "AEON SEREMBAN2":       "AEON SEREMBAN",
  // AEON WANGSA MAJU (outlet branded as Alpha Angle in MPOS)
  "AEON ALPHA ANGLE":     "AEON WANGSA MAJU",
  "ALPHA ANGLE":          "AEON WANGSA MAJU",
  // SUNWAY CARNIVAL
  "SUNWAY CARNIVAL MALL": "SUNWAY CARNIVAL",
  // AEON KULAIJAYA
  "AEON KULAI JAYA":      "AEON KULAIJAYA",
  "KULAI JAYA":           "AEON KULAIJAYA",
  // BERJAYA TIMES SQ
  "BERJAYA TIMES SQUARE": "BERJAYA TIMES SQ",
  "BERJAYA TIMES SQ.":    "BERJAYA TIMES SQ",
  "TIME SQUARE":          "BERJAYA TIMES SQ",
  "TIMES SQUARE":         "BERJAYA TIMES SQ",
  "KL TIMES SQUARE":      "BERJAYA TIMES SQ",
};

export function normalizeOutletName(name: string): string {
  const upper = name.toUpperCase().trim();
  return OUTLET_NAME_ALIAS[upper] ?? upper;
}
