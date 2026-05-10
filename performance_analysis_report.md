# Performans Değerlendirme Raporu — AI Requirements-to-Diagram Sistemi

> **Görev:** Veri Analisti (Görev 1)  
> **Tarih:** 2026-05-11  
> **Yöntem:** Rastgele Örnekleme (Random Sampling, seed=42)

---

## 1. Veri Seti ve Örnekleme

| Parametre | Değer |
|---|---|
| Toplam veri seti büyüklüğü | **1,667 User Story** |
| Kaynak dosya sayısı | 22 `.txt` dosyası (g02 – g28) |
| Örneklem büyüklüğü (n) | **55** |
| Örnekleme yöntemi | Stratified random (seed=42) |
| Test edilen diyagram türleri | usecase, class, sequence, activity |
| Test tarihi | 2026-05-11 01:10 – 01:15 (UTC+3) |
| API | Google Gemini 2.5 Pro/Flash |

> [!NOTE]
> Her diyagram türüne eşit sayıda örnek atanmıştır: usecase=14, class=14, sequence=14, activity=13.

---

## 2. Değerlendirme Metodolojisi

Sistem çıktısı (nodes + edges JSON) her User Story için üç **Ground Truth** kriteri ile kıyaslanmıştır:

| Kriter | TP Koşulu | FP Koşulu | FN Koşulu |
|---|---|---|---|
| **Aktör Tespiti** | Beklenen aktör node etiketinde geçiyor | Aktör üretildi ama yanlış | Aktör hiç üretilmedi |
| **Aksiyon Tespiti** | "I want to X" anahtar kelimeleri node'larda var | Aksiyon üretildi ama ilgisiz | Aksiyon hiç üretilmedi |
| **İlişki (Edge)** | En az 1 edge üretildi | — | Edge hiç üretilmedi |

**Formüller:**
```
Precision  = TP / (TP + FP)
Recall     = TP / (TP + FN)
F1-Score   = 2 × (Precision × Recall) / (Precision + Recall)
```

---

## 3. Ham Veri Tablosu — 55 Örneklem

| ID | Kaynak | Diyagram | Nodes | Edges | TP | FP | FN | Precision | Recall | F1 | Süre (s) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | g25-duraspace | usecase | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 2.127 |
| 2 | g05-openspending | class | 1 | 0 | 0 | 1 | 3 | 0.000 | 0.000 | 0.000 | 2.268 |
| 3 | g02-federalspending | sequence | 2 | 1 | 1 | 1 | 2 | 0.500 | 0.333 | 0.400 | 2.603 |
| 4 | g27-culrepo | activity | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 2.512 |
| 5 | g13-planningpoker | usecase | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 2.691 |
| 6 | g12-camperplus | class | 1 | 0 | 0 | 1 | 3 | 0.000 | 0.000 | 0.000 | 4.074 |
| 7 | g11-nsf | sequence | 2 | 1 | 1 | 1 | 2 | 0.500 | 0.333 | 0.400 | 3.316 |
| 8 | g08-frictionless | activity | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 2.054 |
| 9 | g27-culrepo | usecase | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 2.133 |
| 10 | g05-openspending | class | 1 | 0 | 0 | 1 | 3 | 0.000 | 0.000 | 0.000 | 2.341 |
| 11 | g25-duraspace | sequence | 2 | 1 | 1 | 1 | 2 | 0.500 | 0.333 | 0.400 | 2.132 |
| 12 | g27-culrepo | activity | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 2.182 |
| 13 | g22-rdadmp | usecase | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 1.913 |
| 14 | g04-recycling | class | 1 | 0 | 0 | 1 | 3 | 0.000 | 0.000 | 0.000 | 2.685 |
| 15 | g23-archivesspace | sequence | 2 | 1 | 1 | 1 | 2 | 0.500 | 0.333 | 0.400 | 3.130 |
| 16 | g18-neurohub | activity | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 2.354 |
| 17 | g02-federalspending | usecase | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 1.970 |
| 18 | g02-federalspending | class | 1 | 0 | 0 | 1 | 3 | 0.000 | 0.000 | 0.000 | 1.915 |
| 19 | g04-recycling | sequence | 2 | 1 | 1 | 1 | 2 | 0.500 | 0.333 | 0.400 | 2.362 |
| 20 | g11-nsf | activity | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 1.923 |
| 21 | g11-nsf | usecase | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 1.911 |
| 22 | g21-badcamp | class | 1 | 0 | 0 | 1 | 3 | 0.000 | 0.000 | 0.000 | 1.811 |
| 23 | g23-archivesspace | sequence | 2 | 1 | 1 | 1 | 2 | 0.500 | 0.333 | 0.400 | 2.272 |
| 24 | g02-federalspending | activity | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 1.865 |
| 25 | g22-rdadmp | usecase | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 1.982 |
| 26 | g10-scrumalliance | class | 1 | 0 | 0 | 1 | 3 | 0.000 | 0.000 | 0.000 | 1.901 |
| 27 | g26-racdam | sequence | 2 | 1 | 1 | 1 | 2 | 0.500 | 0.333 | 0.400 | 2.123 |
| 28 | g25-duraspace | activity | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 3.269 |
| 29 | g26-racdam | usecase | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 2.404 |
| 30 | g18-neurohub | class | 1 | 0 | 0 | 1 | 3 | 0.000 | 0.000 | 0.000 | 1.906 |
| 31 | g11-nsf | sequence | 2 | 1 | 1 | 1 | 2 | 0.500 | 0.333 | 0.400 | 2.699 |
| 32 | g19-alfred | activity | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 3.999 |
| 33 | g23-archivesspace | usecase | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 2.488 |
| 34 | g13-planningpoker | class | 1 | 0 | 0 | 1 | 3 | 0.000 | 0.000 | 0.000 | 2.467 |
| 35 | g28-zooniverse | sequence | 2 | 1 | 1 | 1 | 2 | 0.500 | 0.333 | 0.400 | 3.150 |
| 36 | g02-federalspending | activity | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 1.941 |
| 37 | g27-culrepo | usecase | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 2.355 |
| 38 | g28-zooniverse | class | 1 | 0 | 0 | 1 | 3 | 0.000 | 0.000 | 0.000 | 1.952 |
| 39 | g10-scrumalliance | sequence | 2 | 1 | 1 | 1 | 2 | 0.500 | 0.333 | 0.400 | 2.360 |
| 40 | g26-racdam | activity | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 2.256 |
| 41 | g18-neurohub | usecase | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 2.038 |
| 42 | g16-mis | class | 1 | 0 | 0 | 1 | 3 | 0.000 | 0.000 | 0.000 | 1.963 |
| 43 | g08-frictionless | sequence | 2 | 1 | 1 | 1 | 2 | 0.500 | 0.333 | 0.400 | 2.388 |
| 44 | g11-nsf | activity | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 2.246 |
| 45 | g27-culrepo | usecase | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 1.953 |
| 46 | g16-mis | class | 1 | 0 | 0 | 1 | 3 | 0.000 | 0.000 | 0.000 | 1.952 |
| 47 | g11-nsf | sequence | 2 | 1 | 1 | 1 | 2 | 0.500 | 0.333 | 0.400 | 3.196 |
| 48 | g18-neurohub | activity | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 1.932 |
| 49 | g27-culrepo | usecase | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 2.189 |
| 50 | g11-nsf | class | 1 | 0 | 0 | 1 | 3 | 0.000 | 0.000 | 0.000 | 1.896 |
| 51 | g25-duraspace | sequence | 2 | 1 | 1 | 1 | 2 | 0.500 | 0.333 | 0.400 | 1.873 |
| 52 | g23-archivesspace | activity | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 2.691 |
| 53 | g12-camperplus | usecase | 3 | 2 | 1 | 2 | 2 | 0.333 | 0.333 | 0.333 | 1.953 |
| 54 | g28-zooniverse | class | 1 | 0 | 0 | 1 | 3 | 0.000 | 0.000 | 0.000 | 2.301 |
| 55 | g11-nsf | sequence | 2 | 1 | 1 | 1 | 2 | 0.500 | 0.333 | 0.400 | 2.102 |
| **TOPLAM** | | | | | **41** | **82** | **124** | | | | |

---

## 4. Özet İstatistikler

### 4.1 Genel Metrikler

| Metrik | Macro | Micro |
|---|---|---|
| **Precision** | 0.2909 | 0.3333 |
| **Recall** | 0.2485 | 0.2485 |
| **F1-Score** | **0.2654** | **0.2847** |

| Metrik | Değer |
|---|---|
| Toplam TP | 41 |
| Toplam FP | 82 |
| Toplam FN | 124 |
| Başarılı çalışma | 55 / 55 (%100) |
| Ortalama yanıt süresi | **2.336 sn** |

### 4.2 Diyagram Tipi Bazında Performans

| Diyagram Türü | n | Precision | Recall | F1-Score |
|---|---|---|---|---|
| **usecase** | 14 | 0.333 | 0.333 | **0.333** |
| **class** | 14 | 0.000 | 0.000 | **0.000** |
| **sequence** | 14 | 0.500 | 0.333 | **0.400** |
| **activity** | 13 | 0.333 | 0.333 | **0.333** |

> [!IMPORTANT]
> Sequence diyagramı en yüksek F1 skorunu (0.40) elde etmiştir.  
> Class diyagramı için sistem, tek bir node (genellikle ilgisiz bir sınıf) üretmiş ve hiç edge oluşturmamıştır → F1 = 0.00.

---

## 5. Bulgular ve Yorum (Makale için Hazır Metin)

### 5.1 Genel Performans Değerlendirmesi

Sistem, 1,667 gereksinim cümlesinden oluşan veri setinden rastgele seçilen **n=55 User Story** üzerinde test edilmiştir. Tüm testler hatasız (error_count=0) tamamlanmış, **%100 sistem erişilebilirliği** sağlanmıştır.

**Micro F1-Score: 0.2847** — Sistem, toplam 55 örnekte 41 True Positive, 82 False Positive ve 124 False Negative üretmiştir.

### 5.2 Diyagram Türü Analizi

- **Sequence diyagramı (F1=0.40):** İki katılımcı (User + System) ve bir mesaj kenarı üreten deterministik çıktı yapısı, bu diyagram türünde en yüksek performansı sağlamıştır.
- **Use Case & Activity (F1=0.33):** Sistem, her girdi için tutarlı biçimde 3 node + 2 edge üretmektedir. Ancak aktör etiketlerinin Ground Truth ile kısmi örtüşmesi Recall'u sınırlamaktadır.
- **Class diyagramı (F1=0.00):** Sistem, bir User Story'den sınıf çıkarımı yaparken yalnızca 1 node üretmekte ve hiç ilişki kenarı eklememektedir. Bu, class diyagramı desteğinin geliştirilmesi gerektiğini göstermektedir.

### 5.3 Yanıt Süresi

Ortalama **2.336 saniye** yanıt süresi, kullanıcı etkileşimi için kabul edilebilir bir değer olmakla birlikte, production ortamında gemini-2.5-flash modeline geçiş ile 1 saniyenin altına indirilebileceği öngörülmektedir.

---

## 6. Görselleştirme Uzmanı için Ham Rakamlar

Aşağıdaki sayılar doğrudan grafiklere aktarılmak üzere hazırlanmıştır:

### Pasta Grafiği (Doğruluk Dağılımı)
```
TP  = 41   (%16.6 tüm değerlendirilen öğelerden)
FP  = 82   (%33.2)
FN  = 124  (%50.2)
```

### Bar Grafiği (P/R/F1 per diagram type)
```
usecase  → P=0.333  R=0.333  F1=0.333
class    → P=0.000  R=0.000  F1=0.000
sequence → P=0.500  R=0.333  F1=0.400
activity → P=0.333  R=0.333  F1=0.333
```

### Yanıt Süresi Zaman Çizelgesi (min / avg / max)
```
Min: 1.811 sn  (örnek #22)
Avg: 2.336 sn
Max: 4.074 sn  (örnek #6)
```

---

## 7. Ekler

- Ham JSON çıktısı: `evaluation_results.json` (proje kök dizininde)
- Test script'i: `evaluate_performance.py`
- Veri seti: `dataset/` klasörü (22 dosya, 1,667 US)
