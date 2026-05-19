// components/FlowCanvas.jsx
//
// Undo desteği:
//   - Her silme/temizleme/bağlantı öncesi mevcut durum history'ye kaydedilir.
//   - Ctrl+Z veya Toolbar "Geri Al" butonu ile önceki durum geri yüklenir.
//   - SnapshotContext ile node bileşenleri de silme öncesi snapshot alabilir.

import { useCallback, useEffect, useRef, useState, createContext, useContext } from 'react';
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

import ClassNode   from './nodes/ClassNode';
import UseCaseNode from './nodes/UseCaseNode';
import Toolbar     from './Toolbar';

// Snapshot context — node bileşenlerinin silme öncesi durumu kaydetmesini sağlar
const SnapshotContext = createContext(null);
export const useSnapshot = () => useContext(SnapshotContext);

// nodeTypes bileşen dışında sabit — her render'da yeniden oluşmamalı
const NODE_TYPES = {
  customClass:   ClassNode,
  customUseCase: UseCaseNode,
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
};

const MAX_HISTORY = 30;

export default function FlowCanvas({
  analyzedNodes = [],
  analyzedEdges = [],
  addNodeRef,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  // ── Undo geçmişi ──────────────────────────────────────────────────────────
  const historyRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);

  // Güncel nodes/edges'e ref ile erişim (takeSnapshot'ın stabil kalması için)
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const takeSnapshot = useCallback(() => {
    historyRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current)),
    });
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    setCanUndo(true);
  }, []);

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (prev) {
      setNodes(prev.nodes);
      setEdges(prev.edges);
    }
    setCanUndo(historyRef.current.length > 0);
  }, [setNodes, setEdges]);

  // Ctrl+Z kısayolu
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [undo]);

  // ── Analiz sonucu geldiğinde canvas'ı sıfırla + fitView ──────────────────
  const prevAnalyzedRef = useRef(analyzedNodes);
  useEffect(() => {
    if (prevAnalyzedRef.current === analyzedNodes) return;
    prevAnalyzedRef.current = analyzedNodes;

    setNodes(analyzedNodes);
    setEdges(analyzedEdges);

    // Yeni analiz geldiğinde geçmişi temizle
    historyRef.current = [];
    setCanUndo(false);

    if (analyzedNodes.length > 0) {
      const t = setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
      return () => clearTimeout(t);
    }
  }, [analyzedNodes, analyzedEdges, setNodes, setEdges, fitView]);

  // addNodeRef'e FlowCanvas'ın kendi addNode fonksiyonunu bağla
  useEffect(() => {
    if (!addNodeRef) return;
    addNodeRef.current = (diagramType) => {
      takeSnapshot();
      const id = `node_${Date.now()}`;
      const template = NODE_TEMPLATES[diagramType] ?? NODE_TEMPLATES.usecase;
      setNodes((prev) => [...prev, template(id)]);
    };
  }, [addNodeRef, setNodes, takeSnapshot]);

  // Node silme (Delete tuşu) öncesi snapshot al
  const handleNodesChange = useCallback((changes) => {
    if (changes.some((c) => c.type === 'remove')) {
      takeSnapshot();
    }
    onNodesChange(changes);
  }, [onNodesChange, takeSnapshot]);

  // Edge silme öncesi snapshot al
  const handleEdgesChange = useCallback((changes) => {
    if (changes.some((c) => c.type === 'remove')) {
      takeSnapshot();
    }
    onEdgesChange(changes);
  }, [onEdgesChange, takeSnapshot]);

  const onConnect = useCallback(
    (params) => {
      takeSnapshot();
      setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds));
    },
    [setEdges, takeSnapshot]
  );

  const handleClear = () => {
    if (nodes.length > 0 || edges.length > 0) takeSnapshot();
    setNodes([]);
    setEdges([]);
  };

  return (
    <div className="flow-canvas">
      <Toolbar onClear={handleClear} onUndo={undo} canUndo={canUndo} />

      {/* Boş canvas rehber ekranı */}
      {nodes.length === 0 && (
        <div className="canvas-empty-state">
          <div className="canvas-empty-state__icon">✦</div>
          <h2 className="canvas-empty-state__title">Diyagram Oluşturmaya Başla</h2>
          <p className="canvas-empty-state__desc">
            Sol panelden gereksinim metninizi girin ve<br />
            <strong>AI ile Analiz Et</strong> butonuna tıklayın.
          </p>
          <div className="canvas-empty-state__steps">
            <div className="canvas-empty-state__step">
              <span className="canvas-empty-state__step-num">1</span>
              <span>Kullanıcı hikayenizi veya gereksinim metninizi yazın</span>
            </div>
            <div className="canvas-empty-state__step">
              <span className="canvas-empty-state__step-num">2</span>
              <span>Diyagram tipini seçin: <strong>Sınıf</strong> veya <strong>Use Case</strong></span>
            </div>
            <div className="canvas-empty-state__step">
              <span className="canvas-empty-state__step-num">3</span>
              <span>AI diyagramı otomatik oluşturur — düzenleyebilirsiniz</span>
            </div>
          </div>
        </div>
      )}

      <SnapshotContext.Provider value={takeSnapshot}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode="Delete"
          selectionKeyCode="Shift"
          multiSelectionKeyCode="Shift"
          selectNodesOnDrag={false}
          elevateEdgesOnSelect
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
      </SnapshotContext.Provider>
    </div>
  );
}
