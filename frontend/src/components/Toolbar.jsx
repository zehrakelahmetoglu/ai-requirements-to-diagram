// components/Toolbar.jsx
// Canvas üzerinde yüzen araç çubuğu.
// - Geri Al: son işlemi geri alır (Ctrl+Z)
// - Temizle: tüm node ve edge'leri kaldırır
// - PNG / SVG / JSON İndir: diyagramı farklı formatlarda dışa aktarır

import { useReactFlow } from 'reactflow';
import { toPng, toSvg } from 'html-to-image';

/** React Flow viewport DOM elementini bulur. */
function getFlowElement() {
  return document.querySelector('.react-flow__viewport');
}

/** İndirme bağlantısı oluşturup tetikler. */
function downloadFile(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export default function Toolbar({ onClear, onUndo, canUndo }) {
  const { getNodes, getEdges } = useReactFlow();

  // ── PNG İndir ────────────────────────────────────────────────────────────
  const handleExportPNG = async () => {
    const el = getFlowElement();
    if (!el) return;
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: '#0f172a',
        pixelRatio: 2,
        filter: (node) => !(node?.classList?.contains('react-flow__minimap')
                        || node?.classList?.contains('react-flow__controls')),
      });
      downloadFile(dataUrl, `diagram_${Date.now()}.png`);
    } catch (err) {
      console.error('PNG export hatası:', err);
    }
  };

  // ── SVG İndir ────────────────────────────────────────────────────────────
  const handleExportSVG = async () => {
    const el = getFlowElement();
    if (!el) return;
    try {
      const dataUrl = await toSvg(el, {
        backgroundColor: '#0f172a',
        filter: (node) => !(node?.classList?.contains('react-flow__minimap')
                        || node?.classList?.contains('react-flow__controls')),
      });
      downloadFile(dataUrl, `diagram_${Date.now()}.svg`);
    } catch (err) {
      console.error('SVG export hatası:', err);
    }
  };

  // ── JSON İndir ───────────────────────────────────────────────────────────
  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      nodes: getNodes(),
      edges: getEdges(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    downloadFile(url, `diagram_${Date.now()}.json`);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="toolbar">
      <button
        id="undo-btn"
        className="toolbar__btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="Geri al (Ctrl+Z)"
      >
        ↩️ Geri Al
      </button>
      <button
        id="clear-canvas-btn"
        className="toolbar__btn"
        onClick={onClear}
        title="Canvas'ı temizle"
      >
        🗑️ Temizle
      </button>

      <span className="toolbar__separator" />

      <button
        id="export-png-btn"
        className="toolbar__btn"
        onClick={handleExportPNG}
        title="Diyagramı PNG olarak indir"
      >
        🖼️ PNG
      </button>
      <button
        id="export-svg-btn"
        className="toolbar__btn"
        onClick={handleExportSVG}
        title="Diyagramı SVG olarak indir"
      >
        📐 SVG
      </button>
      <button
        id="export-json-btn"
        className="toolbar__btn"
        onClick={handleExportJSON}
        title="Diyagramı JSON olarak indir"
      >
        📥 JSON
      </button>
    </div>
  );
}
