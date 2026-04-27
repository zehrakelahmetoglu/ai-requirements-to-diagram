// components/FlowCanvas.jsx
//
// Ghost node düzeltmesi:
//   - Bu bileşen node/edge state'inin TEK sahibidir.
//   - App.jsx'ten gelen analyzedNodes/analyzedEdges sadece "analiz yükleme"
//     tetikleyicisi olarak kullanılır (sürüm sayacı ile).
//   - Manuel ekleme/silme FlowCanvas'ın kendi setNodes'u üzerinden yapılır.
//   - addNodeRef ile App.jsx'teki Sidebar butonu bu bileşenin addNode'unu çağırır.

import { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import ClassNode    from './nodes/ClassNode';
import UseCaseNode  from './nodes/UseCaseNode';
import ActivityNode from './nodes/ActivityNode';
import SequenceNode from './nodes/SequenceNode';
import Toolbar      from './Toolbar';

// nodeTypes bileşen dışında sabit — her render'da yeniden oluşmamalı
const NODE_TYPES = {
  customClass:    ClassNode,
  customUseCase:  UseCaseNode,
  customActivity: ActivityNode,
  customSequence: SequenceNode,
};

// Diyagram tipine göre yeni node şablonu döner
const NODE_TEMPLATES = {
  class: (id) => ({
    id,
    type: 'customClass',
    position: { x: 80 + Math.random() * 300, y: 80 + Math.random() * 300 },
    data: { name: 'YeniSınıf', attributes: ['- id: int'], methods: ['+ islem()'] },
  }),
  usecase: (id) => ({
    id,
    type: 'customUseCase',
    position: { x: 80 + Math.random() * 300, y: 80 + Math.random() * 300 },
    data: { label: 'Yeni İşlem', isActor: false },
  }),
  activity: (id) => ({
    id,
    type: 'customActivity',
    position: { x: 80 + Math.random() * 300, y: 80 + Math.random() * 300 },
    data: { label: 'Yeni Eylem', shape: 'activity' },
  }),
  sequence: (id) => ({
    id,
    type: 'customSequence',
    position: { x: 80 + Math.random() * 300, y: 80 + Math.random() * 300 },
    data: { label: 'Katılımcı' },
  }),
};

export default function FlowCanvas({
  analyzedNodes = [],
  analyzedEdges = [],
  addNodeRef,          // App.jsx'ten gelen ref — addNode fonksiyonunu dışarıya taşır
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  // Analiz sonucu geldiğinde (analyzedNodes değişince) canvas'ı sıfırla + fitView
  // "Sürüm" ref'i ile gereksiz tetiklenmeleri engelle
  const prevAnalyzedRef = useRef(analyzedNodes);
  useEffect(() => {
    // Aynı referans ise (ilk render sonrası boş dizi vs boş dizi) tetikleme
    if (prevAnalyzedRef.current === analyzedNodes) return;
    prevAnalyzedRef.current = analyzedNodes;

    setNodes(analyzedNodes);
    setEdges(analyzedEdges);

    if (analyzedNodes.length > 0) {
      const t = setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
      return () => clearTimeout(t);
    }
  }, [analyzedNodes, analyzedEdges, setNodes, setEdges, fitView]);

  // addNodeRef'e FlowCanvas'ın kendi addNode fonksiyonunu bağla
  // Bu ref aracılığıyla App.jsx → Sidebar "Ekle" butonu bu fonksiyonu çağırır
  useEffect(() => {
    if (!addNodeRef) return;
    addNodeRef.current = (diagramType) => {
      const id = `node_${Date.now()}`;
      const template = NODE_TEMPLATES[diagramType] ?? NODE_TEMPLATES.usecase;
      setNodes((prev) => [...prev, template(id)]);
    };
  }, [addNodeRef, setNodes]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds)),
    [setEdges]
  );

  const handleClear = () => {
    setNodes([]);
    setEdges([]);
  };

  return (
    <div className="flow-canvas">
      <Toolbar onClear={handleClear} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode="Delete"
        minZoom={0.1}
        maxZoom={2}
      >
        <Background variant="dots" gap={16} size={1} color="#334155" />
        <Controls position="bottom-right" />
        <MiniMap
          position="top-right"
          nodeStrokeColor="#64748b"
          nodeColor="#1e293b"
          maskColor="rgba(0,0,0,0.55)"
        />
      </ReactFlow>
    </div>
  );
}
