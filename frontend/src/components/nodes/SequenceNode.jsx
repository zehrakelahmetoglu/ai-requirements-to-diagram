// components/nodes/SequenceNode.jsx
// UML Sıralama Diyagramı — Yaşam Çizgisi (Lifeline) düğümü.
// Üstte katılımcı kutusu, altında kesik dikey çizgi.
// Node seçilince NodeToolbar ile silme butonu belirir.

import { Handle, Position, NodeToolbar, useReactFlow } from 'reactflow';

export default function SequenceNode({ id, data, selected }) {
  const { setNodes } = useReactFlow();

  const updateLabel = (value) =>
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: value } } : n))
    );

  const deleteNode = () =>
    setNodes((nds) => nds.filter((n) => n.id !== id));

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <button className="node-toolbar__delete" onClick={deleteNode} title="Düğümü sil">
          🗑️ Sil
        </button>
      </NodeToolbar>

      <div className={`sequence-node ${selected ? 'node--selected' : ''}`}>
        {/* Katılımcı kutusu */}
        <div className="sequence-node__box">
          <span className="sequence-node__badge">lifeline</span>
          <Handle type="target" position={Position.Left} />
          <input
            className="nodrag sequence-node__label"
            value={data.label}
            onChange={(e) => updateLabel(e.target.value)}
          />
          <Handle type="source" position={Position.Right} />
        </div>

        {/* Yaşam çizgisi */}
        <div className="sequence-node__lifeline" />

        <Handle type="source" position={Position.Bottom} id="bottom" />
      </div>
    </>
  );
}
