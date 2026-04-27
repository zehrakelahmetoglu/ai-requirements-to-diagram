// components/Toolbar.jsx
// Canvas üzerinde yüzen araç çubuğu.
// - Temizle: tüm node ve edge'leri kaldırır
// - JSON İndir: mevcut diyagram durumunu .json olarak dışa aktarır
//   (PNG export için html2canvas gibi bir kütüphane gerekir — TODO)

import { useReactFlow } from 'reactflow';

export default function Toolbar({ onClear }) {
  const { getNodes, getEdges } = useReactFlow();

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
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `diagram_${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="toolbar">
      <button
        id="clear-canvas-btn"
        className="toolbar__btn"
        onClick={onClear}
        title="Canvas'ı temizle"
      >
        🗑️ Temizle
      </button>
      <button
        id="export-json-btn"
        className="toolbar__btn"
        onClick={handleExportJSON}
        title="Diyagramı JSON olarak indir"
      >
        📥 JSON İndir
      </button>
    </div>
  );
}
