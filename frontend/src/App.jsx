import { useCallback, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

// ==========================================
// 1. ÖZEL DÜĞÜM: SINIF (CLASS) TASARIMI
// ==========================================
const ClassNode = ({ id, data }) => {
  const { setNodes } = useReactFlow();

  // Merkezi State'i güncelleyen yardımcı fonksiyon
  const updateNodeData = (newData) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...newData } } : node))
    );
  };

  const handleNameChange = (e) => updateNodeData({ name: e.target.value });

  const updateItem = (type, index, value) => {
    const list = [...data[type]];
    list[index] = value;
    updateNodeData({ [type]: list });
  };

  const removeItem = (type, index) => {
    const list = data[type].filter((_, i) => i !== index);
    updateNodeData({ [type]: list });
  };

  const addItem = (type) => {
    const newItem = type === 'attributes' ? "- yeniDegisken: tip" : "+ yeniMetot()";
    updateNodeData({ [type]: [...(data[type] || []), newItem] });
  };

  const inputStyle = { width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', fontFamily: 'monospace' };

  return (
    <div style={{ background: 'white', border: '2px solid #2c3e50', borderRadius: '8px', minWidth: '220px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
      <Handle type="target" position={Position.Top} />
      
      <div style={{ background: '#2c3e50', padding: '8px' }}>
        <input className="nodrag" value={data.name} onChange={handleNameChange} style={{ ...inputStyle, color: 'white', textAlign: 'center', fontWeight: 'bold' }} />
      </div>

      {/* ÖZELLİKLER */}
      <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
        {data.attributes?.map((attr, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <input className="nodrag" value={attr} onChange={(e) => updateItem('attributes', i, e.target.value)} style={inputStyle} />
            <button className="nodrag" onClick={() => removeItem('attributes', i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'red' }}>×</button>
          </div>
        ))}
        <button className="nodrag" onClick={() => addItem('attributes')} style={{ width: '100%', fontSize: '10px', marginTop: '5px' }}>+ Ekle</button>
      </div>

      {/* METOTLAR */}
      <div style={{ padding: '8px' }}>
        {data.methods?.map((method, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <input className="nodrag" value={method} onChange={(e) => updateItem('methods', i, e.target.value)} style={inputStyle} />
            <button className="nodrag" onClick={() => removeItem('methods', i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'red' }}>×</button>
          </div>
        ))}
        <button className="nodrag" onClick={() => addItem('methods')} style={{ width: '100%', fontSize: '10px', marginTop: '5px' }}>+ Ekle</button>
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

// ==========================================
// 2. ÖZEL DÜĞÜM: USE CASE (AKTÖR/ELİPS) TASARIMI
// ==========================================
const UseCaseNode = ({ id, data }) => {
  const { setNodes } = useReactFlow();
  const isActor = data.label.includes("👤");

  return (
    <div style={{ 
      background: isActor ? '#f8f9fa' : '#d5f5e3', 
      border: `2px solid ${isActor ? '#2c3e50' : '#27ae60'}`, 
      borderRadius: isActor ? '10px' : '50%', 
      padding: '15px 25px', 
      textAlign: 'center',
      minWidth: '120px'
    }}>
      <Handle type="target" position={Position.Top} />
      <input 
        className="nodrag" 
        value={data.label} 
        onChange={(e) => setNodes(nds => nds.map(n => n.id === id ? {...n, data: {...n.data, label: e.target.value}} : n))}
        style={{ border: 'none', background: 'transparent', outline: 'none', textAlign: 'center', width: '100%', fontWeight: 'bold' }} 
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = { customClass: ClassNode, customUseCase: UseCaseNode };

// ==========================================
// 3. ANA PANEL VE AKIŞ MANTIĞI
// ==========================================
function FlowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [userText, setUserText] = useState("");
  const [diagramType, setDiagramType] = useState("class");

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // MANUEL KUTU EKLEME ÖZELLİĞİ
  const addNewNode = () => {
    const id = `node_${Date.now()}`;
    const newNode = {
      id,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      type: diagramType === 'class' ? 'customClass' : 'customUseCase',
      data: diagramType === 'class' 
        ? { name: 'YeniSınıf', attributes: ['- id: int'], methods: ['+ islem()'] }
        : { label: 'Yeni İşlem' }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleAnalyze = () => {
    // AI Simülasyonu
    const aiNodes = diagramType === 'class' ? [
      { id: 'c1', type: 'customClass', position: { x: 100, y: 100 }, data: { name: 'Sistem', attributes: ['- status: bool'], methods: ['+ calistir()'] } }
    ] : [
      { id: 'u1', type: 'customUseCase', position: { x: 100, y: 100 }, data: { label: '👤 Kullanıcı' } }
    ];
    setNodes(aiNodes);
    setEdges([]);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <div style={{ width: '320px', background: '#2c3e50', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <h3>AI Tasarım Paneli</h3>
        <textarea placeholder="User story girin..." value={userText} onChange={e => setUserText(e.target.value)} style={{ padding: '10px', borderRadius: '5px', marginTop: '10px' }} />
        
        <select value={diagramType} onChange={e => setDiagramType(e.target.value)} style={{ padding: '10px', marginTop: '10px', borderRadius: '5px' }}>
          <option value="class">Sınıf Diyagramı</option>
          <option value="usecase">Use Case Diyagramı</option>
        </select>

        <button onClick={handleAnalyze} style={{ padding: '12px', marginTop: '15px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          AI İle Analiz Et
        </button>

        <div style={{ borderTop: '1px solid #444', marginTop: '20px', paddingTop: '20px' }}>
          <p style={{ fontSize: '12px', color: '#bdc3c7' }}>Manuel Düzenleme:</p>
          <button onClick={addNewNode} style={{ width: '100%', padding: '10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '5px' }}>
            + Yeni Kutu Ekle
          </button>
        </div>
      </div>

      <div style={{ flexGrow: 1 }}>
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} fitView>
          <Background variant="dots" />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

// React Flow kütüphanesinin 'useReactFlow' hook'unu kullanabilmesi için Provider ile sarmalamak zorunludur.
export default function App() {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  );
}