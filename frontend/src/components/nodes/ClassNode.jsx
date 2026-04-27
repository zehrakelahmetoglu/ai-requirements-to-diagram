// components/nodes/ClassNode.jsx
// UML Sınıf Diyagramı düğümü.
// Sınıf adı, özellikler (attributes) ve metotlar (methods) satır içi düzenlenebilir.
// Node seçilince üzerinde NodeToolbar (silme butonu) belirir.

import { useReactFlow, Handle, Position, NodeToolbar } from 'reactflow';

const inputStyle = {
  width: '100%',
  border: 'none',
  background: 'transparent',
  outline: 'none',
  fontSize: '12px',
  fontFamily: 'monospace',
};

export default function ClassNode({ id, data, selected }) {
  const { setNodes } = useReactFlow();

  const update = (patch) =>
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))
    );

  const deleteNode = () =>
    setNodes((nds) => nds.filter((n) => n.id !== id));

  const updateItem = (field, index, value) => {
    const list = [...data[field]];
    list[index] = value;
    update({ [field]: list });
  };

  const removeItem = (field, index) =>
    update({ [field]: data[field].filter((_, i) => i !== index) });

  const addItem = (field) => {
    const placeholder = field === 'attributes' ? '- yeniDegisken: tip' : '+ yeniMetot()';
    update({ [field]: [...(data[field] ?? []), placeholder] });
  };

  return (
    <>
      {/* Silme araç çubuğu — sadece seçili olduğunda görünür */}
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <button className="node-toolbar__delete" onClick={deleteNode} title="Düğümü sil">
          🗑️ Sil
        </button>
      </NodeToolbar>

      <div className={`class-node ${selected ? 'class-node--selected' : ''}`}>
        <Handle type="target" position={Position.Top} />

        {/* Başlık */}
        <div className="class-node__header">
          <span className="class-node__type-badge">class</span>
          <input
            className="nodrag"
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
            style={{ ...inputStyle, color: 'white', textAlign: 'center', fontWeight: 'bold' }}
          />
        </div>

        {/* Özellikler */}
        <div className="class-node__section">
          {data.attributes?.map((attr, i) => (
            <div key={i} className="class-node__row">
              <input
                className="nodrag"
                value={attr}
                onChange={(e) => updateItem('attributes', i, e.target.value)}
                style={inputStyle}
              />
              <button className="nodrag class-node__remove" onClick={() => removeItem('attributes', i)}>
                ×
              </button>
            </div>
          ))}
          <button className="nodrag class-node__add" onClick={() => addItem('attributes')}>
            + Özellik Ekle
          </button>
        </div>

        {/* Metotlar */}
        <div className="class-node__section">
          {data.methods?.map((method, i) => (
            <div key={i} className="class-node__row">
              <input
                className="nodrag"
                value={method}
                onChange={(e) => updateItem('methods', i, e.target.value)}
                style={inputStyle}
              />
              <button className="nodrag class-node__remove" onClick={() => removeItem('methods', i)}>
                ×
              </button>
            </div>
          ))}
          <button className="nodrag class-node__add" onClick={() => addItem('methods')}>
            + Metot Ekle
          </button>
        </div>

        <Handle type="source" position={Position.Bottom} />
      </div>
    </>
  );
}
