// utils/diagramMapper.js
// Backend JSON yanıtını React Flow'un { nodes, edges } formatına dönüştürür.
// Mevcut backend'in döndürdüğü "analiz_sonucu" iç nesnesi de desteklenir (fallback).

import { MarkerType } from 'reactflow';

const GRID_COLS = 3;
const H_GAP = 280;
const V_GAP = 200;

function autoPosition(index) {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  return { x: 80 + col * H_GAP, y: 80 + row * V_GAP };
}

/** Backend node.type değerini React Flow nodeType adına çevirir. */
function resolveNodeType(type = '') {
  const t = type.toLowerCase();
  if (t === 'class') return 'customClass';
  if (t === 'usecase' || t === 'actor') return 'customUseCase';
  return 'customUseCase'; // fallback
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

/**
 * Backend yanıtını React Flow formatına dönüştürür.
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

  // ── Dönüştürme ───────────────────────────────────────────────────────────
  const nodes = rawNodes.map((n, index) => ({
    id: String(n.id),
    type: resolveNodeType(n.type),
    position: n.position ?? autoPosition(index),
    data: buildNodeData(n),
  }));

  const edges = rawEdges.map((e) => ({
    id: String(e.id),
    source: String(e.source),
    target: String(e.target),
    label: e.label ?? '',
    type: 'smoothstep',
    animated: e.animated ?? false,
    // MarkerType enum kullanılmalı — string 'arrowclosed' çalışmaz
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
  }));

  return { nodes, edges };
}
