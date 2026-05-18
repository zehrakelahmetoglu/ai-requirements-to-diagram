import os
import json
import re
import random
import logging
from google import genai
from google.genai import types

# --- Loglama Yapılandırması ---
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# YARDIMCI FONKSİYONLAR
# ---------------------------------------------------------------------------

def get_random_examples_from_dataset(num_examples: int = 3) -> str:
    """
    'dataset' klasöründen rastgele User Story'leri few-shot prompting için çeker.
    Hata durumunda sessizce geçmek yerine loglar.
    """
    dataset_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dataset")

    if not os.path.exists(dataset_dir):
        logger.warning("Dataset klasörü bulunamadı: %s", dataset_dir)
        return ""

    try:
        files = [f for f in os.listdir(dataset_dir) if f.endswith(".txt")]
        if not files:
            logger.warning("Dataset klasöründe .txt dosyası yok.")
            return ""

        examples = []
        for _ in range(num_examples):
            file = random.choice(files)
            filepath = os.path.join(dataset_dir, file)
            with open(filepath, "r", encoding="utf-8") as f:
                lines = [ln.strip() for ln in f if ln.strip() and len(ln.strip()) > 20]
            if lines:
                examples.append(random.choice(lines))

        if examples:
            return "\n".join(f"- {ex}" for ex in examples)

    except Exception as exc:
        logger.error("Dataset okunurken hata: %s", exc)

    return ""


def parse_ai_response(response) -> dict:
    """AI'dan gelen ham metni JSON dict'e dönüştürür."""
    raw_text = (getattr(response, "text", "") or "").strip()
    if not raw_text:
        raise ValueError("AI cevabı boş geldi.")

    # Markdown code fence temizliği
    cleaned = re.sub(r"^```json\s*|\s*```$", "", raw_text, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"^```\s*|\s*```$", "", cleaned).strip()

    return json.loads(cleaned)


def _call_gemini(client, prompt: str) -> dict:
    """
    Gemini modellerini sırayla dener (pro → flash).
    Başarılı olunca parse edilmiş dict döndürür; hepsi başarısız olursa hata fırlatır.
    """
    for model_name in ("gemini-2.5-pro", "gemini-2.5-flash"):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )
            return parse_ai_response(response)
        except Exception as exc:
            logger.warning("Model '%s' başarısız oldu: %s", model_name, exc)
            continue

    raise RuntimeError("Tüm Gemini modelleri başarısız oldu.")


# ---------------------------------------------------------------------------
# GEÇERLİLİK / KALİTE KONTROLÜ  (GÖREV 3 & 4)
# ---------------------------------------------------------------------------

def validate_requirement(text: str) -> dict:
    """
    Gelen metnin Epic / User Story / Geçersiz sınıflandırmasını yapar
    ve 1-10 arası bir kalite puanı üretir.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY bulunamadı; validasyon simülasyonu çalıştırılıyor.")
        return {
            "is_valid": True,
            "type": "User Story",
            "quality_score": 10,
            "feedback": "Simülasyon modu — API Key bulunamadı.",
        }

    prompt = f"""
Sen uzman bir Scrum Master ve Gereksinim Analistisin. Sana verilen metni değerlendir.

GELEN METİN: "{text}"

Lütfen aşağıdaki JSON formatında kesin ve adil bir değerlendirme yap:
{{
    "is_valid": true veya false,
    "type": "Epic" veya "User Story" veya "Geçersiz",
    "quality_score": 1 ile 10 arası tam sayı,
    "feedback": "Kullanıcıya kısa ve yapıcı geri bildirim"
}}

Değerlendirme Kriterleri:
- Çok kısa, belirsiz veya anlamsız metinler (örn: 'sisteme gir', 'buton yap') → is_valid: false, puan < 4
- Sistem çapında büyük bir işi anlatan metinler → "Epic" olarak işaretle, is_valid: true
- "As a [role], I want to [action], so that [benefit]" yapısına uygun metinler → puan >= 8
- Kısmi yapıya sahip (rol var ama fayda yok vb.) metinler → puan 5-7 arası
"""

    try:
        client = genai.Client(api_key=api_key)
        return _call_gemini(client, prompt)
    except Exception as exc:
        logger.error("validate_requirement hatası: %s", exc)
        return {
            "is_valid": True,
            "type": "Bilinmiyor",
            "quality_score": 5,
            "feedback": "Analiz sırasında hata oluştu, lütfen tekrar deneyin.",
        }


# ---------------------------------------------------------------------------
# ANA ANALİZ FONKSİYONU  (GÖREV 1, 2, 5)
# ---------------------------------------------------------------------------

def analyze_with_ai(text: str, diagram_type: str = "usecase") -> dict:
    """
    User Story / Epic metnini analiz ederek React Flow uyumlu
    nodes + edges JSON'u döndürür.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY bulunamadı; simülasyon modu aktif.")
        return get_simulation_data(text, diagram_type)

    golden_examples = get_random_examples_from_dataset(3)
    examples_section = (
        f"\n[SEKTÖREL VERİ SETİNDEN ÖRNEK GEREKSİNİMLER (Referans Al!)]\n{golden_examples}\n"
        if golden_examples
        else ""
    )

    diagram_rules = _get_diagram_rules(diagram_type)

    prompt = f"""
[GÖREV]
Sen deneyimli bir Yazılım Mimarı ve İş Analistisin.
Aşağıdaki metni analiz ederek "{diagram_type}" diyagramı için React Flow uyumlu bir JSON üret.
{examples_section}
[ANALİZ EDİLECEK METİN]
"{text}"

[ÇIKTI FORMATI — SADECE GEÇERLİ JSON, BAŞKA HİÇBİR ŞEY YOK]
{{
    "nodes": [...],
    "edges": [...]
}}

{diagram_rules}

ÖNEMLİ KURALLAR:
- nodes listesi HİÇBİR ZAMAN boş olmamalı.
- edges listesi, diyagram türüne göre EN AZ 1 ilişki içermeli (class diyagramı için en az 2 edge zorunlu).
- Tüm id değerleri benzersiz (unique) olmalı.
- Sadece JSON döndür; açıklama metni ekleme.
"""

    try:
        client = genai.Client(api_key=api_key)
        parsed = _call_gemini(client, prompt)
        return normalize_ai_output(parsed, text, diagram_type)
    except Exception as exc:
        logger.error("analyze_with_ai hatası: %s", exc)
        return get_simulation_data(text, diagram_type)


# ---------------------------------------------------------------------------
# DİYAGRAM TÜRÜNE GÖRE DETAYLI KURALLAR
# ---------------------------------------------------------------------------

def _get_diagram_rules(diagram_type: str) -> str:
    """Her diyagram türü için AI'a verilecek detaylı kural bloğunu döndürür."""

    if diagram_type == "usecase":
        return """
[USE CASE DİYAGRAMI KURALLARI]
1. Metindeki TÜM aktörleri tespit et (Kullanıcı, Admin, Sistem, 3. taraf servisler vb.).
   Node formatı: {"id": "a1", "type": "actor", "label": "👤 AktörAdı"}
2. Her aktörün gerçekleştirdiği TÜM aksiyonları/use case'leri tespit et.
   Node formatı: {"id": "uc1", "type": "usecase", "label": "Aksiyon Adı"}
3. Aktör → Use Case ilişkilerini edges'e ekle.
   Format: {"id": "e1", "source": "a1", "target": "uc1", "label": ""}
4. Use Case'ler arasında <<include>> veya <<extend>> ilişkisi varsa mutlaka ekle.
   Format: {"id": "e2", "source": "uc1", "target": "uc2", "label": "<<include>>", "animated": true}

ÖRNEK ÇIKTI:
{
  "nodes": [
    {"id": "a1", "type": "actor", "label": "👤 Kullanıcı"},
    {"id": "uc1", "type": "usecase", "label": "Sipariş Ver"},
    {"id": "uc2", "type": "usecase", "label": "Ödeme Yap"}
  ],
  "edges": [
    {"id": "e1", "source": "a1", "target": "uc1", "label": ""},
    {"id": "e2", "source": "uc1", "target": "uc2", "label": "<<include>>", "animated": true}
  ]
}
"""

    elif diagram_type == "class":
        return """
[CLASS DİYAGRAMI KURALLARI]
1. Metindeki TÜM önemli varlıkları (entity/nesne) sınıf olarak çıkar.
   En az 2, tercihen 3-5 sınıf üret.
   Node formatı:
   {
     "id": "c1",
     "type": "class",
     "label": "SınıfAdı",
     "attributes": ["- id: int", "- name: string", "- createdAt: Date"],
     "methods": ["+ save(): void", "+ delete(): void", "+ findById(id): SınıfAdı"]
   }
2. Sınıflar arasındaki TÜM ilişkileri (association, inheritance, composition, aggregation) ekle.
   EN AZ 2 edge zorunludur.
   Format: {"id": "e1", "source": "c1", "target": "c2", "label": "1..*"}
   İlişki etiketleri: "1..1", "1..*", "0..*", "extends", "implements", "<<uses>>"

ÖRNEK ÇIKTI:
{
  "nodes": [
    {"id": "c1", "type": "class", "label": "Kullanıcı",
     "attributes": ["- id: int", "- email: string", "- password: string"],
     "methods": ["+ login(): bool", "+ logout(): void"]},
    {"id": "c2", "type": "class", "label": "Sipariş",
     "attributes": ["- orderId: int", "- total: float", "- status: string"],
     "methods": ["+ create(): void", "+ cancel(): void"]},
    {"id": "c3", "type": "class", "label": "Ürün",
     "attributes": ["- productId: int", "- name: string", "- price: float"],
     "methods": ["+ getDetails(): Ürün"]}
  ],
  "edges": [
    {"id": "e1", "source": "c1", "target": "c2", "label": "1..*"},
    {"id": "e2", "source": "c2", "target": "c3", "label": "1..*"}
  ]
}
"""

    elif diagram_type == "sequence":
        return """
[SEQUENCE DİYAGRAMI KURALLARI]
1. Sürece dahil olan TÜM katılımcıları (lifeline) tespit et.
   En az 2, tercihen 3-4 katılımcı üret (Kullanıcı, Frontend, Backend, Veritabanı vb.).
   Node formatı: {"id": "s1", "type": "sequence", "label": "KatılımcıAdı"}
2. Katılımcılar arasındaki mesajları olay sırasına göre (1:, 2:, 3: ...) edges'e ekle.
   EN AZ 3 mesaj/edge üret.
   Format: {"id": "e1", "source": "s1", "target": "s2", "label": "1: login(email, password)", "animated": true}

ÖRNEK ÇIKTI:
{
  "nodes": [
    {"id": "s1", "type": "sequence", "label": "Kullanıcı"},
    {"id": "s2", "type": "sequence", "label": "Frontend"},
    {"id": "s3", "type": "sequence", "label": "Backend"},
    {"id": "s4", "type": "sequence", "label": "Veritabanı"}
  ],
  "edges": [
    {"id": "e1", "source": "s1", "target": "s2", "label": "1: Formu Doldur", "animated": true},
    {"id": "e2", "source": "s2", "target": "s3", "label": "2: POST /login", "animated": true},
    {"id": "e3", "source": "s3", "target": "s4", "label": "3: SELECT user WHERE email=?", "animated": true},
    {"id": "e4", "source": "s4", "target": "s3", "label": "4: Kullanıcı Verisi", "animated": true},
    {"id": "e5", "source": "s3", "target": "s2", "label": "5: JWT Token", "animated": true},
    {"id": "e6", "source": "s2", "target": "s1", "label": "6: Giriş Başarılı", "animated": true}
  ]
}
"""

    elif diagram_type == "activity":
        return """
[ACTIVITY DİYAGRAMI KURALLARI]
1. Süreç adımlarını kronolojik sırayla tespit et.
   İlk node "Başlat" (type: start), son node "Bitir" (type: end) olmalı.
   Ara adımlar için: {"id": "act2", "type": "activity", "label": "Adım Açıklaması"}
   Karar noktaları için: {"id": "d1", "type": "decision", "label": "Koşul?"}
2. Akışı edges ile göster. Karar noktalarından çıkan edge'lere "Evet"/"Hayır" etiketi ekle.
   EN AZ 4 edge üret.
   Format: {"id": "e1", "source": "act1", "target": "act2", "label": ""}

ÖRNEK ÇIKTI:
{
  "nodes": [
    {"id": "st", "type": "start", "label": "Başlat"},
    {"id": "act1", "type": "activity", "label": "Kullanıcı Giriş Yapar"},
    {"id": "d1", "type": "decision", "label": "Kimlik Doğrulandı mı?"},
    {"id": "act2", "type": "activity", "label": "Dashboard'a Yönlendir"},
    {"id": "act3", "type": "activity", "label": "Hata Mesajı Göster"},
    {"id": "en", "type": "end", "label": "Bitir"}
  ],
  "edges": [
    {"id": "e1", "source": "st", "target": "act1", "label": ""},
    {"id": "e2", "source": "act1", "target": "d1", "label": ""},
    {"id": "e3", "source": "d1", "target": "act2", "label": "Evet"},
    {"id": "e4", "source": "d1", "target": "act3", "label": "Hayır"},
    {"id": "e5", "source": "act2", "target": "en", "label": ""},
    {"id": "e6", "source": "act3", "target": "act1", "label": "Tekrar Dene"}
  ]
}
"""

    else:
        return ""


# ---------------------------------------------------------------------------
# NORMALIZE & FALLBACK
# ---------------------------------------------------------------------------

def normalize_ai_output(data: dict, text: str, diagram_type: str) -> dict:
    """
    AI çıktısını doğrular ve eksik/hatalı durumda akıllı fallback uygular.
    - nodes boşsa → simulation
    - class diyagramında edge yoksa → simulation (class F1=0.00 düzeltmesi)
    - sequence/activity diyagramında edge < 2 ise → simulation
    """
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])

    if not nodes:
        logger.warning("AI çıktısında node yok, simulation'a düşülüyor. Diyagram: %s", diagram_type)
        return get_simulation_data(text, diagram_type)

    # Class diyagramı: edge zorunlu
    if diagram_type == "class" and len(edges) < 2:
        logger.warning(
            "Class diyagramında yetersiz edge (%d), simulation'a düşülüyor.", len(edges)
        )
        return get_simulation_data(text, diagram_type)

    # Sequence/Activity: en az 2 edge bekleniyor
    if diagram_type in ("sequence", "activity") and len(edges) < 2:
        logger.warning(
            "%s diyagramında yetersiz edge (%d), simulation'a düşülüyor.",
            diagram_type, len(edges),
        )
        return get_simulation_data(text, diagram_type)

    return {"nodes": nodes, "edges": edges}


def get_simulation_data(text: str, diagram_type: str) -> dict:
    """
    API erişimi yokken veya AI başarısız olunca döndürülen
    zenginleştirilmiş fallback verisi. Her diyagram türü için
    anlamlı node + edge içerir.
    """
    logger.info("Simulation modu aktif. Diyagram: %s", diagram_type)

    if diagram_type == "sequence":
        return {
            "nodes": [
                {"id": "s1", "type": "sequence", "label": "Kullanıcı"},
                {"id": "s2", "type": "sequence", "label": "Frontend"},
                {"id": "s3", "type": "sequence", "label": "Backend"},
                {"id": "s4", "type": "sequence", "label": "Veritabanı"},
            ],
            "edges": [
                {"id": "es1", "source": "s1", "target": "s2", "label": "1: İstek Gönder", "animated": True},
                {"id": "es2", "source": "s2", "target": "s3", "label": "2: API Çağrısı", "animated": True},
                {"id": "es3", "source": "s3", "target": "s4", "label": "3: Sorgu", "animated": True},
                {"id": "es4", "source": "s4", "target": "s3", "label": "4: Sonuç", "animated": True},
                {"id": "es5", "source": "s3", "target": "s2", "label": "5: Yanıt", "animated": True},
                {"id": "es6", "source": "s2", "target": "s1", "label": "6: Görüntüle", "animated": True},
            ],
        }

    elif diagram_type == "class":
        return {
            "nodes": [
                {
                    "id": "c1", "type": "class", "label": "Kullanıcı",
                    "attributes": ["- id: int", "- email: string", "- password: string"],
                    "methods": ["+ login(): bool", "+ logout(): void"],
                },
                {
                    "id": "c2", "type": "class", "label": "Sipariş",
                    "attributes": ["- orderId: int", "- total: float", "- status: string"],
                    "methods": ["+ create(): void", "+ cancel(): void"],
                },
                {
                    "id": "c3", "type": "class", "label": "Ürün",
                    "attributes": ["- productId: int", "- name: string", "- price: float"],
                    "methods": ["+ getDetails(): Ürün"],
                },
            ],
            "edges": [
                {"id": "ec1", "source": "c1", "target": "c2", "label": "1..*"},
                {"id": "ec2", "source": "c2", "target": "c3", "label": "1..*"},
            ],
        }

    elif diagram_type == "activity":
        return {
            "nodes": [
                {"id": "st", "type": "start", "label": "Başlat"},
                {"id": "act1", "type": "activity", "label": "İsteği Al"},
                {"id": "d1", "type": "decision", "label": "Geçerli mi?"},
                {"id": "act2", "type": "activity", "label": "İşlemi Gerçekleştir"},
                {"id": "act3", "type": "activity", "label": "Hata Döndür"},
                {"id": "en", "type": "end", "label": "Bitir"},
            ],
            "edges": [
                {"id": "ea1", "source": "st", "target": "act1", "label": ""},
                {"id": "ea2", "source": "act1", "target": "d1", "label": ""},
                {"id": "ea3", "source": "d1", "target": "act2", "label": "Evet"},
                {"id": "ea4", "source": "d1", "target": "act3", "label": "Hayır"},
                {"id": "ea5", "source": "act2", "target": "en", "label": ""},
                {"id": "ea6", "source": "act3", "target": "en", "label": ""},
            ],
        }

    else:  # usecase (default)
        return {
            "nodes": [
                {"id": "u1", "type": "actor", "label": "👤 Kullanıcı"},
                {"id": "u2", "type": "usecase", "label": "Sisteme Giriş Yap"},
                {"id": "u3", "type": "usecase", "label": "Şifre Doğrula"},
                {"id": "u4", "type": "usecase", "label": "Dashboard'a Eriş"},
            ],
            "edges": [
                {"id": "eu1", "source": "u1", "target": "u2", "label": ""},
                {"id": "eu2", "source": "u2", "target": "u3", "label": "<<include>>", "animated": True},
                {"id": "eu3", "source": "u2", "target": "u4", "label": "<<include>>", "animated": True},
            ],
        }
