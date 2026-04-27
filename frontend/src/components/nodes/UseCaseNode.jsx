// components/nodes/UseCaseNode.jsx
// UML Use Case diyagramı düğümü.
// Aktörler dikdörtgen, use case'ler elips/pill olarak gösterilir.
// Node seçilince NodeToolbar ile silme butonu belirir.

import { useReactFlow, Handle, Position, NodeToolbar } from 'reactflow';

export default function UseCaseNode({ id, data, selected }) {
  const { setNodes } = useReactFlow();

  const updateLabel = (value) =>
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: value } } : n))
    );

  const deleteNode = () =>
    setNodes((nds) => nds.filter((n) => n.id !== id));

  const isActor = data.isActor || data.label?.includes('👤');

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <button className="node-toolbar__delete" onClick={deleteNode} title="Düğümü sil">
          🗑️ Sil
        </button>
      </NodeToolbar>

      <div className={`usecase-node ${isActor ? 'usecase-node--actor' : 'usecase-node--case'} ${selected ? 'node--selected' : ''}`}>
        {/* Tip etiketi */}
        <span className="usecase-node__badge">{isActor ? 'actor' : 'use case'}</span>
        <Handle type="target" position={Position.Top} />
        <input
          className="nodrag usecase-node__input"
          value={data.label}
          onChange={(e) => updateLabel(e.target.value)}
        />
        <Handle type="source" position={Position.Bottom} />
      </div>
    </>
  );
}
