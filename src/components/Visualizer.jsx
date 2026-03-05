import { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react'

// --- Isometric constants ---
const ISO_ANGLE = Math.PI / 6
const COS_A = Math.cos(ISO_ANGLE)
const SIN_A = Math.sin(ISO_ANGLE)

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
const ROAD_SCALE = 1.5

function Visualizer({ siteArea, floors, maxCoverage, isCoverageCompliant, isFARCompliant, roads, setbacks, sitePolygon }) {
    const SITE_W = 200
    const SITE_D = 140
    const SITE_H = 6
    const FLOOR_H = 28
    const FLOOR_GAP = 2
    const SVG_W = 800
    const SVG_H = 800
    const ORIGIN_X = SVG_W / 2
    const ORIGIN_Y = SVG_H / 2 + 10

    // --- State ---
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = useState(false)
    const [orbitAngle, setOrbitAngle] = useState(0)
    const [isOrbiting, setIsOrbiting] = useState(false)
    const [autoOrbit, setAutoOrbit] = useState(false)

    // --- Refs ---
    const panStart = useRef({ x: 0, y: 0 })
    const panOrigin = useRef({ x: 0, y: 0 })
    const orbitStart = useRef({ x: 0, angle: 0 })
    const pinchDistRef = useRef(null)
    const pinchAngleRef = useRef(null)
    const containerRef = useRef(null)

    // --- Auto-orbit ---
    useEffect(() => {
        if (!autoOrbit) return
        let rafId, lastTime = null
        const step = (time) => {
            if (lastTime !== null) setOrbitAngle(a => a + (time - lastTime) / 1000 * 0.6)
            lastTime = time
            rafId = requestAnimationFrame(step)
        }
        rafId = requestAnimationFrame(step)
        return () => cancelAnimationFrame(rafId)
    }, [autoOrbit])

    // --- Non-passive wheel + touchmove ---
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const onWheel = (e) => {
            e.preventDefault()
            setZoom(prev => Math.min(Math.max(prev + (e.deltaY > 0 ? -0.1 : 0.1), 0.3), 4))
        }
        const onTM = (e) => { if (e.touches.length >= 1) e.preventDefault() }
        el.addEventListener('wheel', onWheel, { passive: false })
        el.addEventListener('touchmove', onTM, { passive: false })
        return () => { el.removeEventListener('wheel', onWheel); el.removeEventListener('touchmove', onTM) }
    }, [])

    // --- Mouse ---
    const handleMouseDown = useCallback((e) => {
        if (e.button === 0) {
            setIsPanning(true)
            panStart.current = { x: e.clientX, y: e.clientY }
            panOrigin.current = { ...pan }
        } else if (e.button === 1) {
            // Middle mouse button (scroll wheel press) = orbit, SketchUp-style
            e.preventDefault()
            setIsOrbiting(true)
            orbitStart.current = { x: e.clientX, angle: orbitAngle }
        }
    }, [pan, orbitAngle])

    const handleMouseMove = useCallback((e) => {
        if (isPanning) {
            setPan({ x: panOrigin.current.x - (e.clientX - panStart.current.x) / zoom, y: panOrigin.current.y - (e.clientY - panStart.current.y) / zoom })
        } else if (isOrbiting) {
            setOrbitAngle(orbitStart.current.angle + (e.clientX - orbitStart.current.x) * 0.005)
        }
    }, [isPanning, isOrbiting, zoom])

    const handleMouseUp = useCallback(() => { setIsPanning(false); setIsOrbiting(false) }, [])

    // --- Touch ---
    const handleTouchStart = useCallback((e) => {
        if (e.touches.length === 1) {
            setIsPanning(true)
            panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
            panOrigin.current = { ...pan }
            pinchDistRef.current = null; pinchAngleRef.current = null
        } else if (e.touches.length === 2) {
            setIsPanning(false)
            const dx = e.touches[0].clientX - e.touches[1].clientX
            const dy = e.touches[0].clientY - e.touches[1].clientY
            pinchDistRef.current = Math.sqrt(dx * dx + dy * dy)
            pinchAngleRef.current = { start: Math.atan2(dy, dx), orbit: orbitAngle }
        }
    }, [pan, orbitAngle])

    const handleTouchMove = useCallback((e) => {
        if (e.touches.length === 1 && isPanning) {
            setPan({ x: panOrigin.current.x - (e.touches[0].clientX - panStart.current.x) / zoom, y: panOrigin.current.y - (e.touches[0].clientY - panStart.current.y) / zoom })
        } else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX
            const dy = e.touches[0].clientY - e.touches[1].clientY
            const d = Math.sqrt(dx * dx + dy * dy)
            if (pinchDistRef.current !== null) { setZoom(prev => Math.min(Math.max(prev * d / pinchDistRef.current, 0.3), 4)); pinchDistRef.current = d }
            if (pinchAngleRef.current !== null) {
                const a = Math.atan2(dy, dx)
                setOrbitAngle(pinchAngleRef.current.orbit + (a - pinchAngleRef.current.start) * 0.5)
            }
        }
    }, [isPanning, zoom])

    const handleTouchEnd = useCallback(() => { setIsPanning(false); pinchDistRef.current = null; pinchAngleRef.current = null }, [])

    // --- Controls ---
    const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); setOrbitAngle(0); setAutoOrbit(false) }, [])
    const zoomIn = useCallback(() => setZoom(p => Math.min(p + 0.25, 4)), [])
    const zoomOut = useCallback(() => setZoom(p => Math.max(p - 0.25, 0.3)), [])
    const orbitLeft = useCallback(() => setOrbitAngle(a => a - Math.PI / 8), [])
    const orbitRight = useCallback(() => setOrbitAngle(a => a + Math.PI / 8), [])

    // =====================================================================
    // LOCAL toIso — shadows any module-level version; applies orbit rotation
    // All geometry functions below will use this via closure.
    // =====================================================================
    function toIso(x, y, z) {
        const cosT = Math.cos(orbitAngle), sinT = Math.sin(orbitAngle)
        const rx = x * cosT - y * sinT
        const ry = x * sinT + y * cosT
        return { sx: (rx - ry) * COS_A, sy: (rx + ry) * SIN_A - z }
    }

    function isoQuad(x1, y1, x2, y2, x3, y3, x4, y4, z) {
        return [toIso(x1, y1, z), toIso(x2, y2, z), toIso(x3, y3, z), toIso(x4, y4, z)]
            .map(p => `${p.sx},${p.sy}`).join(' ')
    }

    // --- Data ---
    const floorData = useMemo(() => floors.map((f, i) => ({ ...f, areaNum: parseFloat(f.area) || 0, index: i })), [floors])
    const hasData = siteArea > 0 && floorData.some(f => f.areaNum > 0)
    const coverageFactor = Math.sqrt(maxCoverage)

    const roadDims = useMemo(() => {
        const dims = {}
        for (const side of ['north', 'south', 'east', 'west']) {
            const r = roads[side]
            if (r.enabled) dims[side] = { width: (parseFloat(r.width) || 0) * ROAD_SCALE, row: (parseFloat(r.row) || 0) * ROAD_SCALE, rawWidth: parseFloat(r.width) || 0, rawRow: parseFloat(r.row) || 0 }
        }
        return dims
    }, [roads])

    // baseSitePolygon is always CENTERED at (0,0)
    const baseSitePolygon = useMemo(() => {
        if (sitePolygon && sitePolygon.length >= 3) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
            sitePolygon.forEach(p => { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y })
            const polyW = maxX - minX, polyD = maxY - minY
            if (polyW > 0 && polyD > 0) {
                const s = Math.min(SITE_W / polyW, SITE_D / polyD) * 0.95
                const scaled = sitePolygon.map(p => ({ x: p.x * s, y: p.y * s }))
                let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity
                scaled.forEach(p => { if (p.x < sMinX) sMinX = p.x; if (p.x > sMaxX) sMaxX = p.x; if (p.y < sMinY) sMinY = p.y; if (p.y > sMaxY) sMaxY = p.y })
                const cx = (sMinX + sMaxX) / 2, cy = (sMinY + sMaxY) / 2
                return scaled.map(p => ({ x: p.x - cx, y: p.y - cy }))
            }
        }
        return [{ x: -SITE_W / 2, y: -SITE_D / 2 }, { x: SITE_W / 2, y: -SITE_D / 2 }, { x: SITE_W / 2, y: SITE_D / 2 }, { x: -SITE_W / 2, y: SITE_D / 2 }]
    }, [sitePolygon])

    // Bounding box of the centered polygon — used for road alignment
    const siteBBox = useMemo(() => {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        baseSitePolygon.forEach(p => { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y })
        return { minX, maxX, minY, maxY }
    }, [baseSitePolygon])

    function getCentroid(poly) {
        let cx = 0, cy = 0, area = 0
        for (let i = 0; i < poly.length; i++) {
            const p1 = poly[i], p2 = poly[(i + 1) % poly.length]
            const cross = p1.x * p2.y - p2.x * p1.y
            area += cross; cx += (p1.x + p2.x) * cross; cy += (p1.y + p2.y) * cross
        }
        area /= 2
        if (Math.abs(area) < 0.0001) { let sx = 0, sy = 0; poly.forEach(p => { sx += p.x; sy += p.y }); return { x: sx / poly.length, y: sy / poly.length } }
        return { x: cx / (6 * area), y: cy / (6 * area) }
    }

    const blocks = useMemo(() => {
        if (!hasData) return []
        const c = getCentroid(baseSitePolygon)
        return floorData.filter(f => f.areaNum > 0).map((f, drawIndex) => {
            const factor = Math.sqrt(Math.min(f.areaNum / siteArea, 1))
            const bz = SITE_H + drawIndex * (FLOOR_H + FLOOR_GAP)
            const isExceeded = !isFARCompliant || (!isCoverageCompliant && f.index === 0)
            const palette = isExceeded ? EXCEEDED_PALETTE : FLOOR_PALETTE[Math.min(f.index, FLOOR_PALETTE.length - 1)]
            const poly = baseSitePolygon.map(p => ({ x: c.x + (p.x - c.x) * factor, y: c.y + (p.y - c.y) * factor }))
            return { ...f, poly, bz, bh: FLOOR_H, palette, drawIndex, isExceeded }
        })
    }, [floorData, siteArea, hasData, isCoverageCompliant, isFARCompliant, baseSitePolygon])

    // --- Render helpers (use local toIso via closure) ---
    function topCenter(poly, bz, bh) {
        const c = getCentroid(poly)
        return toIso(c.x, c.y, bz + bh)
    }

    function renderPolyTop(poly, z, fill, stroke, sw, opacity, dash, filter) {
        const pts = poly.map(v => toIso(v.x, v.y, z)).map(p => `${p.sx},${p.sy}`).join(' ')
        return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} opacity={opacity} strokeDasharray={dash} filter={filter} />
    }

    function renderPolySides(poly, z, h, cLeft, cRight) {
        const sides = []
        for (let i = 0; i < poly.length; i++) {
            const v1 = poly[i], v2 = poly[(i + 1) % poly.length]
            const midX = (v1.x + v2.x) / 2, midY = (v1.y + v2.y) / 2
            sides.push({ v1, v2, depth: toIso(midX, midY, z).sy, color: ((v2.x - v1.x) > (v2.y - v1.y)) ? cRight : cLeft })
        }
        sides.sort((a, b) => a.depth - b.depth)
        return sides.map((s, i) => {
            const pts = [toIso(s.v1.x, s.v1.y, z), toIso(s.v2.x, s.v2.y, z), toIso(s.v2.x, s.v2.y, z + h), toIso(s.v1.x, s.v1.y, z + h)]
            return <polygon key={i} points={pts.map(p => `${p.sx},${p.sy}`).join(' ')} fill={s.color} stroke={s.color} strokeWidth="0.5" opacity="0.92" />
        })
    }

    // Road label positions using siteBBox
    function roadLabelPos(side, rw, rowW) {
        const { minX, maxX, minY, maxY } = siteBBox
        const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2
        const totalW = Math.max(rw, rowW)
        const half = totalW / 2
        switch (side) {
            case 'north': return toIso(midX, minY - half, 1)
            case 'south': return toIso(midX, maxY + half, 1)
            case 'west': return toIso(minX - half, midY, 1)
            case 'east': return toIso(maxX + half, midY, 1)
            default: return { sx: 0, sy: 0 }
        }
    }

    const btnStyle = { background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }
    const cursorStyle = isOrbiting ? 'crosshair' : isPanning ? 'grabbing' : 'grab'

    const { minX: sMinX, maxX: sMaxX, minY: sMinY, maxY: sMaxY } = siteBBox
    const EXT = 30 // road extension beyond site edge

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
                style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.5), rgba(30,41,59,0.5))', cursor: cursorStyle, touchAction: 'none', userSelect: 'none' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onContextMenu={(e) => e.preventDefault()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
            >
                {/* Control panel */}
                <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
                    <button onClick={zoomIn} style={btnStyle} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Zoom in">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <button onClick={zoomOut} style={btnStyle} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Zoom out">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                    </button>
                    <button onClick={resetView} style={btnStyle} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Reset view">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    <div className="text-center text-[10px] text-white/40 font-medium">{Math.round(zoom * 100)}%</div>

                    {/* Divider */}
                    <div className="w-full border-t border-white/10 my-0.5" />

                    {/* Orbit left */}
                    <button onClick={orbitLeft} style={btnStyle} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Orbit left">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
                    </button>
                    {/* Auto-orbit toggle */}
                    <button onClick={() => setAutoOrbit(v => !v)} style={{ ...btnStyle, border: autoOrbit ? '1px solid rgba(99,102,241,0.6)' : btnStyle.border, background: autoOrbit ? 'rgba(99,102,241,0.25)' : btnStyle.background }} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors" title={autoOrbit ? 'Stop auto-orbit' : 'Auto-orbit'}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    {/* Orbit right */}
                    <button onClick={orbitRight} style={btnStyle} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors" title="Orbit right">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>

                    <div className="text-center text-[10px] text-indigo-300/50 font-medium">{Math.round(((orbitAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) * 180 / Math.PI)}°</div>
                </div>

                {/* Orbit hint label */}
                <div className="absolute bottom-3 left-3 z-10 text-[9px] text-white/25 pointer-events-none">
                    {autoOrbit ? '⟳ auto-orbiting — click ⟳ to stop' : 'Middle-drag to orbit · Left-drag to pan · Scroll to zoom · ◁▷ to step orbit'}
                </div>

                <svg viewBox={`${pan.x} ${pan.y} ${SVG_W / zoom} ${SVG_H / zoom}`} className="w-full h-auto" style={{ maxHeight: '680px' }}>
                    <defs>
                        <pattern id="isoGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
                        </pattern>
                        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="2" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.12" />
                        </filter>
                    </defs>

                    <rect width={SVG_W} height={SVG_H} fill="url(#isoGrid)" />

                    <g transform={`translate(${ORIGIN_X}, ${ORIGIN_Y})`}>

                        {/* ========== ROADS (use siteBBox for alignment) ========== */}

                        {/* North road — extends outward from sMinY */}
                        {roadDims.north && (() => {
                            const { width: rw, row: rowW, rawWidth, rawRow } = roadDims.north
                            return (
                                <g>
                                    {rowW > 0 && <polygon points={isoQuad(sMinX - EXT, sMinY - rowW, sMaxX + EXT, sMinY - rowW, sMaxX + EXT, sMinY, sMinX - EXT, sMinY, 0)} fill="#fef3c7" opacity="0.5" stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="4 2" />}
                                    {rw > 0 && <polygon points={isoQuad(sMinX - EXT, sMinY - rw, sMaxX + EXT, sMinY - rw, sMaxX + EXT, sMinY, sMinX - EXT, sMinY, 0.5)} fill="#64748b" opacity="0.35" stroke="#475569" strokeWidth="0.8" />}
                                    {rw > 4 && (() => { const mid = sMinY - rw / 2; const p1 = toIso(sMinX - EXT / 2, mid, 0.8), p2 = toIso(sMaxX + EXT / 2, mid, 0.8); return <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#fbbf24" strokeWidth="1" strokeDasharray="6 4" opacity="0.7" /> })()}
                                    {(() => { const pos = roadLabelPos('north', rw, rowW); return <text x={pos.sx} y={pos.sy - 6} textAnchor="middle" fill="#92400e" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">N — {rawWidth > 0 ? `${rawWidth}' road` : ''}{rawRow > 0 ? ` · ${rawRow}' ROW` : ''}</text> })()}
                                </g>
                            )
                        })()}

                        {/* South road — extends outward from sMaxY */}
                        {roadDims.south && (() => {
                            const { width: rw, row: rowW, rawWidth, rawRow } = roadDims.south
                            return (
                                <g>
                                    {rowW > 0 && <polygon points={isoQuad(sMinX - EXT, sMaxY, sMaxX + EXT, sMaxY, sMaxX + EXT, sMaxY + rowW, sMinX - EXT, sMaxY + rowW, 0)} fill="#fef3c7" opacity="0.5" stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="4 2" />}
                                    {rw > 0 && <polygon points={isoQuad(sMinX - EXT, sMaxY, sMaxX + EXT, sMaxY, sMaxX + EXT, sMaxY + rw, sMinX - EXT, sMaxY + rw, 0.5)} fill="#64748b" opacity="0.35" stroke="#475569" strokeWidth="0.8" />}
                                    {rw > 4 && (() => { const mid = sMaxY + rw / 2; const p1 = toIso(sMinX - EXT / 2, mid, 0.8), p2 = toIso(sMaxX + EXT / 2, mid, 0.8); return <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#fbbf24" strokeWidth="1" strokeDasharray="6 4" opacity="0.7" /> })()}
                                    {(() => { const pos = roadLabelPos('south', rw, rowW); return <text x={pos.sx} y={pos.sy + 12} textAnchor="middle" fill="#92400e" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">S — {rawWidth > 0 ? `${rawWidth}' road` : ''}{rawRow > 0 ? ` · ${rawRow}' ROW` : ''}</text> })()}
                                </g>
                            )
                        })()}

                        {/* West road — extends outward from sMinX */}
                        {roadDims.west && (() => {
                            const { width: rw, row: rowW, rawWidth, rawRow } = roadDims.west
                            return (
                                <g>
                                    {rowW > 0 && <polygon points={isoQuad(sMinX - rowW, sMinY - EXT, sMinX, sMinY - EXT, sMinX, sMaxY + EXT, sMinX - rowW, sMaxY + EXT, 0)} fill="#fef3c7" opacity="0.5" stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="4 2" />}
                                    {rw > 0 && <polygon points={isoQuad(sMinX - rw, sMinY - EXT, sMinX, sMinY - EXT, sMinX, sMaxY + EXT, sMinX - rw, sMaxY + EXT, 0.5)} fill="#64748b" opacity="0.35" stroke="#475569" strokeWidth="0.8" />}
                                    {rw > 4 && (() => { const mid = sMinX - rw / 2; const p1 = toIso(mid, sMinY - EXT / 2, 0.8), p2 = toIso(mid, sMaxY + EXT / 2, 0.8); return <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#fbbf24" strokeWidth="1" strokeDasharray="6 4" opacity="0.7" /> })()}
                                    {(() => { const pos = roadLabelPos('west', rw, rowW); return <text x={pos.sx - 8} y={pos.sy} textAnchor="end" fill="#92400e" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">W — {rawWidth > 0 ? `${rawWidth}'` : ''}{rawRow > 0 ? ` · ${rawRow}' ROW` : ''}</text> })()}
                                </g>
                            )
                        })()}

                        {/* East road — extends outward from sMaxX */}
                        {roadDims.east && (() => {
                            const { width: rw, row: rowW, rawWidth, rawRow } = roadDims.east
                            return (
                                <g>
                                    {rowW > 0 && <polygon points={isoQuad(sMaxX, sMinY - EXT, sMaxX + rowW, sMinY - EXT, sMaxX + rowW, sMaxY + EXT, sMaxX, sMaxY + EXT, 0)} fill="#fef3c7" opacity="0.5" stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="4 2" />}
                                    {rw > 0 && <polygon points={isoQuad(sMaxX, sMinY - EXT, sMaxX + rw, sMinY - EXT, sMaxX + rw, sMaxY + EXT, sMaxX, sMaxY + EXT, 0.5)} fill="#64748b" opacity="0.35" stroke="#475569" strokeWidth="0.8" />}
                                    {rw > 4 && (() => { const mid = sMaxX + rw / 2; const p1 = toIso(mid, sMinY - EXT / 2, 0.8), p2 = toIso(mid, sMaxY + EXT / 2, 0.8); return <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#fbbf24" strokeWidth="1" strokeDasharray="6 4" opacity="0.7" /> })()}
                                    {(() => { const pos = roadLabelPos('east', rw, rowW); return <text x={pos.sx + 8} y={pos.sy} textAnchor="start" fill="#92400e" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">E — {rawWidth > 0 ? `${rawWidth}'` : ''}{rawRow > 0 ? ` · ${rawRow}' ROW` : ''}</text> })()}
                                </g>
                            )
                        })()}

                        {/* Ground shadow */}
                        {renderPolyTop(baseSitePolygon, 0, "#cbd5e1", "none", "0", "0.3")}

                        {/* Site slab */}
                        {renderPolySides(baseSitePolygon, 0, SITE_H, "#cbd5e1", "#b0bec5")}
                        {renderPolyTop(baseSitePolygon, SITE_H, "#e2e8f0", "#94a3b8", "1", "1", 'none', "url(#dropShadow)")}

                        {/* Site label */}
                        {(() => {
                            const c = topCenter(baseSitePolygon, 0, SITE_H)
                            return <text x={c.sx} y={c.sy + 2} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">SITE {siteArea > 0 ? `— ${siteArea.toLocaleString()} sq ft` : 'AREA'}</text>
                        })()}

                        {/* ========== Setbacks ========== */}
                        {(() => {
                            function rowInset(side) {
                                const r = roads?.[side]
                                if (!r || !r.enabled) return 0
                                const rw = parseFloat(r.width) || 0
                                const rowTotal = parseFloat(r.row) || 0
                                return Math.max(0, rowTotal / 2 - rw / 2) * ROAD_SCALE
                            }
                            const front = (parseFloat(setbacks?.front) || 0) * ROAD_SCALE + rowInset('south')
                            const back = (parseFloat(setbacks?.back) || 0) * ROAD_SCALE + rowInset('north')
                            const left = (parseFloat(setbacks?.left) || 0) * ROAD_SCALE + rowInset('west')
                            const right = (parseFloat(setbacks?.right) || 0) * ROAD_SCALE + rowInset('east')

                            if (front <= 0 && back <= 0 && left <= 0 && right <= 0) return null

                            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
                            baseSitePolygon.forEach(p => { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y })
                            const W = maxX - minX, H = maxY - minY
                            const sL = Math.min(left, W / 2 - 1), sR = Math.min(right, W / 2 - 1)
                            const sF = Math.min(front, H / 2 - 1), sB = Math.min(back, H / 2 - 1)
                            const scX = (W - sL - sR) / W, scY = (H - sF - sB) / H
                            const c = getCentroid(baseSitePolygon)
                            const sbPoly = baseSitePolygon.map(p => ({
                                x: c.x - (sL - sR) / 2 + (p.x - c.x) * scX,
                                y: c.y - (sF - sB) / 2 + (p.y - c.y) * scY
                            }))
                            return renderPolyTop(sbPoly, SITE_H + 0.5, "none", "rgba(239, 68, 68, 0.9)", "2", "0.9", "8 4")
                        })()}

                        {/* Coverage outline */}
                        {siteArea > 0 && (() => {
                            const c = getCentroid(baseSitePolygon)
                            const covPoly = baseSitePolygon.map(p => ({ x: c.x + (p.x - c.x) * coverageFactor, y: c.y + (p.y - c.y) * coverageFactor }))
                            return renderPolyTop(covPoly, SITE_H, "none", isCoverageCompliant ? '#10b981' : '#ef4444', "1.5", "0.8", "6 3")
                        })()}

                        {/* Coverage % label */}
                        {siteArea > 0 && (() => {
                            const c = getCentroid(baseSitePolygon)
                            let rx = { x: -Infinity, y: 0 }
                            baseSitePolygon.forEach(p => { const sx = c.x + (p.x - c.x) * coverageFactor, sy = c.y + (p.y - c.y) * coverageFactor; if (sx > rx.x) rx = { x: sx, y: sy } })
                            const pt = toIso(rx.x + 8, rx.y, SITE_H)
                            return <text x={pt.sx} y={pt.sy} fill={isCoverageCompliant ? '#10b981' : '#ef4444'} fontSize="9" fontWeight="700" fontFamily="Inter, sans-serif">{Math.round(maxCoverage * 100)}% MAX</text>
                        })()}

                        {/* ========== Floor blocks ========== */}
                        {blocks.map((block) => {
                            const { poly, bz, bh, palette, id, index, areaNum, drawIndex } = block
                            const center = topCenter(poly, bz, bh)
                            let fv = poly[0], maxSy = -Infinity
                            poly.forEach(v => { const p = toIso(v.x, v.y, bz); if (p.sy > maxSy) { maxSy = p.sy; fv = v } })
                            const bot = toIso(fv.x, fv.y, bz), top = toIso(fv.x, fv.y, bz + bh)
                            return (
                                <g key={id} className="stack-block" style={{ animationDelay: `${drawIndex * 0.1}s` }}>
                                    {renderPolySides(poly, bz, bh, palette.left, palette.right)}
                                    {renderPolyTop(poly, bz + bh, palette.top, palette.top, "0.5", "0.95")}
                                    <text x={center.sx} y={center.sy + 1} textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">
                                        {index === 0 ? 'GF' : `F${index}`} — {areaNum.toLocaleString()} sq ft
                                    </text>
                                    <line x1={bot.sx} y1={bot.sy} x2={top.sx} y2={top.sy} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                                </g>
                            )
                        })}

                        {/* Height dimension */}
                        {siteArea > 0 && blocks.length > 0 && (() => {
                            const totalH = SITE_H + blocks.length * (FLOOR_H + FLOOR_GAP)
                            const br = toIso(sMaxX + 15, sMaxY, 0), tr = toIso(sMaxX + 15, sMaxY, totalH)
                            return (
                                <g opacity="0.6">
                                    <line x1={br.sx} y1={br.sy} x2={tr.sx} y2={tr.sy} stroke="#64748b" strokeWidth="0.8" strokeDasharray="3 2" />
                                    <text x={(br.sx + tr.sx) / 2 + 8} y={(br.sy + tr.sy) / 2} fill="#64748b" fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif">{blocks.length} {blocks.length === 1 ? 'Floor' : 'Floors'}</text>
                                </g>
                            )
                        })()}

                        {/* Compass */}
                        {(() => {
                            const cp = toIso(sMinX - 30, sMinY - 30, 0)
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
                        <text x={SVG_W / 2} y={SVG_H / 2 - 40} textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="500" fontFamily="Inter, sans-serif">
                            Enter site area and add floors to see the isometric view
                        </text>
                    )}
                </svg>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-white/45">
                <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded-sm" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }} /><span>Floor Block</span></div>
                <div className="flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-emerald-500 inline-block" /><span>Coverage Limit</span></div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded-sm" style={{ background: 'linear-gradient(135deg, #f87171, #dc2626)' }} /><span>Non-compliant</span></div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded-sm bg-slate-200 border border-slate-300" /><span>Site Platform</span></div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded-sm bg-slate-400/40 border border-slate-500/50" /><span>Road</span></div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded-sm bg-amber-100 border border-amber-400" /><span>ROW</span></div>
                <div className="flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-red-500 inline-block" /><span>Setback</span></div>
            </div>
        </div>
    )
}

export default memo(Visualizer)
