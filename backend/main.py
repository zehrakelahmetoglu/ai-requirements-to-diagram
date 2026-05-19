print("AI-UML Backend Hazırlanıyor...")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel
import uvicorn
from ai_service import analyze_with_ai  # Gerçek AI motorunu içeri alıyoruz

app = FastAPI()

# --- 1. CORS AYARI (Frontend ile bağlantı kurabilmek için) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React'in (localhost:5173) sana ulaşmasına izin verir
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Requirement(BaseModel):
    text: str

# --- 2. FRONTEND'İN İSTEDİĞİ FORMAT (Nodes ve Edges) ---
def ai_analiz_motoru(metin: str):
    
    # Şimdilik örnek bir yapı döndürüyoruz, ilerde buraya gerçek AI kodunu koyulacak
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
async def analyze_text(req: Requirement):
    print(f"Frontend'den Gelen Metin: {req.text}")
    
   
    sonuc = await analyze_with_ai(req.text)
    
    return sonuc

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)