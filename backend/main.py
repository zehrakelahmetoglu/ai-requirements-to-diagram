print("AI-UML Backend Hazırlanıyor...")

from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn # Sağ üstteki butonla çalıştırmak için lazım

app = FastAPI()

class Requirement(BaseModel):
    text: str

# --- HAFTA 3: AI ENTEGRASYON ALANI ---
# Burası AI sorumlusu arkadaşının yazacağı fonksiyona bağlanacak
def ai_analiz_motoru(metin: str):
    # Şimdilik simülasyon yapıyoruz. 
    # Arkadaşın kodu verince bu kısım gerçek yapay zeka olacak.
    return {
        "uml_kodu": f"@startuml\nUser -> System: {metin}\n@enduml",
        "tespit_edilen_aktörler": ["Kullanıcı"],
        "tespit_edilen_aksiyonlar": ["Analiz Talebi"]
    }
# -------------------------------------

@app.get("/")
def read_root():
    return {"durum": "Sistem Calisiyor - Hafta 3 (Entegrasyon) Basladi"}

@app.post("/analyze")
def analyze_text(req: Requirement):
    # AI motorunu burada çağırıyoruz
    analiz = ai_analiz_motoru(req.text)
    
    return {
        "mesaj": "Metin başarıyla analiz edildi (Hafta 3)",
        "analiz_sonucu": analiz
    }

# Sağ üstteki "Run" butonuna basınca çalışması için:
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)