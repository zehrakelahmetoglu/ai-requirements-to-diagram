print("AI-UML Backend Hazırlanıyor...")
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"durum": "Sistem Calisiyor", "proje": "AI-Powered Diagram Generator"}