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

  /* Ungefähre Lage (Längengrad, Breitengrad) für die Kartenskizze der Yöreler */
  regionGeo: {
    "20.1": [42.11, 38.40], "20.2": [41.27, 39.90], "20.3": [40.50, 38.88],
    "20.4": [39.22, 38.67], "20.5": [27.22, 41.73], "20.6": [38.28, 37.76],
    "20.7": [39.72, 41.00], "20.8": [43.38, 38.50], "20.9": [37.38, 37.07],
    "20.10": [33.93, 36.38], "20.11": [40.23, 37.91], "20.12": [27.85, 37.85],
    "20.13": [43.10, 40.60], "20.14": [41.82, 41.18]
  }
};
