export default function Resources({ theme }) {
    const resources = [
        {
            title: 'National Building Code (NBC) 2081',
            desc: 'The official updated structural and architectural guidelines mandated by the Nepal Government.',
            type: 'PDF Document',
            size: '4.2 MB'
        },
        {
            title: 'Kathmandu Valley Building By-Laws',
            desc: 'Specific zoning, FAR, ground coverage, and setback regulations for the Kathmandu Valley.',
            type: 'PDF Document',
            size: '2.8 MB'
        },
        {
            title: 'Seismic Design Guidelines',
            desc: 'Mandatory earthquake-resistant design requirements for residential and commercial structures.',
            type: 'Technical PDF',
            size: '5.1 MB'
        },
        {
            title: 'Standard Architectural Checklists',
            desc: 'A checklist of required drawings (Site Plan, Floor Plans, Elevations) for swift municipality approval.',
            type: 'PDF / Excel',
            size: '1.2 MB'
        }
    ];

    return (
        <section id="resources" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 w-full mb-12">
            <div className="mb-10 flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center p-3 mb-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    Official Resources & Downloads
                </h2>
                <p className="max-w-2xl mx-auto text-lg text-indigo-100/80 leading-relaxed font-medium">
                    Access critical legal documents, technical guidelines, and standardized municipal forms to ensure your project is compliant.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resources.map((res, idx) => (
                    <div key={idx} className="glass-card group flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 hover:bg-white/5 transition-all duration-300">
                        <div className="flex-1 mb-4 sm:mb-0 sm:pr-6">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">
                                    {res.type}
                                </span>
                                <span className="text-xs font-semibold text-slate-400">{res.size}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                                {res.title}
                            </h3>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {res.desc}
                            </p>
                        </div>
                        <button className="flex-shrink-0 w-full sm:w-auto glass-btn px-6 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 group-hover:scale-105 transition-transform duration-300">
                            Download
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
