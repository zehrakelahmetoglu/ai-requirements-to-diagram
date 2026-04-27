// services/api.js
// Backend ile iletişimi merkezi olarak yöneten servis katmanı.
// Geliştirme ortamında Vite proxy üzerinden /api prefix'i ile gider (CORS yok).
// Üretimde VITE_API_URL env değişkeni kullanılır.

const BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL          // Üretim: doğrudan backend URL'i
  : '/api';                                // Geliştirme: Vite proxy (/api → :8000)

/**
 * Gereksinim metnini ve diyagram tipini backend'e gönderir.
 * @param {string} text        - Kullanıcı tarafından girilen gereksinim metni
 * @param {string} diagramType - 'class' | 'usecase' | 'activity' | 'sequence'
 * @returns {Promise<object>}  - Backend'den dönen ham JSON yanıtı
 * @throws {Error}             - HTTP hatası veya ağ/CORS hatası durumunda fırlatılır
 */
export async function analyzeRequirements(text, diagramType) {
  let response;
  try {
    response = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, diagramType }),
    });
  } catch (networkErr) {
    // Ağ hatası veya backend kapalı
    throw new Error(
      'Backend\'e bağlanılamadı. Lütfen backend\'in çalıştığından emin olun (port 8000).'
    );
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Sunucu hatası: ${response.status}`);
  }

  return response.json();
}
