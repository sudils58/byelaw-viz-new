import { memo } from 'react'

const ANNA_TO_SQFT = 342.25

const ROAD_SIDES = [
    { key: 'north', label: 'North', icon: '↑' },
    { key: 'east', label: 'East', icon: '→' },
    { key: 'south', label: 'South', icon: '↓' },
    { key: 'west', label: 'West', icon: '←' },
]

function InputPanel({ siteArea, onSiteAreaChange, floors, onAddFloor, onRemoveFloor, onUpdateFloorArea, roads, onToggleRoad, onUpdateRoad, onDXFUpload, dxfError }) {
    const annaEquivalent = siteArea ? (parseFloat(siteArea) / ANNA_TO_SQFT).toFixed(2) : '0.00'

    return (
        <div className="space-y-6">
            {/* Site Area Card */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Site Area</h3>
                </div>

                <div className="relative">
                    <input
                        id="site-area-input"
                        type="number"
                        min="0"
                        value={siteArea}
                        onChange={(e) => onSiteAreaChange(e.target.value)}
                        placeholder="Enter site area"
                        className="glass-input w-full px-4 py-3 pr-16 text-lg font-semibold"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-white/40">sq ft</span>
                </div>

                {/* DXF Upload */}
                <div className="mt-4">
                    <label className="flex items-center justify-center w-full h-16 px-4 transition bg-white/5 border-2 border-white/10 border-dashed rounded-xl appearance-none cursor-pointer hover:border-indigo-400/50 hover:bg-white/10">
                        <span className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="font-medium text-white/50 text-sm">Upload DXF CAD file</span>
                        </span>
                        <input type="file" name="file_upload" className="hidden" accept=".dxf" onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                onDXFUpload(e.target.files[0])
                            }
                            // Reset input value so the same file can be uploaded again if needed
                            e.target.value = null
                        }} />
                    </label>
                    {dxfError && (
                        <p className="mt-2 text-xs text-red-400 font-medium">{dxfError}</p>
                    )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-white/35 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        1 Anna = 342.25 sq ft
                    </p>
                    <p className="text-xs font-medium text-indigo-400">
                        ≈ {annaEquivalent} Anna
                    </p>
                </div>
            </div>

            {/* Road Configuration Card */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Adjacent Roads</h3>
                </div>

                <div className="space-y-3">
                    {ROAD_SIDES.map(({ key, label, icon }) => {
                        const road = roads[key]
                        return (
                            <div key={key} className="rounded-xl border border-white/10 overflow-hidden transition-all">
                                {/* Toggle header */}
                                <button
                                    id={`road-toggle-${key}`}
                                    onClick={() => onToggleRoad(key)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${road.enabled
                                        ? 'bg-amber-500/15 text-amber-300'
                                        : 'bg-white/5 text-white/50 hover:bg-white/8'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">{icon}</span>
                                        <span>{label}</span>
                                    </div>
                                    <div className={`w-9 h-5 rounded-full relative transition-colors ${road.enabled ? 'bg-amber-500/70' : 'bg-white/15'
                                        }`}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${road.enabled ? 'translate-x-4' : 'translate-x-0.5'
                                            }`} />
                                    </div>
                                </button>

                                {/* Expandable inputs */}
                                {road.enabled && (
                                    <div className="px-4 py-3 bg-white/5 border-t border-white/8 grid grid-cols-2 gap-3 floor-row">
                                        <div>
                                            <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1 block">
                                                Road Width
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id={`road-width-${key}`}
                                                    type="number"
                                                    min="0"
                                                    value={road.width}
                                                    onChange={(e) => onUpdateRoad(key, 'width', e.target.value)}
                                                    placeholder="0"
                                                    className="glass-input w-full px-3 py-2 pr-9 text-sm font-medium"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/35">ft</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1 block">
                                                ROW
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id={`road-row-${key}`}
                                                    type="number"
                                                    min="0"
                                                    value={road.row}
                                                    onChange={(e) => onUpdateRoad(key, 'row', e.target.value)}
                                                    placeholder="0"
                                                    className="glass-input w-full px-3 py-2 pr-9 text-sm font-medium"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/35">ft</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Floors Card */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Floors</h3>
                    </div>
                    <span className="text-xs font-medium text-white/35 bg-white/8 px-2 py-1 rounded-full">
                        {floors.length} {floors.length === 1 ? 'floor' : 'floors'}
                    </span>
                </div>

                {/* Floor List */}
                <div className="space-y-3 mb-4 max-h-[360px] overflow-y-auto pr-1">
                    {floors.map((floor, index) => (
                        <div
                            key={floor.id}
                            className="floor-row flex items-center gap-3 group"
                        >
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                style={{
                                    background: `hsla(${220 + index * 15}, 70%, 60%, 0.2)`,
                                    color: `hsl(${220 + index * 15}, 80%, 75%)`
                                }}
                            >
                                {index === 0 ? 'G' : `${index}`}
                            </div>
                            <div className="relative flex-1">
                                <input
                                    id={`floor-area-${index}`}
                                    type="number"
                                    min="0"
                                    value={floor.area}
                                    onChange={(e) => onUpdateFloorArea(floor.id, e.target.value)}
                                    placeholder={index === 0 ? 'Ground floor area' : `Floor ${index} area`}
                                    className="glass-input w-full px-3 py-2.5 pr-14 text-sm font-medium"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/35">sq ft</span>
                            </div>
                            <button
                                id={`remove-floor-${index}`}
                                onClick={() => onRemoveFloor(floor.id)}
                                className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}

                    {floors.length === 0 && (
                        <div className="text-center py-8 text-white/25">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <p className="text-sm font-medium">No floors added yet</p>
                            <p className="text-xs mt-1">Click "+ Add Floor" to begin</p>
                        </div>
                    )}
                </div>

                {/* Add Floor Button */}
                <button
                    id="add-floor-btn"
                    onClick={onAddFloor}
                    className="glass-btn w-full py-3 px-4 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Floor
                </button>
            </div>
        </div>
    )
}

export default memo(InputPanel)
