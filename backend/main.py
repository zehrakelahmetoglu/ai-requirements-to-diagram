print("AI-UML Backend Hazırlanıyor...")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # CORS için gerekli
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# --- 1. CORS AYARI (Frontend ile bağlantı kurabilmek için ŞART) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React'in (localhost:5173) sana ulaşmasına izin verir
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Requirement(BaseModel):
    text: str

# --- 2. ARKADAŞININ İSTEDİĞİ FORMAT (Nodes ve Edges) ---
def ai_analiz_motoru(metin: str):
    # Arkadaşın "Zehra bana {nodes, edges} döndür" dediği kısım tam olarak burası.
    # Şimdilik örnek bir yapı döndürüyoruz, ilerde buraya gerçek AI kodunu koyacaksın.
    return {
        "nodes": [
            {
                "id": "1", 
                "type": "input", 
                "data": {"label": "Aktör: Kullanıcı"}, 
                "position": {"x": 250, "y": 0}
            },
            {
                "id": "2", 
                "data": {"label": f"Aksiyon: {metin}"}, 
                "position": {"x": 250, "y": 150}
            }
        ],
        "edges": [
            {
                "id": "e1-2", 
                "source": "1", 
                "target": "2", 
                "animated": True # Çizgi hareketli olsun, güzel görünür
            }
        ]
    }

@app.get("/")
def read_root():
    return {"durum": "Sistem Calisiyor - CORS ve Format Hazır!"}

@app.post("/analyze")
def analyze_text(req: Requirement):
    print(f"Frontend'den Gelen Metin: {req.text}")
    
    # Arkadaşının tam istediği formatta cevabı hazırlıyoruz
    sonuc = ai_analiz_motoru(req.text)
    
    return {
        "mesaj": "Analiz tamamlandı",
        "analiz_sonucu": sonuc
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)