import en from "./locales/en.json";
import tr from "./locales/tr.json";

export const messages = { en, tr };

export const signalKeys = {
  "Tedarikçinin geçmiş gecikme oranı yüksek.": "supplierSignal",
  "Sipariş anındaki operasyon iş yükü yüksek.": "workloadSignal",
  "Taahhüt edilen teslim süresi kısa.": "shortPromiseSignal",
  "Teslimat mesafesi uzun.": "distanceSignal",
  "Bu sipariş için belirlenen eşiklerde belirgin bir operasyon sinyali yok.": "noSignal",
};
