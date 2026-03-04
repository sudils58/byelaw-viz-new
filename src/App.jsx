import { useState, useCallback } from 'react'
import InputPanel from './components/InputPanel'
import OutputPanel from './components/OutputPanel'
import Visualizer from './components/Visualizer'

const DEFAULT_ROADS = {
    north: { enabled: false, width: '', row: '' },
    south: { enabled: false, width: '', row: '' },
    east: { enabled: false, width: '', row: '' },
    west: { enabled: false, width: '', row: '' },
}

export default function App() {
    const [siteArea, setSiteArea] = useState('')
    const [floors, setFloors] = useState([])
    const [maxFAR, setMaxFAR] = useState('3.0')
    const [maxCoverage, setMaxCoverage] = useState('40')
    const [roads, setRoads] = useState(DEFAULT_ROADS)

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

    const updateFloorArea = useCallback((id, area) => {
        setFloors(prev => prev.map(f => f.id === id ? { ...f, area } : f))
    }, [])

    const updateRoad = useCallback((side, field, value) => {
        setRoads(prev => ({
            ...prev,
            [side]: { ...prev[side], [field]: value }
        }))
    }, [])

    const toggleRoad = useCallback((side) => {
        setRoads(prev => ({
            ...prev,
            [side]: { ...prev[side], enabled: !prev[side].enabled }
        }))
    }, [])

    return (
        <div className="min-h-screen glass-bg">
            {/* Header */}
            <header className="glass-header sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white tracking-tight">
                                        KMC Building Compliance Calculator
                                    </h1>
                                    <p className="text-xs text-white/50 font-medium">
                                        Kathmandu Metropolitan City Building Standards, 2080
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="hidden sm:block text-right">
                            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                                Finance & Trade Center (NEPSE)
                            </p>
                            <p className="text-xs text-white/40">Singha Durbar Plaza</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                {/* Zone Info Banner — now editable */}
                <div className="mb-8 glass-banner rounded-2xl p-6 text-white">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold mb-1">Institutional Zone — Parameters</h2>
                            <p className="text-indigo-200/70 text-sm">Applicable for plots greater than 8 Anna · Editable below</p>
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
                                    className="w-20 text-3xl font-extrabold text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20"
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
                                        className="w-20 text-3xl font-extrabold text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20"
                                    />
                                    <span className="text-xl font-bold text-white/70">%</span>
                                </div>
                                <div className="text-xs text-indigo-200/70 uppercase tracking-wider font-medium mt-1">Max Coverage</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Input */}
                    <div className="lg:col-span-4">
                        <InputPanel
                            siteArea={siteArea}
                            onSiteAreaChange={setSiteArea}
                            floors={floors}
                            onAddFloor={addFloor}
                            onRemoveFloor={removeFloor}
                            onUpdateFloorArea={updateFloorArea}
                            roads={roads}
                            onToggleRoad={toggleRoad}
                            onUpdateRoad={updateRoad}
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
                        <Visualizer
                            siteArea={siteAreaNum}
                            floors={floors}
                            maxCoverage={coverageNum}
                            isCoverageCompliant={isCoverageCompliant}
                            isFARCompliant={isFARCompliant}
                            roads={roads}
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-12 relative z-10" style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <p className="text-white/45 text-sm font-medium">
                        KMC Building Compliance Tool — Hikari Architects
                    </p>
                </div>
            </footer>
        </div>
    )
}
