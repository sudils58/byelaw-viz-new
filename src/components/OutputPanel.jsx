import { memo } from 'react'

function MetricCard({ label, value, unit, status, description }) {
    const isCompliant = status === 'compliant'
    const isExceeded = status === 'exceeded'

    const valueColor = isCompliant
        ? 'text-emerald-400'
        : isExceeded
            ? 'text-red-400'
            : 'text-white'

    const glowBorder = isCompliant
        ? 'border-l-emerald-400 shadow-[inset_3px_0_8px_-4px_rgba(16,185,129,0.3)]'
        : isExceeded
            ? 'border-l-red-400 shadow-[inset_3px_0_8px_-4px_rgba(239,68,68,0.3)]'
            : ''

    return (
        <div className={`metric-card glass-card p-5 ${status ? 'border-l-4 ' + glowBorder : ''}`}>
            <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">{label}</p>
                {status && (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isCompliant ? 'status-pill-compliant' : 'status-pill-exceeded'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isCompliant ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                        {isCompliant ? 'Compliant' : 'Exceeded'}
                    </span>
                )}
            </div>
            <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-extrabold tracking-tight ${valueColor}`}>{value}</span>
                <span className="text-sm font-medium text-white/35">{unit}</span>
            </div>
            {description && (
                <p className="text-xs text-white/35 mt-2">{description}</p>
            )}
        </div>
    )
}

function OutputPanel({ siteArea, totalAllowable, maxGroundFloor, currentCoverage, currentFAR, remaining, isCoverageCompliant, isFARCompliant, totalFloorArea, maxFAR, maxCoveragePercent }) {

    const formatNumber = (num) => {
        if (num === 0 || isNaN(num)) return '0'
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
    }

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Compliance Metrics</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <MetricCard
                    label="Total Allowable Built-up"
                    value={formatNumber(totalAllowable)}
                    unit="sq ft"
                    description={`Site Area × ${maxFAR} FAR`}
                />
                <MetricCard
                    label="Max Ground Floor Area"
                    value={formatNumber(maxGroundFloor)}
                    unit="sq ft"
                    description={`Site Area × ${maxCoveragePercent}% Coverage`}
                />
                <MetricCard
                    label="Current Ground Coverage"
                    value={siteArea > 0 ? formatNumber(currentCoverage) : '—'}
                    unit={siteArea > 0 ? '%' : ''}
                    status={siteArea > 0 && totalFloorArea > 0 ? (isCoverageCompliant ? 'compliant' : 'exceeded') : null}
                    description={`Limit: ${maxCoveragePercent}%`}
                />
                <MetricCard
                    label="Current FAR"
                    value={siteArea > 0 ? formatNumber(currentFAR) : '—'}
                    unit=""
                    status={siteArea > 0 && totalFloorArea > 0 ? (isFARCompliant ? 'compliant' : 'exceeded') : null}
                    description={`Limit: ${maxFAR}`}
                />
                <MetricCard
                    label="Total Built-up Area"
                    value={formatNumber(totalFloorArea)}
                    unit="sq ft"
                    description="Sum of all floor areas"
                />
                <MetricCard
                    label="Remaining Buildable"
                    value={siteArea > 0 ? formatNumber(remaining) : '—'}
                    unit={siteArea > 0 ? 'sq ft' : ''}
                    status={siteArea > 0 && totalFloorArea > 0 ? (remaining >= 0 ? 'compliant' : 'exceeded') : null}
                    description="Allowable − Total Built-up"
                />
            </div>
        </div>
    )
}

export default memo(OutputPanel)
