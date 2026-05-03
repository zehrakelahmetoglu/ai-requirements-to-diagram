print("AI-UML Backend Hazırlanıyor...")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

# AI servislerini içe aktarıyoruz
from ai_service import analyze_with_ai, validate_requirement

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
    diagramType: str = "usecase"

@app.get("/")
def read_root():
    return {"durum": "Sistem Calisiyor - Hafta 3 (Entegrasyon) Basladi - AI Bağlandı"}

@app.post("/analyze")
def analyze_text(req: Requirement):
    print(f"Frontend'den Gelen Metin: {req.text}, Tip: {req.diagramType}")
    
    # 1. KALİTE VE EPIC KONTROLÜ (GÖREV 3 & 4)
    # Gelen metin mantıklı bir User Story mi yoksa Epic mi? Yoksa saçma bir metin mi?
    validation = validate_requirement(req.text)
    
    # Eğer is_valid False ise veya puanı çok düşükse reddet!
    if not validation.get("is_valid", True) or validation.get("quality_score", 10) < 5:
        hata_mesaji = (
            f"❌ Metin Kalite Kontrolünden Geçemedi!\n\n"
            f"Tür: {validation.get('type')}\n"
            f"Puan: {validation.get('quality_score')}/10\n"
            f"Uzman Geri Bildirimi: {validation.get('feedback')}"
        )
        raise HTTPException(status_code=400, detail=hata_mesaji)
        
    # Eğer geçerli bir metinse veya Epic ise devam et (GÖREV 1, 2, 5)
    analiz = analyze_with_ai(req.text, req.diagramType)
    
    # Analiz sonucuna metadata olarak AI'ın kalite raporunu da gömelim
    analiz["metadata"] = validation
    
    return analiz

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)