import React, { useState, useEffect } from 'react';

const Navbar = () => {
    const [open, setOpen] = useState(false);

    const toggle = () => setOpen(prev => !prev);

    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth > 768 && open) setOpen(false);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [open]);

    return (
        <header className="header-area">
            <div className="navbar-area">
                <div className="container">
                    <nav className="site-navbar" aria-label="Main navigation">
                        <a href="#home" className="site-logo">Subic Bay Home Services</a>

                        <ul id="main-navigation" className={`nav-menu ${open ? 'open' : ''}`}>
                            <li><a href="#home">Home</a></li>
                            <li><a href="#">About</a></li>
                            <li><a href="#">Services</a></li>
                            <li><a href="#">Contact</a></li>
                        </ul>

                        <button
                            className={`nav-toggler ${open ? 'toggler-open' : ''}`}
                            aria-expanded={open}
                            aria-controls="main-navigation"
                            onClick={toggle}
                        >
                            <span aria-hidden="true"></span>

                        </button>
                    </nav>
                </div>
            </div>

        </header>
    );
}

export default Navbar;