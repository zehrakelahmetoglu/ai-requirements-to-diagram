// Sayfa yüklendiğinde Mermaid ayarlarını yapıyoruz
document.addEventListener("DOMContentLoaded", function() {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
});

document.getElementById('generateBtn').addEventListener('click', async function() {
    const inputField = document.getElementById('storyInput').value.trim();
    const diagramContainer = document.getElementById('diagramContainer');

    // Metin kutusu boş mu kontrolü
    if (inputField === "") {
        alert("Lütfen analiz edilecek bir metin girin!");
        return;
    }

    // Kullanıcıya işlem yapıldığını gösteriyoruz
    diagramContainer.innerHTML = '<p class="placeholder-text" style="color:#e67e22; font-weight:bold;">AI Analiz Ediyor ve Çiziyor... Lütfen bekleyin.</p>';

    // HAFTA 2: Backend'e bağlanma hazırlığı (Şu an sunucu olmadığı için yoruma alındı)
    /*
    try {
        const response = await fetch('http://127.0.0.1:8000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: inputField })
        });
        const data = await response.json();
        const codeToRender = data.diagramCode;
    } catch (error) { ... }
    */

    // HAFTA 3: Backend gelene kadar sistemi kandırmak için hazırlanan sabit (Mock) verimiz.
    // Yapay zekadan gelecek olan Sınıf Diyagramı (Class Diagram) kodu tam olarak buna benzeyecek.
    const mockUmlCode = `
classDiagram
    class Musteri {
        +String ad
        +String email
        +sepeteEkle()
        +siparisVer()
    }
    class Sistem {
        +stokKontrolEt()
        +odemeAl()
    }
    Musteri --> Sistem : İstek Gönderir
    `;

    // Ufak bir bekleme süresi ekleyerek AI hissi veriyoruz (1.5 saniye)
    setTimeout(async () => {
        try {
            // Mermaid.js kullanarak gelen metni SVG grafiğine dönüştürüyoruz
            const { svg } = await mermaid.render('generatedDiagram', mockUmlCode);
            
            // Çizilen grafiği ekrana basıyoruz
            diagramContainer.innerHTML = svg;
        } catch (error) {
            console.error("Çizim Hatası:", error);
            diagramContainer.innerHTML = '<p style="color:red;">Diyagram çizilirken bir hata oluştu.</p>';
        }
    }, 1500);

});