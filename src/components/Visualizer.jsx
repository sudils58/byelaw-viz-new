import { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react'

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

function Visualizer({ siteArea, floors, maxCoverage, isCoverageCompliant, isFARCompliant, roads, sitePolygon }) {

    // --- Zoom & Pan state ---
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = useState(false)
    const panStart = useRef({ x: 0, y: 0 })
    const panOrigin = useRef({ x: 0, y: 0 })
    const containerRef = useRef(null)

    // Non-passive wheel listener to prevent page scroll
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const onWheel = (e) => {
            e.preventDefault()
            setZoom(prev => {
                const delta = e.deltaY > 0 ? -0.1 : 0.1
                return Math.min(Math.max(prev + delta, 0.3), 4)
            })
        }

        container.addEventListener('wheel', onWheel, { passive: false })
        return () => container.removeEventListener('wheel', onWheel)
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
    // Center horiz, shift Y origin higher since the Z extrusion happens downwards visually in this projection
    const ORIGIN_X = SVG_W / 2
    const ORIGIN_Y = SVG_H / 2 + 10

    const baseSitePolygon = useMemo(() => {
        if (sitePolygon && sitePolygon.length >= 3) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
            sitePolygon.forEach(p => {
                if (p.x < minX) minX = p.x
                if (p.x > maxX) maxX = p.x
                if (p.y < minY) minY = p.y
                if (p.y > maxY) maxY = p.y
            })
            const polyW = maxX - minX
            const polyD = maxY - minY
            if (polyW > 0 && polyD > 0) {
                const polyScale = Math.min(SITE_W / polyW, SITE_D / polyD) * 0.95

                // First scale the polygon
                const scaledPoly = sitePolygon.map(p => ({
                    x: p.x * polyScale,
                    y: p.y * polyScale
                }))

                // Find scaled bounding box center
                let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity
                scaledPoly.forEach(p => {
                    if (p.x < sMinX) sMinX = p.x
                    if (p.x > sMaxX) sMaxX = p.x
                    if (p.y < sMinY) sMinY = p.y
                    if (p.y > sMaxY) sMaxY = p.y
                })
                const sCx = (sMinX + sMaxX) / 2
                const sCy = (sMinY + sMaxY) / 2

                // Shift to fit perfectly around origin (0,0) before isometric projection
                return scaledPoly.map(p => ({
                    x: p.x - sCx,
                    y: p.y - sCy
                }))
            }
        }

        // If no DXF, generate a perfectly centered default rectangle
        // Center the 200x140 rectangle around (0, 0)
        return [
            { x: -SITE_W / 2, y: -SITE_D / 2 },
            { x: SITE_W / 2, y: -SITE_D / 2 },
            { x: SITE_W / 2, y: SITE_D / 2 },
            { x: -SITE_W / 2, y: SITE_D / 2 }
        ]
    }, [sitePolygon])

    function getCentroid(poly) {
        let cx = 0, cy = 0
        let area = 0
        for (let i = 0; i < poly.length; i++) {
            const p1 = poly[i]
            const p2 = poly[(i + 1) % poly.length]
            const cross = p1.x * p2.y - p2.x * p1.y
            area += cross
            cx += (p1.x + p2.x) * cross
            cy += (p1.y + p2.y) * cross
        }
        area /= 2

        if (Math.abs(area) < 0.0001) {
            // Fallback to average if polygon is invalid (line or point)
            cx = 0; cy = 0
            poly.forEach(p => { cx += p.x; cy += p.y })
            return { x: cx / poly.length, y: cy / poly.length }
        }

        return { x: cx / (6 * area), y: cy / (6 * area) }
    }

    const blocks = useMemo(() => {
        if (!hasData) return []

        const siteCentroid = getCentroid(baseSitePolygon)

        return floorData
            .filter(f => f.areaNum > 0)
            .map((f, drawIndex) => {
                const ratio = Math.min(f.areaNum / siteArea, 1)
                const factor = Math.sqrt(ratio)
                const bz = SITE_H + drawIndex * (FLOOR_H + FLOOR_GAP)

                const isExceeded = (!isFARCompliant || (!isCoverageCompliant && f.index === 0))
                const palette = isExceeded
                    ? EXCEEDED_PALETTE
                    : FLOOR_PALETTE[Math.min(f.index, FLOOR_PALETTE.length - 1)]

                // Scale around the actual geometric centroid, not the SVG bounding box center
                const poly = baseSitePolygon.map(p => ({
                    x: siteCentroid.x + (p.x - siteCentroid.x) * factor,
                    y: siteCentroid.y + (p.y - siteCentroid.y) * factor
                }))

                return { ...f, poly, bz, bh: FLOOR_H, palette, drawIndex, isExceeded }
            })
    }, [floorData, siteArea, hasData, isCoverageCompliant, isFARCompliant, baseSitePolygon])

    function topCenter(poly, bz, bh) {
        const c = getCentroid(poly)
        return toIso(c.x, c.y, bz + bh)
    }

    function renderPolyTop(poly, z, fill, stroke, strokeWidth, opacity, dashArray, filter) {
        const pts = poly.map(v => toIso(v.x, v.y, z)).map(p => `${p.sx},${p.sy}`).join(' ')
        return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} strokeDasharray={dashArray} filter={filter} />
    }

    function renderPolySides(poly, z, h, colorLeft, colorRight) {
        const sides = []
        for (let i = 0; i < poly.length; i++) {
            const v1 = poly[i]
            const v2 = poly[(i + 1) % poly.length]

            // In isometric projection (30 degree rotation around Z, then rotated down 35.264 degrees),
            // a point further 'back' translates to a lower `sy` coordinate on the screen.
            // Since SVG renders painter's-algorithm style (back-to-front), we must sort the faces
            // by their projected visual depth, drawing the back-most faces first.
            const midX = (v1.x + v2.x) / 2
            const midY = (v1.y + v2.y) / 2
            const depth = toIso(midX, midY, z).sy

            const dx = v2.x - v1.x
            const dy = v2.y - v1.y
            // Choose color based on slope to simulate directional lighting
            const color = (dx > dy) ? colorRight : colorLeft
            sides.push({ v1, v2, depth, color })
        }

        // Sort lowest projected `sy` first (draw from back to front)
        sides.sort((a, b) => a.depth - b.depth)

        return sides.map((s, idx) => {
            const pts = [
                toIso(s.v1.x, s.v1.y, z),
                toIso(s.v2.x, s.v2.y, z),
                toIso(s.v2.x, s.v2.y, z + h),
                toIso(s.v1.x, s.v1.y, z + h)
            ]
            return <polygon key={idx} points={pts.map(p => `${p.sx},${p.sy}`).join(' ')} fill={s.color} stroke={s.color} strokeWidth="0.5" opacity="0.92" />
        })
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
                    touchAction: 'none', // Prevents touch-scrolling on mobile while panning
                }}
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
                        {renderPolyTop(baseSitePolygon, 0, "#cbd5e1", "none", "0", "0.3")}

                        {/* === SITE AREA SLAB === */}
                        {renderPolySides(baseSitePolygon, 0, SITE_H, "#cbd5e1", "#b0bec5")}
                        {renderPolyTop(baseSitePolygon, SITE_H, "#e2e8f0", "#94a3b8", "1", "1", 'none', "url(#dropShadow)")}

                        {/* Site Area label on top face */}
                        {(() => {
                            const c = topCenter(baseSitePolygon, 0, SITE_H)
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
                        {siteArea > 0 && (() => {
                            const c = getCentroid(baseSitePolygon)
                            const covPoly = baseSitePolygon.map(p => ({
                                x: c.x + (p.x - c.x) * coverageFactor,
                                y: c.y + (p.y - c.y) * coverageFactor
                            }))
                            return renderPolyTop(covPoly, SITE_H, "none", isCoverageCompliant ? '#10b981' : '#ef4444', "1.5", "0.8", "6 3")
                        })()}

                        {siteArea > 0 && (() => {
                            const c = getCentroid(baseSitePolygon)
                            let rightMost = { x: -Infinity, y: 0 }
                            baseSitePolygon.forEach(p => {
                                const scaledX = c.x + (p.x - c.x) * coverageFactor
                                const scaledY = c.y + (p.y - c.y) * coverageFactor
                                if (scaledX > rightMost.x) {
                                    rightMost = { x: scaledX, y: scaledY }
                                }
                            })

                            const p = toIso(rightMost.x + 8, rightMost.y, SITE_H)
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
                            const { poly, bz, bh, palette, id, index, areaNum, drawIndex } = block
                            const center = topCenter(poly, bz, bh)

                            return (
                                <g
                                    key={id}
                                    className="stack-block"
                                    style={{ animationDelay: `${drawIndex * 0.1}s` }}
                                >
                                    {renderPolySides(poly, bz, bh, palette.left, palette.right)}
                                    {renderPolyTop(poly, bz + bh, palette.top, palette.top, "0.5", "0.95")}

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
                                        // We find the corner furthest "down" (largest sy) to draw the height line.
                                        let furthestVertex = poly[0]
                                        let maxSy = -Infinity
                                        poly.forEach(v => {
                                            const p = toIso(v.x, v.y, bz)
                                            if (p.sy > maxSy) {
                                                maxSy = p.sy
                                                furthestVertex = v
                                            }
                                        })
                                        const bottom = toIso(furthestVertex.x, furthestVertex.y, bz)
                                        const top = toIso(furthestVertex.x, furthestVertex.y, bz + bh)

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
