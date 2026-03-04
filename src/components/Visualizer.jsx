import { memo, useMemo, useState, useCallback, useRef } from 'react'

// --- Isometric projection helpers ---
const ISO_ANGLE = Math.PI / 6 // 30 degrees
const COS_A = Math.cos(ISO_ANGLE)
const SIN_A = Math.sin(ISO_ANGLE)

function toIso(x, y, z) {
    return {
        sx: (x - y) * COS_A,
        sy: (x + y) * SIN_A - z,
    }
}

function isoRect(x, y, z, w, d, h, face) {
    let pts
    if (face === 'top') {
        pts = [
            toIso(x, y, z + h),
            toIso(x + w, y, z + h),
            toIso(x + w, y + d, z + h),
            toIso(x, y + d, z + h),
        ]
    } else if (face === 'left') {
        pts = [
            toIso(x, y + d, z),
            toIso(x + w, y + d, z),
            toIso(x + w, y + d, z + h),
            toIso(x, y + d, z + h),
        ]
    } else {
        pts = [
            toIso(x + w, y, z),
            toIso(x + w, y + d, z),
            toIso(x + w, y + d, z + h),
            toIso(x + w, y, z + h),
        ]
    }
    return pts.map(p => `${p.sx},${p.sy}`).join(' ')
}

function isoQuad(x1, y1, x2, y2, x3, y3, x4, y4, z) {
    const pts = [toIso(x1, y1, z), toIso(x2, y2, z), toIso(x3, y3, z), toIso(x4, y4, z)]
    return pts.map(p => `${p.sx},${p.sy}`).join(' ')
}

const FLOOR_PALETTE = [
    { top: '#3b82f6', left: '#2563eb', right: '#1d4ed8' },
    { top: '#60a5fa', left: '#3b82f6', right: '#2563eb' },
    { top: '#93c5fd', left: '#60a5fa', right: '#3b82f6' },
    { top: '#bfdbfe', left: '#93c5fd', right: '#60a5fa' },
    { top: '#60a5fa', left: '#3b82f6', right: '#2563eb' },
    { top: '#3b82f6', left: '#2563eb', right: '#1d4ed8' },
    { top: '#2563eb', left: '#1d4ed8', right: '#1e40af' },
    { top: '#1d4ed8', left: '#1e40af', right: '#1e3a8a' },
]

const EXCEEDED_PALETTE = { top: '#f87171', left: '#ef4444', right: '#dc2626' }

// Road rendering scale: 1 foot in input = this many 3D units
const ROAD_SCALE = 1.5

function Visualizer({ siteArea, floors, maxCoverage, isCoverageCompliant, isFARCompliant, roads }) {

    // --- Zoom & Pan state ---
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = useState(false)
    const panStart = useRef({ x: 0, y: 0 })
    const panOrigin = useRef({ x: 0, y: 0 })
    const containerRef = useRef(null)

    const handleWheel = useCallback((e) => {
        e.preventDefault()
        setZoom(prev => {
            const delta = e.deltaY > 0 ? -0.1 : 0.1
            return Math.min(Math.max(prev + delta, 0.3), 4)
        })
    }, [])

    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return
        setIsPanning(true)
        panStart.current = { x: e.clientX, y: e.clientY }
        panOrigin.current = { ...pan }
    }, [pan])

    const handleMouseMove = useCallback((e) => {
        if (!isPanning) return
        const dx = e.clientX - panStart.current.x
        const dy = e.clientY - panStart.current.y
        setPan({
            x: panOrigin.current.x - dx / zoom,
            y: panOrigin.current.y - dy / zoom,
        })
    }, [isPanning, zoom])

    const handleMouseUp = useCallback(() => {
        setIsPanning(false)
    }, [])

    const resetView = useCallback(() => {
        setZoom(1)
        setPan({ x: 0, y: 0 })
    }, [])

    const zoomIn = useCallback(() => {
        setZoom(prev => Math.min(prev + 0.25, 4))
    }, [])

    const zoomOut = useCallback(() => {
        setZoom(prev => Math.max(prev - 0.25, 0.3))
    }, [])

    const floorData = useMemo(() => {
        return floors.map((f, i) => ({
            ...f,
            areaNum: parseFloat(f.area) || 0,
            index: i,
        }))
    }, [floors])

    const hasData = siteArea > 0 && floorData.some(f => f.areaNum > 0)

    // --- Isometric scene config ---
    const SITE_W = 200
    const SITE_D = 140
    const SITE_H = 6
    const FLOOR_H = 28
    const FLOOR_GAP = 2

    const coverageFactor = Math.sqrt(maxCoverage)
    const COV_W = SITE_W * coverageFactor
    const COV_D = SITE_D * coverageFactor

    // Parse road dimensions
    const roadDims = useMemo(() => {
        const dims = {}
        for (const side of ['north', 'south', 'east', 'west']) {
            const r = roads[side]
            if (r.enabled) {
                dims[side] = {
                    width: (parseFloat(r.width) || 0) * ROAD_SCALE,
                    row: (parseFloat(r.row) || 0) * ROAD_SCALE,
                    rawWidth: parseFloat(r.width) || 0,
                    rawRow: parseFloat(r.row) || 0,
                }
            }
        }
        return dims
    }, [roads])

    const SVG_W = 800
    const SVG_H = 800
    const ORIGIN_X = SVG_W / 2
    const ORIGIN_Y = SVG_H - 220

    const blocks = useMemo(() => {
        if (!hasData) return []

        return floorData
            .filter(f => f.areaNum > 0)
            .map((f, drawIndex) => {
                const ratio = Math.min(f.areaNum / siteArea, 1)
                const factor = Math.sqrt(ratio)
                const bw = SITE_W * factor
                const bd = SITE_D * factor
                const bx = (SITE_W - bw) / 2
                const by = (SITE_D - bd) / 2
                const bz = SITE_H + drawIndex * (FLOOR_H + FLOOR_GAP)

                const isExceeded = (!isFARCompliant || (!isCoverageCompliant && f.index === 0))
                const palette = isExceeded
                    ? EXCEEDED_PALETTE
                    : FLOOR_PALETTE[Math.min(f.index, FLOOR_PALETTE.length - 1)]

                return { ...f, bx, by, bz, bw, bd, bh: FLOOR_H, palette, drawIndex, isExceeded }
            })
    }, [floorData, siteArea, hasData, isCoverageCompliant, isFARCompliant])

    function topCenter(bx, by, bz, bw, bd, bh) {
        const cx = bx + bw / 2
        const cy = by + bd / 2
        const iso = toIso(cx, cy, bz + bh)
        return iso
    }

    // Road label position helper
    function roadLabelPos(side, rw, rowW) {
        const totalW = Math.max(rw, rowW)
        const midW = totalW / 2
        switch (side) {
            case 'north': return toIso(SITE_W / 2, -midW, 1)
            case 'south': return toIso(SITE_W / 2, SITE_D + midW, 1)
            case 'west': return toIso(-midW, SITE_D / 2, 1)
            case 'east': return toIso(SITE_W + midW, SITE_D / 2, 1)
            default: return { sx: 0, sy: 0 }
        }
    }

    return (
        <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Isometric Building Visualizer</h3>
            </div>

            <div
                ref={containerRef}
                className="w-full overflow-hidden rounded-xl border border-white/8 relative"
                style={{
                    background: 'linear-gradient(180deg, rgba(15,23,42,0.5), rgba(30,41,59,0.5))',
                    cursor: isPanning ? 'grabbing' : 'grab',
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Zoom controls */}
                <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
                    <button
                        onClick={zoomIn}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
                        title="Zoom in"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <button
                        onClick={zoomOut}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
                        title="Zoom out"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                    </button>
                    <button
                        onClick={resetView}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
                        title="Reset view"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    <div className="text-center text-[10px] text-white/40 font-medium mt-0.5">
                        {Math.round(zoom * 100)}%
                    </div>
                </div>

                <svg
                    viewBox={`${pan.x} ${pan.y} ${SVG_W / zoom} ${SVG_H / zoom}`}
                    className="w-full h-auto"
                    style={{ maxHeight: '680px' }}
                >
                    <defs>
                        <pattern id="isoGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" opacity="1" />
                        </pattern>
                        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="2" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.12" />
                        </filter>
                        {/* Road marking pattern — dashes */}
                        <pattern id="roadMarking" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <line x1="0" y1="6" x2="12" y2="6" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />
                        </pattern>
                    </defs>

                    <rect width={SVG_W} height={SVG_H} fill="url(#isoGrid)" />

                    <g transform={`translate(${ORIGIN_X}, ${ORIGIN_Y})`}>

                        {/* === ROADS (rendered behind and around site) === */}
                        {/* North road: runs along x-axis at y < 0 */}
                        {roadDims.north && (() => {
                            const rw = roadDims.north.width
                            const rowW = roadDims.north.row
                            const effectiveW = Math.max(rw, rowW) || 20
                            // Road surface
                            return (
                                <g>
                                    {/* ROW area (lighter, full extent) */}
                                    {rowW > 0 && (
                                        <polygon
                                            points={isoQuad(-20, -rowW, SITE_W + 20, -rowW, SITE_W + 20, 0, -20, 0, 0)}
                                            fill="#fef3c7" opacity="0.5"
                                            stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="4 2"
                                        />
                                    )}
                                    {/* Road pavement */}
                                    {rw > 0 && (
                                        <polygon
                                            points={isoQuad(-20, -rw, SITE_W + 20, -rw, SITE_W + 20, 0, -20, 0, 0.5)}
                                            fill="#64748b" opacity="0.35"
                                            stroke="#475569" strokeWidth="0.8"
                                        />
                                    )}
                                    {/* Center line */}
                                    {rw > 4 && (() => {
                                        const mid = -rw / 2
                                        const p1 = toIso(-10, mid, 0.8)
                                        const p2 = toIso(SITE_W + 10, mid, 0.8)
                                        return <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#fbbf24" strokeWidth="1" strokeDasharray="6 4" opacity="0.7" />
                                    })()}
                                    {/* Label */}
                                    {(() => {
                                        const pos = roadLabelPos('north', rw, rowW)
                                        return (
                                            <text x={pos.sx} y={pos.sy - 6} textAnchor="middle" fill="#92400e" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">
                                                N — {roadDims.north.rawWidth > 0 ? `${roadDims.north.rawWidth}' road` : ''}{roadDims.north.rawRow > 0 ? ` · ${roadDims.north.rawRow}' ROW` : ''}
                                            </text>
                                        )
                                    })()}
                                </g>
                            )
                        })()}

                        {/* South road: runs along x-axis at y > SITE_D */}
                        {roadDims.south && (() => {
                            const rw = roadDims.south.width
                            const rowW = roadDims.south.row
                            return (
                                <g>
                                    {rowW > 0 && (
                                        <polygon
                                            points={isoQuad(-20, SITE_D, SITE_W + 20, SITE_D, SITE_W + 20, SITE_D + rowW, -20, SITE_D + rowW, 0)}
                                            fill="#fef3c7" opacity="0.5"
                                            stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="4 2"
                                        />
                                    )}
                                    {rw > 0 && (
                                        <polygon
                                            points={isoQuad(-20, SITE_D, SITE_W + 20, SITE_D, SITE_W + 20, SITE_D + rw, -20, SITE_D + rw, 0.5)}
                                            fill="#64748b" opacity="0.35"
                                            stroke="#475569" strokeWidth="0.8"
                                        />
                                    )}
                                    {rw > 4 && (() => {
                                        const mid = SITE_D + rw / 2
                                        const p1 = toIso(-10, mid, 0.8)
                                        const p2 = toIso(SITE_W + 10, mid, 0.8)
                                        return <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#fbbf24" strokeWidth="1" strokeDasharray="6 4" opacity="0.7" />
                                    })()}
                                    {(() => {
                                        const pos = roadLabelPos('south', rw, rowW)
                                        return (
                                            <text x={pos.sx} y={pos.sy + 12} textAnchor="middle" fill="#92400e" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">
                                                S — {roadDims.south.rawWidth > 0 ? `${roadDims.south.rawWidth}' road` : ''}{roadDims.south.rawRow > 0 ? ` · ${roadDims.south.rawRow}' ROW` : ''}
                                            </text>
                                        )
                                    })()}
                                </g>
                            )
                        })()}

                        {/* West road: runs along y-axis at x < 0 */}
                        {roadDims.west && (() => {
                            const rw = roadDims.west.width
                            const rowW = roadDims.west.row
                            return (
                                <g>
                                    {rowW > 0 && (
                                        <polygon
                                            points={isoQuad(-rowW, -20, 0, -20, 0, SITE_D + 20, -rowW, SITE_D + 20, 0)}
                                            fill="#fef3c7" opacity="0.5"
                                            stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="4 2"
                                        />
                                    )}
                                    {rw > 0 && (
                                        <polygon
                                            points={isoQuad(-rw, -20, 0, -20, 0, SITE_D + 20, -rw, SITE_D + 20, 0.5)}
                                            fill="#64748b" opacity="0.35"
                                            stroke="#475569" strokeWidth="0.8"
                                        />
                                    )}
                                    {rw > 4 && (() => {
                                        const mid = -rw / 2
                                        const p1 = toIso(mid, -10, 0.8)
                                        const p2 = toIso(mid, SITE_D + 10, 0.8)
                                        return <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#fbbf24" strokeWidth="1" strokeDasharray="6 4" opacity="0.7" />
                                    })()}
                                    {(() => {
                                        const pos = roadLabelPos('west', rw, rowW)
                                        return (
                                            <text x={pos.sx - 8} y={pos.sy} textAnchor="end" fill="#92400e" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">
                                                W — {roadDims.west.rawWidth > 0 ? `${roadDims.west.rawWidth}'` : ''}{roadDims.west.rawRow > 0 ? ` · ${roadDims.west.rawRow}' ROW` : ''}
                                            </text>
                                        )
                                    })()}
                                </g>
                            )
                        })()}

                        {/* East road: runs along y-axis at x > SITE_W */}
                        {roadDims.east && (() => {
                            const rw = roadDims.east.width
                            const rowW = roadDims.east.row
                            return (
                                <g>
                                    {rowW > 0 && (
                                        <polygon
                                            points={isoQuad(SITE_W, -20, SITE_W + rowW, -20, SITE_W + rowW, SITE_D + 20, SITE_W, SITE_D + 20, 0)}
                                            fill="#fef3c7" opacity="0.5"
                                            stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="4 2"
                                        />
                                    )}
                                    {rw > 0 && (
                                        <polygon
                                            points={isoQuad(SITE_W, -20, SITE_W + rw, -20, SITE_W + rw, SITE_D + 20, SITE_W, SITE_D + 20, 0.5)}
                                            fill="#64748b" opacity="0.35"
                                            stroke="#475569" strokeWidth="0.8"
                                        />
                                    )}
                                    {rw > 4 && (() => {
                                        const mid = SITE_W + rw / 2
                                        const p1 = toIso(mid, -10, 0.8)
                                        const p2 = toIso(mid, SITE_D + 10, 0.8)
                                        return <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#fbbf24" strokeWidth="1" strokeDasharray="6 4" opacity="0.7" />
                                    })()}
                                    {(() => {
                                        const pos = roadLabelPos('east', rw, rowW)
                                        return (
                                            <text x={pos.sx + 8} y={pos.sy} textAnchor="start" fill="#92400e" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">
                                                E — {roadDims.east.rawWidth > 0 ? `${roadDims.east.rawWidth}'` : ''}{roadDims.east.rawRow > 0 ? ` · ${roadDims.east.rawRow}' ROW` : ''}
                                            </text>
                                        )
                                    })()}
                                </g>
                            )
                        })()}

                        {/* === GROUND PLANE (shadow) === */}
                        <polygon
                            points={isoRect(0, 0, 0, SITE_W, SITE_D, 0, 'top')}
                            fill="#cbd5e1"
                            opacity="0.3"
                        />

                        {/* === SITE AREA SLAB === */}
                        <polygon
                            points={isoRect(0, 0, 0, SITE_W, SITE_D, SITE_H, 'top')}
                            fill="#e2e8f0"
                            stroke="#94a3b8"
                            strokeWidth="1"
                            filter="url(#dropShadow)"
                        />
                        <polygon
                            points={isoRect(0, 0, 0, SITE_W, SITE_D, SITE_H, 'left')}
                            fill="#cbd5e1"
                            stroke="#94a3b8"
                            strokeWidth="0.8"
                        />
                        <polygon
                            points={isoRect(0, 0, 0, SITE_W, SITE_D, SITE_H, 'right')}
                            fill="#b0bec5"
                            stroke="#94a3b8"
                            strokeWidth="0.8"
                        />

                        {/* Site Area label on top face */}
                        {(() => {
                            const c = topCenter(0, 0, 0, SITE_W, SITE_D, SITE_H)
                            return (
                                <text
                                    x={c.sx}
                                    y={c.sy + 2}
                                    textAnchor="middle"
                                    fill="#64748b"
                                    fontSize="10"
                                    fontWeight="600"
                                    fontFamily="Inter, sans-serif"
                                >
                                    SITE {siteArea > 0 ? `— ${siteArea.toLocaleString()} sq ft` : 'AREA'}
                                </text>
                            )
                        })()}

                        {/* === Coverage outline === */}
                        {siteArea > 0 && (
                            <polygon
                                points={isoRect(
                                    (SITE_W - COV_W) / 2,
                                    (SITE_D - COV_D) / 2,
                                    0,
                                    COV_W, COV_D, SITE_H,
                                    'top'
                                )}
                                fill="none"
                                stroke={isCoverageCompliant ? '#10b981' : '#ef4444'}
                                strokeWidth="1.5"
                                strokeDasharray="6 3"
                                opacity="0.8"
                            />
                        )}

                        {siteArea > 0 && (() => {
                            const cx = (SITE_W - COV_W) / 2 + COV_W
                            const cy = (SITE_D - COV_D) / 2
                            const p = toIso(cx + 4, cy, SITE_H)
                            return (
                                <text
                                    x={p.sx}
                                    y={p.sy}
                                    fill={isCoverageCompliant ? '#10b981' : '#ef4444'}
                                    fontSize="9"
                                    fontWeight="700"
                                    fontFamily="Inter, sans-serif"
                                >
                                    {Math.round(maxCoverage * 100)}% MAX
                                </text>
                            )
                        })()}

                        {/* === FLOOR BLOCKS === */}
                        {blocks.map((block) => {
                            const { bx, by, bz, bw, bd, bh, palette, id, index, areaNum, drawIndex } = block
                            const center = topCenter(bx, by, bz, bw, bd, bh)

                            return (
                                <g
                                    key={id}
                                    className="stack-block"
                                    style={{ animationDelay: `${drawIndex * 0.1}s` }}
                                >
                                    <polygon
                                        points={isoRect(bx, by, bz, bw, bd, bh, 'left')}
                                        fill={palette.left}
                                        stroke={palette.left}
                                        strokeWidth="0.5"
                                        opacity="0.92"
                                    />
                                    <polygon
                                        points={isoRect(bx, by, bz, bw, bd, bh, 'right')}
                                        fill={palette.right}
                                        stroke={palette.right}
                                        strokeWidth="0.5"
                                        opacity="0.92"
                                    />
                                    <polygon
                                        points={isoRect(bx, by, bz, bw, bd, bh, 'top')}
                                        fill={palette.top}
                                        stroke={palette.top}
                                        strokeWidth="0.5"
                                        opacity="0.95"
                                    />

                                    <text
                                        x={center.sx}
                                        y={center.sy + 1}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fill="#ffffff"
                                        fontSize="10"
                                        fontWeight="700"
                                        fontFamily="Inter, sans-serif"
                                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                                    >
                                        {index === 0 ? 'GF' : `F${index}`} — {areaNum.toLocaleString()} sq ft
                                    </text>

                                    {(() => {
                                        const bottom = toIso(bx + bw, by + bd, bz)
                                        const top = toIso(bx + bw, by + bd, bz + bh)
                                        return (
                                            <line
                                                x1={bottom.sx} y1={bottom.sy}
                                                x2={top.sx} y2={top.sy}
                                                stroke="rgba(255,255,255,0.25)"
                                                strokeWidth="1"
                                            />
                                        )
                                    })()}
                                </g>
                            )
                        })}

                        {/* === DIMENSION LABELS === */}
                        {siteArea > 0 && blocks.length > 0 && (() => {
                            const totalH = SITE_H + blocks.length * (FLOOR_H + FLOOR_GAP)
                            const bottomRight = toIso(SITE_W + 15, SITE_D, 0)
                            const topRight = toIso(SITE_W + 15, SITE_D, totalH)
                            return (
                                <g opacity="0.6">
                                    <line x1={bottomRight.sx} y1={bottomRight.sy} x2={topRight.sx} y2={topRight.sy}
                                        stroke="#64748b" strokeWidth="0.8" strokeDasharray="3 2" />
                                    <text
                                        x={(bottomRight.sx + topRight.sx) / 2 + 8}
                                        y={(bottomRight.sy + topRight.sy) / 2}
                                        fill="#64748b"
                                        fontSize="9"
                                        fontWeight="600"
                                        fontFamily="Inter, sans-serif"
                                    >
                                        {blocks.length} {blocks.length === 1 ? 'Floor' : 'Floors'}
                                    </text>
                                </g>
                            )
                        })()}

                        {/* Compass indicator */}
                        {(() => {
                            const cp = toIso(-30, -30, 0)
                            return (
                                <g transform={`translate(${cp.sx}, ${cp.sy})`} opacity="0.5">
                                    <text x="0" y="-8" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="800" fontFamily="Inter, sans-serif">N</text>
                                    <line x1="0" y1="-5" x2="0" y2="8" stroke="#64748b" strokeWidth="1.2" />
                                    <polygon points="-3,0 3,0 0,-5" fill="#64748b" />
                                </g>
                            )
                        })()}
                    </g>

                    {/* Empty state */}
                    {!hasData && (
                        <text
                            x={SVG_W / 2}
                            y={SVG_H / 2 - 40}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="14"
                            fontWeight="500"
                            fontFamily="Inter, sans-serif"
                        >
                            Enter site area and add floors to see the isometric view
                        </text>
                    )}
                </svg>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-white/45">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-3 rounded-sm" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}></div>
                    <span>Floor Block</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-5 border-t-2 border-dashed border-emerald-500 inline-block"></span>
                    <span>Coverage Limit</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-3 rounded-sm" style={{ background: 'linear-gradient(135deg, #f87171, #dc2626)' }}></div>
                    <span>Non-compliant</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-3 rounded-sm bg-slate-200 border border-slate-300"></div>
                    <span>Site Platform</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-3 rounded-sm bg-slate-400/40 border border-slate-500/50"></div>
                    <span>Road</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-3 rounded-sm bg-amber-100 border border-amber-400"></div>
                    <span>ROW</span>
                </div>
            </div>
        </div>
    )
}

export default memo(Visualizer)
