# Operasyon Radar

Yerel bir operasyon kontrol paneli. Siparişlerin gecikme riskini tahmin eder, risk seviyelerini gösterir ve Ollama ile açıklama üretmeye çalışır. Proje, React + Vite arayüzü, Python + FastAPI API’si ve scikit-learn makine öğrenimi modeli ile çalışır; başlatıldığında demo verileriyle hazır gelir.

## Proje özeti

- Siparişleri gecikme riski açısından değerlendirir
- Tarih bazlı ayrılmış veri ile Random Forest modeli eğitir
- Open CSV formatı ile eğitim ve sipariş yükleme desteği sunar
- React tabanlı kontrol panelinde risk filtresi ve arama bulunur
- Ollama erişilebildiğinde sipariş açıklaması ve portföy operasyon özeti üretir; erişilemezse açıkça etiketlenen bir fallback gösterir
- Yerel geliştirme MVP'si olarak tasarlanmıştır; canlı üretim verisi için ek doğrulama gerekir

## Teknoloji yığını

- Frontend: React + Vite
- Backend: Python + FastAPI
- ML: scikit-learn, RandomForestClassifier
- Veri işleme: pandas, numpy
- AI açıklaması: Ollama HTTP API
- Test: pytest

## Gereksinimler

- Python 3.14
- Node.js 20.19+ veya 22.12+
- npm
- İsteğe bağlı: Ollama ve yerel model

## Kurulum

### 1) Backend

Windows PowerShell:

```powershell
cd backend
py -3.14 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

macOS / Linux:

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API belgeleri: http://127.0.0.1:8000/docs

### 2) Frontend

```powershell
cd frontend
npm install
npm run dev
```

Tarayıcıda şu adresi açın:

- http://localhost:5173

### 3) Ollama (isteğe bağlı)

Ollama kuruluysa model indirilebilir:

```powershell
ollama pull qwen2.5:3b
```

## Kullanım akışı

1. Uygulama başlatıldığında demo verisi ve demo model otomatik yüklenir.
2. Risk filtresi ve sipariş araması ile riskli siparişleri inceleyin.
3. "Eğitim CSV'si yükle" ile yeni bir eğitim seti yükleyin.
4. "Sipariş CSV'si yükle" ile açık siparişleri tahmin ettirin.
5. Genel bakıştan portföy özeti üretin veya sipariş seçip detay görünümünde sinyalleri ve AI açıklamasını kontrol edin.
6. "Demo verisini yenile" butonuyla sentetik veri ve modeli sıfırlayın.

## CSV sözleşmesi

CSV dosyaları UTF-8 ve virgülle ayrılmış olmalıdır. Maksimum 5 MB, 50.000 satır.

| Sütun | Açıklama | Geçerli değer |
|---|---|---|
| order_id | Benzersiz sipariş kimliği | 100 karakteri aşmaz, tekrarsız olmalı |
| order_date | Sipariş tarihi | ISO tarih formatı, örn. 2026-01-15 |
| quantity | Sipariş adedi | > 0 |
| supplier_delay_rate | Tedarikçi geçmiş gecikme oranı | 0–1 |
| workload | Kapasite kullanım oranı | 0–1 |
| distance_km | Teslimat mesafesi | >= 0 |
| promised_days | Taahhüt edilen teslim süresi | > 0 |
| delayed | Gerçek gecikme sonucu, yalnızca eğitim verisinde gerekli | 0 veya 1 |

Eğitim CSV'si için:

- en az 100 satır olmalı
- tarih sıralamasında yeterli çeşitlilik olmalı
- eğitim ve test ayrımında her iki sınıf için veri bulunmalı
- `delayed` alanı 0/1 olmalıdır

## Model davranışı

- Özellikler: `quantity`, `supplier_delay_rate`, `workload`, `distance_km`, `promised_days`
- Model: RandomForestClassifier
- Eğitim: geçmiş kayıtlar tarih sırasına göre sıralanır; ilk yaklaşık %80 eğitim, son yaklaşık %20 test için ayrılır
- Aynı tarihli kayıtlar sınırda bölünmez
- Test metriği sadece ayrılmış test seti üzerinden hesaplanır
- Risk skorları kalibrasyonu doğrulanmış olasılık değildir; operasyonel karar için ek doğrulama gerekir

Gösterilen temel metrikler:

- Accuracy
- Precision
- Recall
- ROC-AUC
- Brier score
- Baseline accuracy

Risk etiketleri uygulama içinde şu eşiklere göre tanımlanır:

- Düşük: < %35
- Orta: %35–65
- Yüksek: >= %65

## Test ve doğrulama

Backend testleri:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
```

Frontend üretim derlemesi:

```powershell
cd frontend
npm run build
```

## İletişim

Sorularınız, geri bildirimleriniz veya iş birliği fırsatları için dilediğiniz zaman iletişime geçebilirsiniz.

🌐 **Website**  
https://www.yusuftan.com.tr

💼 **LinkedIn**  
https://www.linkedin.com/in/yusuftann/

📧 **Email**  
yusuftan41@hotmail.com