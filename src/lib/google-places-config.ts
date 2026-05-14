export interface OutletPlaceConfig {
  outletKey:  string;
  outletName: string;
  placeId:    string;
}

export const OUTLET_PLACE_CONFIGS: OutletPlaceConfig[] = [
  { outletKey: "aeon-bukit-tinggi", outletName: "AEON BUKIT TINGGI",  placeId: "ChIJlxCFzpGtzTERFHT0VKoTvYQ" },
  { outletKey: "main-place",        outletName: "MAIN PLACE",          placeId: "ChIJWQwmdrqzzTER-1vasJy9Yp0GF" },
  { outletKey: "paradigm-mall",     outletName: "PARADIGM MALL",       placeId: "ChIJicQdxqNNzDERIVo1cS8Dbd0" },
  { outletKey: "east-coast-mall",   outletName: "EAST COAST MALL",     placeId: "ChIJ9RJNfmK7yDEReqw_Zn37DmU" },
  { outletKey: "aeon-permas-jaya",  outletName: "AEON PERMAS JAYA",    placeId: "ChIJ06A0xtRt2jERoau-HFlzHPo" },
  { outletKey: "aeon-bukit-indah",  outletName: "AEON BUKIT INDAH",    placeId: "ChIJk_g1JOVz2jERuDPnKOxtoRw" },
  { outletKey: "aeon-seremban",     outletName: "AEON SEREMBAN",       placeId: "ChIJaQdEcKnnzTERM52ysnhKhfo" },
  { outletKey: "aeon-wangsa-maju",  outletName: "AEON WANGSA MAJU",   placeId: "ChIJ58C8HN45zDERWuEF31kjsg0" },
  { outletKey: "alamanda",          outletName: "ALAMANDA",            placeId: "ChIJAZ2r97nJzTERb_BFwWL5HGg" },
  { outletKey: "berjaya-times-sq",  outletName: "BERJAYA TIMES SQ",   placeId: "ChIJJTKN3nQ3zDERKxncEIXxlNw" },
  { outletKey: "aeon-kulaijaya",    outletName: "AEON KULAIJAYA",      placeId: "ChIJo7tgmh552jERHKrLCNDO10U" },
  { outletKey: "sunway-carnival",   outletName: "SUNWAY CARNIVAL",     placeId: "ChIJP14lY3DFSjAR3rGMGsk-rVw" },
  { outletKey: "mayang-mall",       outletName: "MAYANG MALL",         placeId: "ChIJUbbg8CC9tzERbO-EnBSEKuw" },
];

export const CONFIGURED_OUTLETS = OUTLET_PLACE_CONFIGS.filter(o => o.placeId !== "");
