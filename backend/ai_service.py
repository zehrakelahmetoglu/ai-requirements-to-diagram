import os
import json
import re
import random
from google import genai
from google.genai import types

def get_random_examples_from_dataset(num_examples=3):
    """
    Kaliteyi artırmak için projedeki 'dataset' klasöründen rastgele User Story'leri
    'Few-Shot Prompting' (Örnekle Öğrenme) için çeker.
    Bu, yapay zekanın endüstri standartlarında çıktı üretmesini sağlar.
    """
    dataset_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dataset")
    if not os.path.exists(dataset_dir):
        return ""
    
    try:
        files = [f for f in os.listdir(dataset_dir) if f.endswith(".txt")]
        if not files:
            return ""
            
        examples = []
        for _ in range(num_examples):
            file = random.choice(files)
            with open(os.path.join(dataset_dir, file), "r", encoding="utf-8") as f:
                lines = [line.strip() for line in f.readlines() if line.strip() and len(line) > 20]
                if lines:
                    examples.append(random.choice(lines))
        
        if examples:
            return "\n".join([f"- {ex}" for ex in examples])
    except:
        pass
    return ""


def validate_requirement(text: str) -> dict:
    """
    [GÖREV 3 & 4]: Epic / User Story ayrımını yapar ve metnin kalitesini ölçer.
    Anlaşılmaz veya eksik yazılmış metinleri tespit eder.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"is_valid": True, "type": "User Story", "quality_score": 10, "feedback": "Simülasyon - API Key yok"}

    try:
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
        Sen uzman bir Scrum Master ve Gereksinim Analistisin. Sana verilen metni değerlendir.
        
        GELEN METİN: "{text}"
        
        Lütfen metni analiz et ve aşağıdaki JSON formatında kesin ve adil bir değerlendirme yap:
        {{
            "is_valid": true/false,
            "type": "Epic" veya "User Story" veya "Geçersiz",
            "quality_score": 1 ile 10 arası puan,
            "feedback": "Kullanıcıya yapıcı geri bildirim (Eğer eksikse neyi eksik, Epic ise nasıl bölünmeli)"
        }}
        
        Değerlendirme Kriterleri:
        - Çok kısa, belirsiz veya anlamsız (örn: 'sisteme gir', 'buton yap', 'çalışsın') metinler için "is_valid": false yap ve puanı 4'ün altında ver.
        - Sadece bir rolün aksiyonunu değil, sistem çapında büyük bir işi anlatıyorsa "Epic" olarak işaretle.
        - "As a [role], I want to [action], so that [benefit]" yapısına benzeyen, net bir Aktör ve Aksiyon barındıran metinlere 8 ve üzeri yüksek puan ver.
        """
        
        for model_name in ("gemini-1.5-pro", "gemini-1.5-flash"):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json")
                )
                return parse_ai_response(response)
            except:
                continue
                
        return {"is_valid": True, "type": "Bilinmiyor", "quality_score": 5, "feedback": "Analiz edilemedi"}
    except:
        return {"is_valid": True, "type": "Bilinmiyor", "quality_score": 5, "feedback": "Hata oluştu"}


def analyze_with_ai(text: str, diagram_type: str = "usecase") -> dict:
    """
    [GÖREV 1, 2, 5]: Epic/User Story metnini analiz ederek aktör ve aksiyonları çıkarır.
    Diyagram tipine göre React Flow uyumlu nodes ve edges JSON'u döndürür.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Uyarı: GEMINI_API_KEY bulunamadı. Simülasyon modunda çalışılıyor.")
        return get_simulation_data(text, diagram_type)

    try:
        client = genai.Client(api_key=api_key)
        
        # Sektörel örnekleri (Dataset) yapay zekaya referans olarak veriyoruz (Few-Shot)
        golden_examples = get_random_examples_from_dataset(3)
        
        prompt = f"""
        [GÖREV]
        Sen deneyimli bir Yazılım Mimarı ve İş Analistisin. 
        Sana verilen kullanıcı hikayesini (User Story) veya Epic metnini derinlemesine analiz et.
        Kullanıcının talep ettiği diyagram türü: {diagram_type}

        [SEKTÖREL VERİ SETİNDEN ÖRNEK GEREKSİNİMLER (Referans Al!)]
        {golden_examples}

        [ANALİZ EDİLECEK METİN]
        "{text}"

        [İSTENEN ÇIKTI FORMATI]
        Çıktını KESİNLİKLE aşağıdaki yapıda bir JSON olarak vermelisin. Başka hiçbir açıklama metni ekleme.
        {{
            "nodes": [],
            "edges": []
        }}

        [KURALLAR - DİYAGRAM TİPİNE GÖRE]
        Eğer diyagram türü 'usecase' ise:
        1. Sistemdeki aktörleri (Kullanıcı, Sistem, Admin vb.) bul ve node olarak ekle. Node formatı: {{"id": "id", "type": "actor", "label": "👤 Aktör Adı"}}
        2. Aksiyonları bul ve node olarak ekle. Node formatı: {{"id": "id", "type": "usecase", "label": "Aksiyon Adı"}}
        3. Aktörlerle aksiyonlar arasındaki ilişkileri edges içine ekle. Format: {{"id": "e1", "source": "actor_id", "target": "action_id", "label": ""}}
        4. ÖNEMLİ: Aksiyonlar arasında birbirini kapsama veya genişletme durumu varsa kesinlikle '<<include>>' ve '<<extend>>' ilişkilerini tespit et ve label olarak ekle. Format: {{"id": "e2", "source": "action1_id", "target": "action2_id", "label": "<<include>>", "animated": true}}

        Eğer diyagram türü 'class' ise:
        1. Sınıfları (nesneleri) bul. Node formatı: {{"id": "id", "type": "class", "label": "SınıfAdı", "attributes": ["- id: int", "- name: string"], "methods": ["+ save()", "+ delete()"]}}
        2. Sınıflar arası ilişkileri edges içine ekle. Format: {{"id": "e1", "source": "class1_id", "target": "class2_id", "label": "1..*"}}

        Eğer diyagram türü 'sequence' ise:
        1. Sürece dahil olan katılımcıları (lifeline) bul. Node formatı: {{"id": "id", "type": "sequence", "label": "Katılımcı Adı"}}
        2. Katılımcılar arası gönderilen mesajları olay sırasına göre edges içine ekle. Format: {{"id": "e1", "source": "gonderen_id", "target": "alan_id", "label": "1: mesajIsmi()", "animated": true}}

        Eğer diyagram türü 'activity' ise:
        1. Süreç adımlarını bul. Node formatı: {{"id": "id", "type": "activity", "label": "Adım Adı"}}
        2. Akışı edges içine ekle.
        """

        for model_name in ("gemini-2.5-pro", "gemini-2.5-flash"):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json"),
                )
                parsed = parse_ai_response(response)
                return normalize_ai_output(parsed, text, diagram_type)
            except Exception as model_error:
                continue

        return get_simulation_data(text, diagram_type)
        
    except Exception as e:
        print(f"Yapay zeka analiz işlemi sırasında bir hata oluştu: {e}")
        return get_simulation_data(text, diagram_type)


def get_simulation_data(text: str, diagram_type: str) -> dict:
    if diagram_type == "sequence":
        return {
            "nodes": [
                {"id": "s1", "type": "sequence", "label": "Kullanıcı"},
                {"id": "s2", "type": "sequence", "label": "Sistem"}
            ],
            "edges": [
                {"id": "es1", "source": "s1", "target": "s2", "label": "1: işlemYap()", "animated": True}
            ]
        }
    elif diagram_type == "class":
        return {
            "nodes": [
                {"id": "c1", "type": "class", "label": "Kullanıcı", "attributes": ["- id: int"], "methods": ["+ login()"]}
            ],
            "edges": []
        }
    else: 
        return {
            "nodes": [
                {"id": "u1", "type": "actor", "label": "👤 Kullanıcı"},
                {"id": "u2", "type": "usecase", "label": "Giriş Yap"},
                {"id": "u3", "type": "usecase", "label": "Şifre Doğrula"}
            ],
            "edges": [
                {"id": "eu1", "source": "u1", "target": "u2"},
                {"id": "eu2", "source": "u2", "target": "u3", "label": "<<include>>", "animated": True}
            ]
        }


def parse_ai_response(response) -> dict:
    raw_text = (getattr(response, "text", "") or "").strip()
    if not raw_text:
        raise ValueError("AI cevabi bos geldi.")
    cleaned = re.sub(r"^```json\s*|\s*```$", "", raw_text, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"^```\s*|\s*```$", "", cleaned).strip()
    return json.loads(cleaned)


def normalize_ai_output(data: dict, text: str, diagram_type: str) -> dict:
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    if not nodes:
        return get_simulation_data(text, diagram_type)
    return {
        "nodes": nodes,
        "edges": edges,
    }
