import { useRef, useEffect } from 'react';

export default function Navigation({ theme, setTheme }) {
    const navRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!navRef.current) return;
            // Get center position of the navigation bar
            const rect = navRef.current.getBoundingClientRect();
            const navCenterX = rect.left + rect.width / 2;
            const navCenterY = rect.top + rect.height / 2;

            // Calculate distance between mouse and nav center
            const deltaX = e.clientX - navCenterX;
            const deltaY = e.clientY - navCenterY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // Nudge radius and maximum displacement
            const triggerRadius = 400;
            const maxDisplacement = 12;

            if (distance < triggerRadius) {
                // Easing factor (closer = stronger nudge)
                const factor = Math.pow((triggerRadius - distance) / triggerRadius, 2);

                // Move nav slightly *towards* the cursor for an attractive magnetic feel
                const moveX = (deltaX / distance) * maxDisplacement * factor;
                const moveY = (deltaY / distance) * maxDisplacement * factor;

                navRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
            } else {
                navRef.current.style.transform = `translate(0px, 0px)`;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <header className="fixed top-6 left-0 right-0 z-50 pointer-events-none px-4 flex justify-center">
            {/* The actual floating bar */}
            <div
                ref={navRef}
                className="pointer-events-auto bg-[#0f172a]/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex items-center justify-between w-full max-w-6xl transition-transform duration-700 ease-out"
            >
                {/* Logo & Title */}
                <div className="flex items-center gap-3 w-[300px]">
                    <div className="w-10 h-10 flex items-center justify-center drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]">
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
                            <path d="M 35,55 L 55,75 L 85,30" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M 35,55 L 55,75 L 85,30" stroke="#bae6fd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1 className="text-base font-bold text-white tracking-tight leading-tight hidden sm:block">
                        Building Bye Laws <br />
                        <span className="text-indigo-400 font-semibold text-sm">Compliance Calculator</span>
                    </h1>
                </div>

                {/* Navigation Links */}
                <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-white/70">
                    <button onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} className="hover:text-white transition-colors cursor-pointer focus:outline-none">Home</button>

                    <button onClick={() => {
                        document.getElementById('compliance')?.scrollIntoView({ behavior: 'smooth' });
                    }} className="text-white font-semibold drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] bg-white/10 px-4 py-1.5 rounded-full border border-white/10 cursor-pointer focus:outline-none">Check Compliance</button>

                    <a href="https://kmc.gov.np/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Permit Guide</a>
                    <a href="https://kmc.gov.np/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Resources</a>
                    <a href="https://github.com/sudils58/byelaw-viz-new" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">About</a>
                </nav>

                {/* Theme Toggle & Mobile Menu */}
                <div className="flex justify-end w-[150px]">
                    <button
                        onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-all bg-white/5 hover:bg-white/10 border border-white/10"
                        aria-label="Toggle Brightness"
                    >
                        {theme === 'dark' ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
