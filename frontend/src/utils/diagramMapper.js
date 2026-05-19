// utils/diagramMapper.js
// Backend JSON yanıtını React Flow formatına dönüştürür.
// Dagre kütüphanesi ile node'ları boyutlarına ve edge bağlantılarına göre
// otomatik olarak düzgün pozisyonlandırır.

import { MarkerType } from 'reactflow';
import dagre from 'dagre';

// ── Node boyut tahminleri (px) ─────────────────────────────────────────────

/** Class node boyutunu içeriğine göre hesaplar. */
function estimateClassNodeSize(data) {
  const attrCount = data.attributes?.length ?? 0;
  const methodCount = data.methods?.length ?? 0;
  const width = 260;
  // Başlık(50) + attr bölümü(attr*26 + padding 36) + method bölümü(method*26 + padding 36)
  const height = 50 + (attrCount * 26 + 36) + (methodCount * 26 + 36);
  return { width, height: Math.max(140, height) };
}

/** UseCase/Actor node boyutu. */
function estimateUseCaseNodeSize(data) {
  const labelLen = (data.label ?? '').length;
  const width = Math.max(160, Math.min(240, labelLen * 9 + 60));
  return { width, height: 65 };
}

/** Dönüştürülmüş node'un boyutunu tahmin eder. */
function getNodeDimensions(node) {
  if (node.type === 'customClass') return estimateClassNodeSize(node.data);
  return estimateUseCaseNodeSize(node.data);
}

// ── Dagre layout ────────────────────────────────────────────────────────────

/**
 * Node'ları dagre ile otomatik pozisyonlandırır.
 * Node boyutlarını ve edge bağlantılarını dikkate alarak
 * çakışmasız, hiyerarşik bir düzen oluşturur.
 *
 * @param {object[]} nodes - React Flow node dizisi
 * @param {object[]} edges - React Flow edge dizisi
 * @param {string} direction - 'TB' (yukarıdan aşağı) veya 'LR' (soldan sağa)
 * @returns {object[]} Pozisyonlandırılmış node dizisi
 */
function applyDagreLayout(nodes, edges, direction = 'TB') {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 60,   // Aynı seviyedeki node'lar arası yatay boşluk
    ranksep: 80,   // Seviyeler arası dikey boşluk
    edgesep: 30,   // Edge'ler arası boşluk
    marginx: 40,
    marginy: 40,
  });

  // Node'ları boyutlarıyla birlikte grafda kaydet
  nodes.forEach((node) => {
    const { width, height } = getNodeDimensions(node);
    g.setNode(node.id, { width, height });
  });

  // Edge'leri graafa ekle
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Dagre layout hesapla
  dagre.layout(g);

  // Hesaplanan pozisyonları node'lara uygula
  // Dagre merkez koordinat verir, React Flow sol-üst köşe ister
  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    const { width, height } = getNodeDimensions(node);
    return {
      ...node,
      position: {
        x: dagreNode.x - width / 2,
        y: dagreNode.y - height / 2,
      },
    };
  });
}

// ── Node tip çözümleme ──────────────────────────────────────────────────────

/**
 * Backend node.type değerini React Flow nodeType adına çevirir.
 * Desteklenen tipler: class, usecase, actor.
 */
function resolveNodeType(type = '') {
  const t = type.toLowerCase();
  if (t === 'class') return 'customClass';
  if (t === 'usecase' || t === 'actor') return 'customUseCase';
  console.warn(`[diagramMapper] Bilinmeyen node tipi: "${type}" → customUseCase olarak işlenecek.`);
  return 'customUseCase';
}

/** node.type'a göre data nesnesini oluşturur. */
function buildNodeData(n) {
  const t = (n.type ?? '').toLowerCase();
  if (t === 'class') {
    return {
      name: n.label ?? 'Sınıf',
      attributes: n.attributes ?? [],
      methods: n.methods ?? [],
    };
  }
  if (t === 'usecase' || t === 'actor') {
    return { label: n.label ?? 'İşlem', isActor: t === 'actor' };
  }
  return { label: n.label ?? '' };
}

// ── Ana dönüştürücü ─────────────────────────────────────────────────────────

/**
 * Backend yanıtını React Flow formatına dönüştürür ve
 * dagre ile otomatik düzen uygular.
 *
 * Desteklenen backend yapıları:
 *   1. { nodes: [...], edges: [...] }              ← ideal (yeni backend)
 *   2. { analiz_sonucu: { ... }, mesaj: "..." }    ← mevcut backend fallback
 *   3. Düz dizi [ ...nodes ]                       ← sadece node listesi
 *
 * @param {object|Array} backendData
 * @returns {{ nodes: object[], edges: object[] }}
 */
export function mapToReactFlow(backendData) {
  // ── Format tespiti ───────────────────────────────────────────────────────
  let rawNodes = [];
  let rawEdges = [];

  if (Array.isArray(backendData)) {
    rawNodes = backendData;
  } else if (backendData?.nodes) {
    rawNodes = backendData.nodes;
    rawEdges = backendData.edges ?? [];
  } else if (backendData?.analiz_sonucu) {
    // Backend eski stub formatı döndürüyor — AI servisi henüz entegre edilmemiş
    throw new Error(
      'Backend henüz AI servisine bağlı değil. Lütfen backend ekibiyle iletişime geçin.'
    );
  }

  // ── Node dönüştürme ──────────────────────────────────────────────────────
  const nodes = rawNodes.map((n) => ({
    id: String(n.id),
    type: resolveNodeType(n.type),
    position: { x: 0, y: 0 }, // Dagre tarafından hesaplanacak
    data: buildNodeData(n),
  }));

  // ── Edge dönüştürme ──────────────────────────────────────────────────────
  const edges = rawEdges.map((e) => ({
    id: String(e.id),
    source: String(e.source),
    target: String(e.target),
    label: e.label ?? '',
    type: 'smoothstep',
    animated: e.animated ?? false,
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
  }));

  // ── Dagre ile otomatik düzen uygula ──────────────────────────────────────
  const layoutedNodes = nodes.length > 0
    ? applyDagreLayout(nodes, edges, 'TB')
    : nodes;

  return { nodes: layoutedNodes, edges };
}
