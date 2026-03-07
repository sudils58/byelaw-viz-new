export default function PermitGuide() {
    const steps = [
        {
            phase: 'Phase 1: Preparation',
            title: 'File the Application',
            desc: 'Submit land ownership documents, citizenship certificates, land revenue receipts, and basic architectural sketches to the municipal office.',
            icon: (
                <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
            )
        },
        {
            phase: 'Phase 2: Review',
            title: 'Technical Scrutiny',
            desc: 'The municipality engineers evaluate the structural blueprints against the National Building Code (NBC) 2081 requirements.',
            icon: (
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
            )
        },
        {
            phase: 'Phase 3: Public Notice',
            title: '15-Day Public Notice',
            desc: 'A formal legal notice is issued to neighbors. If no objections arise concerning land boundaries, the permit moves to final approval.',
            icon: (
                <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )
        },
        {
            phase: 'Phase 4: Construction',
            title: 'Plinth Level Permit',
            desc: 'Approval is granted to build up to the DPC (Plinth) level. Engineers typically conduct a site inspection upon completion of this stage.',
            icon: (
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                </svg>
            )
        },
        {
            phase: 'Phase 5: Superstructure',
            title: 'Superstructure Permit',
            desc: 'Granted after successful Plinth inspection. Allows construction of the remaining floors as per the initially passed blueprints.',
            icon: (
                <svg className="w-8 h-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
            )
        },
        {
            phase: 'Phase 6: Completion',
            title: 'Building Completion Certificate',
            desc: 'Final inspection confirms the building matches the approved designs. Certificate (Nirman Sampanna) is issued to apply for utilities and bank loans.',
            icon: (
                <svg className="w-8 h-8 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
            )
        }
    ];

    return (
        <section id="guide" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 w-full">
            <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    Local Building Permit Process
                </h2>
                <p className="max-w-3xl mx-auto text-lg text-indigo-100/80 leading-relaxed font-medium">
                    A step-by-step roadmap to legally securing municipal design approvals and construction clearance under the National Building Code.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {steps.map((step, idx) => (
                    <div key={idx} className="glass-card p-8 hover:bg-white/5 transition-all duration-300 group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                {step.icon}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-1">{step.phase}</h4>
                                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                            </div>
                        </div>
                        <p className="text-base text-slate-300 leading-relaxed">
                            {step.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    )
}
