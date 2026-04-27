// components/Sidebar.jsx
// Sol panel: gereksinim metni girişi, diyagram tipi seçimi,
// analiz butonu ve hata/loading durumları.

const DIAGRAM_OPTIONS = [
  { value: 'class',    label: '🗂️  Sınıf Diyagramı',    preview: '▭ Sınıf kutusu',     color: '#6366f1' },
  { value: 'usecase',  label: '👤 Use Case Diyagramı',  preview: '⬭ Elips / aktör',    color: '#059669' },
  { value: 'activity', label: '⚙️  Aktivite Diyagramı', preview: '▢ Eylem kutusu',     color: '#3b82f6' },
  { value: 'sequence', label: '🔄 Sıralama Diyagramı',  preview: '⬜ Yaşam çizgisi',   color: '#16a34a' },
];

export default function Sidebar({
  inputText,
  onInputChange,
  diagramType,
  onDiagramTypeChange,
  onAnalyze,
  onAddNode,
  loading,
  error,
  onClose,
}) {
  const canAnalyze = inputText.trim().length > 0 && !loading;
  const selectedOption = DIAGRAM_OPTIONS.find((o) => o.value === diagramType);

  return (
    <aside className="sidebar">
      {/* Logo / Başlık */}
      <div className="sidebar__brand">
        <span className="sidebar__logo">✦</span>
        <h1 className="sidebar__title">AI Diagram</h1>
        <button className="sidebar__close" onClick={onClose} aria-label="Paneli kapat">
          ✕
        </button>
      </div>

      {/* Gereksinim Metni */}
      <label className="sidebar__label" htmlFor="requirement-input">
        Gereksinim Metni
      </label>
      <textarea
        id="requirement-input"
        className="sidebar__textarea"
        placeholder="Kullanıcı hikayesini veya gereksinim metninizi buraya girin…"
        value={inputText}
        onChange={(e) => onInputChange(e.target.value)}
        rows={7}
      />

      {/* Diyagram Tipi */}
      <label className="sidebar__label" htmlFor="diagram-type-select">
        Diyagram Tipi
      </label>
      <select
        id="diagram-type-select"
        className="sidebar__select"
        value={diagramType}
        onChange={(e) => onDiagramTypeChange(e.target.value)}
      >
        {DIAGRAM_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Analiz Butonu */}
      <button
        id="analyze-btn"
        className={`sidebar__btn sidebar__btn--primary ${loading ? 'sidebar__btn--loading' : ''}`}
        onClick={onAnalyze}
        disabled={!canAnalyze}
        title={!inputText.trim() ? 'Lütfen önce bir metin girin' : ''}
      >
        {loading ? (
          <>
            <span className="spinner" />
            Analiz Ediliyor…
          </>
        ) : (
          '✦ AI ile Analiz Et'
        )}
      </button>

      {/* Hata Mesajı */}
      {error && (
        <div className="sidebar__error" role="alert">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Ayırıcı */}
      <div className="sidebar__divider" />

      {/* Manuel Düzenleme */}
      <p className="sidebar__section-label">Manuel Düzenleme</p>

      {/* Tip önizleme chip'i */}
      <div
        className="sidebar__node-preview"
        style={{ borderColor: selectedOption?.color, color: selectedOption?.color }}
      >
        <span className="sidebar__node-preview-icon">{selectedOption?.preview}</span>
        <span className="sidebar__node-preview-text">
          Eklenecek tip: <strong>{selectedOption?.label}</strong>
        </span>
      </div>

      <button
        id="add-node-btn"
        className="sidebar__btn sidebar__btn--secondary"
        onClick={onAddNode}
        style={{ borderColor: selectedOption?.color }}
      >
        + {selectedOption?.label?.split(' ').slice(1).join(' ')} Ekle
      </button>

      {/* Klavye ipucu */}
      <p className="sidebar__hint">
        💡 Düğümü seçip <kbd>Delete</kbd> tuşuna basarak veya üzerindeki <strong>🗑️ Sil</strong> butonuyla silebilirsiniz.
      </p>
    </aside>
  );
}
