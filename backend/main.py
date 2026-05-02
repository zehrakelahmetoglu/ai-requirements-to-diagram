print("AI-UML Backend Hazırlanıyor...")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

# AI servisimizi içe aktarıyoruz
from ai_service import analyze_with_ai

# .env dosyasındaki çevresel değişkenleri yükle (Örn: GEMINI_API_KEY)
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Requirement(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"durum": "Sistem Calisiyor - Hafta 3 (Entegrasyon) Basladi - AI Bağlandı"}

@app.post("/analyze")
def analyze_text(req: Requirement):
    print(f"Frontend'den Gelen Metin: {req.text}")
    # Gerçek AI motorunu burada çağırıyoruz
    analiz = analyze_with_ai(req.text)
    
    return {
        "mesaj": "Metin AI tarafından başarıyla analiz edildi (Hafta 3)",
        "analiz_sonucu": analiz
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)