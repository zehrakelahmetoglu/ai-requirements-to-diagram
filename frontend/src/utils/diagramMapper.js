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
  if (['activity', 'decision', 'start', 'end', 'fork', 'join'].includes(t)) return 'customActivity';
  if (t === 'sequence' || t === 'lifeline') return 'customSequence';
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
  if (['activity', 'decision', 'start', 'end', 'fork', 'join'].includes(t)) {
    return { label: n.label ?? '', shape: t };
  }
  if (t === 'sequence' || t === 'lifeline') {
    return { label: n.label ?? 'Katılımcı' };
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
    // Mevcut backend fallback
    const sonuc = backendData.analiz_sonucu;
    rawNodes = [
      {
        id: 'info',
        type: 'usecase',
        label: `📄 ${sonuc.uml_kodu?.split('\n')[1] ?? 'Analiz tamamlandı'}`,
      },
      ...(sonuc.tespit_edilen_aktörler ?? []).map((a, i) => ({
        id: `actor_${i}`,
        type: 'actor',
        label: `👤 ${a}`,
      })),
      ...(sonuc.tespit_edilen_aksiyonlar ?? []).map((ak, i) => ({
        id: `action_${i}`,
        type: 'usecase',
        label: ak,
      })),
    ];
    rawEdges = (sonuc.tespit_edilen_aktörler ?? []).map((_, i) => ({
      id: `e_${i}`,
      source: `actor_${i}`,
      target: `action_${i}`,
    }));
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
