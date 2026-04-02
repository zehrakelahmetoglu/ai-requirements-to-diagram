print("AI-UML Backend Hazırlanıyor...")

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Requirement(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"durum": "Sistem Calisiyor - Hafta 2 Basladi"}


@app.post("/analyze")
def analyze_text(req: Requirement):
   
    return {
        "mesaj": "Metin başarıyla alındı",
        "analiz_sonucu": {
            "aktorler": ["Kullanici", "Sistem"], 
            "aksiyonlar": ["Giriş yapmak", "Veri göndermek"],
            "gelen_metin": req.text
        }
    }