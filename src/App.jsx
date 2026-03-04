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
                                <div className="w-12 h-12 flex items-center justify-center drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]">
                                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                        <g stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinejoin="round">
                                            {/* Back Center Building */}
                                            <polygon points="50,15 75,25 50,35 25,25" fill="#2dd4bf" />
                                            <polygon points="25,25 50,35 50,70 25,60" fill="#14b8a6" />
                                            <polygon points="50,35 75,25 75,60 50,70" fill="#0d9488" />

                                            {/* Front Left Building */}
                                            <polygon points="25,50 45,60 25,70 5,60" fill="#2dd4bf" />
                                            <polygon points="5,60 25,70 25,90 5,80" fill="#14b8a6" />
                                            <polygon points="25,70 45,60 45,80 25,90" fill="#0d9488" />

                                            {/* Front Right Building */}
                                            <polygon points="75,50 95,60 75,70 55,60" fill="#2dd4bf" />
                                            <polygon points="55,60 75,70 75,90 55,80" fill="#14b8a6" />
                                            <polygon points="75,70 95,60 95,80 75,90" fill="#0d9488" />
                                        </g>

                                        {/* Checkmark */}
                                        <path d="M 35,55 L 55,75 L 85,30" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M 35,55 L 55,75 L 85,30" stroke="#bae6fd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white tracking-tight">
                                        Building Bye Laws Compliance Calculator
                                    </h1>
                                </div>
                            </div>
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
