import { useState, useCallback, useEffect } from 'react'
import InputPanel from './components/InputPanel'
import OutputPanel from './components/OutputPanel'
import Visualizer from './components/Visualizer'
import Navigation from './components/Navigation'
import { parseSiteBoundaryFromDXF, calculatePolygonArea } from './utils/dxfUtils'
import { ErrorBoundary } from './ErrorBoundary'

const DEFAULT_ROADS = {
    north: { enabled: false, width: '', row: '' },
    south: { enabled: false, width: '', row: '' },
    east: { enabled: false, width: '', row: '' },
    west: { enabled: false, width: '', row: '' },
}

const DEFAULT_SETBACKS = {
    front: '',
    back: '',
    left: '',
    right: ''
}

const PREDEFINED_BYLAWS = {
    kathmandu: {
        maxFAR: '3.5',
        maxCoverage: '60',
        maxHeight: '45',
        setbacks: { front: '5', back: '5', left: '5', right: '5' },
        roadWidth: '13'
    },
    lalitpur: {
        maxFAR: '3.0',
        maxCoverage: '60',
        maxHeight: '45',
        setbacks: { front: '5', back: '5', left: '5', right: '5' },
        roadWidth: '13'
    },
    bhaktapur: {
        maxFAR: '3.0',
        maxCoverage: '60',
        maxHeight: '45',
        setbacks: { front: '5', back: '5', left: '5', right: '5' },
        roadWidth: '13'
    }
}

export default function App() {
    const [siteArea, setSiteArea] = useState('')
    const [location, setLocation] = useState('custom')
    const [floors, setFloors] = useState([])
    const [maxFAR, setMaxFAR] = useState('3.0')
    const [maxCoverage, setMaxCoverage] = useState('40')
    const [maxHeight, setMaxHeight] = useState('45')
    const [roads, setRoads] = useState(DEFAULT_ROADS)
    const [theme, setTheme] = useState('dark')
    const [sitePolygon, setSitePolygon] = useState(null)
    const [dxfError, setDxfError] = useState(null)
    const [dxfUnit, setDxfUnit] = useState('inches') // 'inches' or 'feet'
    const [setbacks, setSetbacks] = useState(DEFAULT_SETBACKS)

    useEffect(() => {
        if (theme === 'light') {
            document.body.classList.add('light-theme')
        } else {
            document.body.classList.remove('light-theme')
        }
    }, [theme])

    const siteAreaNum = parseFloat(siteArea) || 0
    const farNum = parseFloat(maxFAR) || 0
    const coverageNum = (parseFloat(maxCoverage) || 0) / 100

    const totalFloorArea = floors.reduce((sum, f) => sum + (parseFloat(f.area) || 0), 0)
    const groundFloorArea = floors.length > 0 ? (parseFloat(floors[0].area) || 0) : 0

    const totalAllowable = siteAreaNum * farNum
    const maxGroundFloor = siteAreaNum * coverageNum
    const currentCoverage = siteAreaNum > 0 ? (groundFloorArea / siteAreaNum) * 100 : 0
    const currentFAR = siteAreaNum > 0 ? totalFloorArea / siteAreaNum : 0
    const remaining = totalAllowable - totalFloorArea

    const isCoverageCompliant = currentCoverage <= (parseFloat(maxCoverage) || 0)
    const isFARCompliant = currentFAR <= farNum

    const addFloor = useCallback(() => {
        setFloors(prev => [...prev, { id: Date.now(), area: '' }])
    }, [])

    const removeFloor = useCallback((id) => {
        setFloors(prev => prev.filter(f => f.id !== id))
    }, [])

    const duplicateFloor = useCallback((id) => {
        setFloors(prev => {
            const index = prev.findIndex(f => f.id === id)
            if (index === -1) return prev
            const newFloor = { id: Date.now(), area: prev[index].area }
            const newFloors = [...prev]
            newFloors.splice(index + 1, 0, newFloor)
            return newFloors
        })
    }, [])

    const updateFloorArea = useCallback((id, area) => {
        setFloors(prev => prev.map(f => f.id === id ? { ...f, area } : f))
    }, [])

    const updateRoad = useCallback((side, field, value) => {
        setRoads(prev => ({
            ...prev,
            [side]: { ...prev[side], [field]: value }
        }))
    }, [])

    const updateSetback = useCallback((side, value) => {
        setSetbacks(prev => ({
            ...prev,
            [side]: value
        }))
    }, [])

    const toggleRoad = useCallback((side) => {
        setRoads(prev => {
            const isNowEnabled = !prev[side].enabled;
            let newWidth = prev[side].width;
            if (isNowEnabled && location !== 'custom') {
                newWidth = PREDEFINED_BYLAWS[location].roadWidth;
            }
            return {
                ...prev,
                [side]: { ...prev[side], enabled: isNowEnabled, width: newWidth }
            };
        })
    }, [location])

    const handleLocationChange = useCallback((newLocation) => {
        setLocation(newLocation)
        if (newLocation !== 'custom') {
            const bylaws = PREDEFINED_BYLAWS[newLocation]
            setMaxFAR(bylaws.maxFAR)
            setMaxCoverage(bylaws.maxCoverage)
            setMaxHeight(bylaws.maxHeight)
            setSetbacks(bylaws.setbacks)

            setRoads(prev => {
                const newRoads = { ...prev }
                Object.keys(newRoads).forEach(side => {
                    if (newRoads[side].enabled) {
                        newRoads[side] = { ...newRoads[side], width: bylaws.roadWidth }
                    }
                })
                return newRoads
            })
        }
    }, [])

    const handleDXFUpload = useCallback(async (file) => {
        try {
            setDxfError(null)
            const text = await file.text()
            let polygon = parseSiteBoundaryFromDXF(text)

            // If the DXF is drawn in inches, we need to divide all coordinates by 12 
            // so the resulting polygon area (Shoelace) and visual scale is in exact SQ FT.
            if (dxfUnit === 'inches') {
                polygon = polygon.map(p => ({
                    x: p.x / 12,
                    y: p.y / 12
                }))
            }

            setSitePolygon(polygon)
            // Shoelace formula gives exact raw area based on scaled coordinates
            const area = calculatePolygonArea(polygon)
            setSiteArea(area.toFixed(2).toString())
        } catch (err) {
            setDxfError(err.message)
            setSitePolygon(null)
        }
    }, [dxfUnit])

    return (
        <div className="min-h-screen glass-bg">
            <Navigation theme={theme} setTheme={setTheme} />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28 relative z-10">
                {/* Zone Info Banner — now editable */}
                <div className="mb-8 glass-banner rounded-2xl p-6 text-white">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold mb-1">Parameters</h2>
                            <p className="text-indigo-200/70 text-sm">Editable below</p>
                        </div>
                        <div className="flex gap-6">
                            <div className="text-center">
                                <input
                                    id="max-far-input"
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={maxFAR}
                                    onChange={(e) => setMaxFAR(e.target.value)}
                                    disabled={location !== 'custom'}
                                    className={`w-20 text-3xl font-extrabold text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20 ${location !== 'custom' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                />
                                <div className="text-xs text-indigo-200/70 uppercase tracking-wider font-medium mt-1">Max FAR</div>
                            </div>
                            <div className="w-px bg-white/15"></div>
                            <div className="text-center">
                                <div className="flex items-baseline justify-center gap-0.5">
                                    <input
                                        id="max-coverage-input"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={maxCoverage}
                                        onChange={(e) => setMaxCoverage(e.target.value)}
                                        disabled={location !== 'custom'}
                                        className={`w-20 text-3xl font-extrabold text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20 ${location !== 'custom' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    />
                                    <span className="text-xl font-bold text-white/70">%</span>
                                </div>
                                <div className="text-xs text-indigo-200/70 uppercase tracking-wider font-medium mt-1">Max Coverage</div>
                            </div>
                            <div className="w-px bg-white/15"></div>
                            <div className="text-center">
                                <div className="flex items-baseline justify-center gap-0.5">
                                    <input
                                        id="max-height-input"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={maxHeight}
                                        onChange={(e) => setMaxHeight(e.target.value)}
                                        disabled={location !== 'custom'}
                                        className={`w-20 text-3xl font-extrabold text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20 ${location !== 'custom' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    />
                                    <span className="text-xl font-bold text-white/70">ft</span>
                                </div>
                                <div className="text-xs text-indigo-200/70 uppercase tracking-wider font-medium mt-1">Max Height</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Input */}
                    <div className="lg:col-span-4">
                        <InputPanel
                            location={location}
                            onLocationChange={handleLocationChange}
                            siteArea={siteArea}
                            onSiteAreaChange={setSiteArea}
                            floors={floors}
                            onAddFloor={addFloor}
                            onRemoveFloor={removeFloor}
                            onDuplicateFloor={duplicateFloor}
                            onUpdateFloorArea={updateFloorArea}
                            roads={roads}
                            onToggleRoad={toggleRoad}
                            onUpdateRoad={updateRoad}
                            setbacks={setbacks}
                            onUpdateSetback={updateSetback}
                            onDXFUpload={handleDXFUpload}
                            dxfError={dxfError}
                            dxfUnit={dxfUnit}
                            onDxfUnitChange={setDxfUnit}
                        />
                    </div>

                    {/* Right Column - Output + Visualizer */}
                    <div className="lg:col-span-8 space-y-8">
                        <OutputPanel
                            siteArea={siteAreaNum}
                            totalAllowable={totalAllowable}
                            maxGroundFloor={maxGroundFloor}
                            currentCoverage={currentCoverage}
                            currentFAR={currentFAR}
                            remaining={remaining}
                            isCoverageCompliant={isCoverageCompliant}
                            isFARCompliant={isFARCompliant}
                            totalFloorArea={totalFloorArea}
                            maxFAR={farNum}
                            maxCoveragePercent={parseFloat(maxCoverage) || 0}
                        />
                        <ErrorBoundary>
                            <Visualizer
                                siteArea={siteAreaNum}
                                floors={floors}
                                maxCoverage={coverageNum}
                                isCoverageCompliant={isCoverageCompliant}
                                isFARCompliant={isFARCompliant}
                                roads={roads}
                                setbacks={setbacks}
                                sitePolygon={sitePolygon}
                            />
                        </ErrorBoundary>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-12 relative z-10" style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <p className="text-white/45 text-sm font-medium text-center">
                        KMC Building Compliance Tool — Hikari Architects
                    </p>
                </div>
            </footer>
        </div>
    )
}
