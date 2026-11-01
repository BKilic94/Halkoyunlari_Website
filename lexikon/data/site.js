/* Redaktionelle Konfiguration der Website (manuell pflegbar).
   Kapitelnummern verweisen auf data/structure.js. Gruppen dienen nur der Navigation. */
window.HD = window.HD || {};

HD.site = {
  defaultLang: "tr",
  languages: ["tr", "en"],

  /* Willkommensseite beim Aufruf der Startadresse: "first-visit" (nur beim ersten Besuch), "always" oder "off" */
  intro: "first-visit",

  /* Thematische Gruppen für die Startseite */
  groups: [
    { id: "kavramlar", chapters: ["1", "2", "3", "4", "5", "6", "7", "8"],
      title: { tr: "Kavramlar ve tarih", en: "Concepts and history" } },
    { id: "bicimler", chapters: ["9", "10", "14", "15", "16", "17"],
      title: { tr: "Biçimler ve türler", en: "Forms and genres" } },
    { id: "etkenler", chapters: ["11", "12", "13"],
      title: { tr: "Etkenler", en: "Influences" } },
    { id: "kurumlar", chapters: ["18", "19"],
      title: { tr: "Eğitim ve kurumlar", en: "Education and institutions" } },
    { id: "yoreler", chapters: ["20"],
      title: { tr: "Yöreler", en: "Regions" } }
  ],

  /* Kapitel, deren Unterkapitel als Karten-Reihe auf der Startseite erscheinen */
  featuredForms: "10",
  regionsChapter: "20",

  /* Vorschaubild einer Karte, wenn nicht das erste Bild des Eintrags verwendet werden soll */
  covers: {
    "10.5": "assets/img/buch/image31.png"
  },

  /* Lage der Kartenmarkierungen (Längengrad, Breitengrad) für die Yöreler */
  regionGeo: {
    "20.1": [42.11, 38.40], "20.2": [41.27, 39.90], "20.3": [40.50, 38.88],
    "20.4": [39.22, 38.67], "20.5": [27.22, 41.73], "20.6": [38.28, 37.76],
    "20.7": [39.72, 41.00], "20.8": [43.38, 38.50], "20.9": [37.38, 37.07],
    "20.10": [33.93, 36.38], "20.11": [40.23, 37.91], "20.12": [27.85, 37.85],
    "20.13": [43.10, 40.60], "20.14": [41.82, 41.18]
  },

  /* Auf der Karte hervorgehobene Provinzen je Yöre (Namen wie in data/map.js) */
  regionProvinces: {
    "20.1": ["Bitlis"], "20.2": ["Erzurum"], "20.3": ["Bingöl"], "20.4": ["Elazığ"],
    "20.5": ["Kırklareli"], "20.6": ["Adıyaman"], "20.7": ["Trabzon"], "20.8": ["Van"],
    "20.9": ["Gaziantep"], "20.10": ["Mersin"], "20.11": ["Diyarbakır"],
    "20.12": ["İzmir", "Aydın", "Muğla", "Denizli", "Manisa"],
    "20.13": ["Kars"], "20.14": ["Artvin"]
  },

  /* Beschriftungen von Meeren und Nachbarländern (Längengrad, Breitengrad) */
  mapLabels: [
    { kind: "sea", at: [34.6, 42.15], name: { tr: "Karadeniz", en: "Black Sea" } },
    { kind: "sea", at: [31.2, 35.75], name: { tr: "Akdeniz", en: "Mediterranean Sea" } },
    { kind: "sea", at: [24.5, 37.6], anchor: "start", name: { tr: "Ege Denizi", en: "Aegean Sea" } },
    { kind: "sea-sm", at: [28.15, 40.72], name: { tr: "Marmara", en: "Marmara" } },
    { kind: "land", at: [25.9, 42.3], name: { tr: "Bulgaristan", en: "Bulgaria" } },
    { kind: "land", at: [24.6, 41.2], anchor: "start", name: { tr: "Yunanistan", en: "Greece" } },
    { kind: "land", at: [43.4, 42.05], name: { tr: "Gürcistan", en: "Georgia" } },
    { kind: "land", at: [45.55, 40.5], anchor: "end", name: { tr: "Ermenistan", en: "Armenia" } },
    { kind: "land", at: [45.45, 37.55], anchor: "end", name: { tr: "İran", en: "Iran" } },
    { kind: "land", at: [43.4, 36.25], name: { tr: "Irak", en: "Iraq" } },
    { kind: "land", at: [38.6, 35.8], name: { tr: "Suriye", en: "Syria" } },
    { kind: "land", at: [33.25, 35.05], name: { tr: "Kıbrıs", en: "Cyprus" } }
  ]
};
