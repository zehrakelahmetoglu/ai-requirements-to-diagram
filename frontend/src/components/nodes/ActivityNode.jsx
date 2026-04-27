// components/nodes/ActivityNode.jsx
// UML Aktivite Diyagramı düğümü.
// shape prop'una göre farklı görünüm alır:
//   'start'    → dolu daire (başlangıç)
//   'end'      → çift daire (bitiş)
//   'decision' → eşkenar dörtgen (karar)
//   'fork'/'join' → kalın yatay çubuk
//   diğer      → yuvarlak dikdörtgen (eylem)

import { Handle, Position, NodeToolbar, useReactFlow } from 'reactflow';

export default function ActivityNode({ id, data, selected }) {
  const { setNodes } = useReactFlow();
  const shape = data.shape ?? 'activity';

  const updateLabel = (value) =>
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: value } } : n))
    );

  const deleteNode = () =>
    setNodes((nds) => nds.filter((n) => n.id !== id));

  const toolbar = (
    <NodeToolbar isVisible={selected} position={Position.Top}>
      <button className="node-toolbar__delete" onClick={deleteNode} title="Düğümü sil">
        🗑️ Sil
      </button>
    </NodeToolbar>
  );

  // ── Başlangıç düğümü ────────────────────────────────────────────────────
  if (shape === 'start') {
    return (
      <>
        {toolbar}
        <div className={`activity-node activity-node--start ${selected ? 'node--selected-ring' : ''}`}>
          <Handle type="source" position={Position.Bottom} />
        </div>
      </>
    );
  }

  // ── Bitiş düğümü ────────────────────────────────────────────────────────
  if (shape === 'end') {
    return (
      <>
        {toolbar}
        <div className={`activity-node activity-node--end ${selected ? 'node--selected-ring' : ''}`}>
          <Handle type="target" position={Position.Top} />
          <div className="activity-node__end-inner" />
        </div>
      </>
    );
  }

  // ── Fork / Join çubuğu ──────────────────────────────────────────────────
  if (shape === 'fork' || shape === 'join') {
    return (
      <>
        {toolbar}
        <div className={`activity-node activity-node--fork ${selected ? 'node--selected-ring' : ''}`}>
          <Handle type="target" position={Position.Left} />
          <Handle type="source" position={Position.Right} />
        </div>
      </>
    );
  }

  // ── Karar (Diamond) ─────────────────────────────────────────────────────
  if (shape === 'decision') {
    return (
      <>
        {toolbar}
        <div className={`activity-node activity-node--decision ${selected ? 'node--selected-ring' : ''}`}>
          <Handle type="target" position={Position.Top} />
          <input
            className="nodrag activity-node__diamond-label"
            value={data.label}
            onChange={(e) => updateLabel(e.target.value)}
          />
          <Handle type="source" position={Position.Bottom} id="yes" />
          <Handle type="source" position={Position.Right} id="no" />
        </div>
      </>
    );
  }

  // ── Eylem (Action) — varsayılan ─────────────────────────────────────────
  return (
    <>
      {toolbar}
      <div className={`activity-node activity-node--action ${selected ? 'node--selected' : ''}`}>
        <span className="activity-node__badge">activity</span>
        <Handle type="target" position={Position.Top} />
        <input
          className="nodrag activity-node__label"
          value={data.label}
          onChange={(e) => updateLabel(e.target.value)}
        />
        <Handle type="source" position={Position.Bottom} />
      </div>
    </>
  );
}
