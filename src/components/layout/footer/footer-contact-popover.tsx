import React, { useState, useRef, useEffect } from 'react';
import './footer-contact-popover.scss';

export const FooterContactPopover: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Toggle popover
    const togglePopover = () => setIsOpen(prev => !prev);

    // Close on click outside or escape key
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div className='footer-contact' ref={containerRef}>
            {/* Popover Card (Pops Upwards from Footer) */}
            {isOpen && (
                <div className='footer-contact__card' role='dialog' aria-modal='true'>
                    {/* Glowing top line accent */}
                    <div className='footer-contact__card-accent' />

                    {/* Card Header */}
                    <div className='footer-contact__card-header'>
                        <div className='footer-contact__card-header-left'>
                            <div className='footer-contact__status-pill'>
                                <span className='footer-contact__status-dot' />
                                <span className='footer-contact__status-text'>Live Trading Desk</span>
                            </div>
                            <h4 className='footer-contact__card-title'>Direct Contact & Community</h4>
                            <p className='footer-contact__card-subtitle'>Get priority support, automated bot assistance & signals</p>
                        </div>
                        <button
                            type='button'
                            className='footer-contact__card-close'
                            onClick={() => setIsOpen(false)}
                            aria-label='Close Contact Card'
                        >
                            <svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                <line x1='18' y1='6' x2='6' y2='18' />
                                <line x1='6' y1='6' x2='18' y2='18' />
                            </svg>
                        </button>
                    </div>

                    {/* Channels List */}
                    <div className='footer-contact__card-body'>
                        {/* 1. WhatsApp Channel */}
                        <div className='footer-contact__item footer-contact__item--whatsapp'>
                            <div className='footer-contact__item-icon footer-contact__item-icon--whatsapp'>
                                <svg viewBox='0 0 24 24' width='20' height='20' fill='currentColor'>
                                    <path d='M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.37C9.37 7.37 9.1 7.43 8.88 7.67C8.65 7.92 8.02 8.51 8.02 9.72C8.02 10.93 8.91 12.1 9.03 12.27C9.15 12.44 10.74 14.9 13.21 15.96C15.26 16.84 15.68 16.67 16.12 16.63C16.56 16.59 17.55 16.04 17.75 15.46C17.96 14.88 17.96 14.38 17.89 14.28C17.83 14.17 17.67 14.11 17.42 13.99C17.18 13.86 15.98 13.27 15.76 13.19C15.53 13.11 15.37 13.07 15.21 13.31C15.04 13.56 14.56 14.11 14.42 14.28C14.28 14.44 14.13 14.46 13.89 14.34C13.65 14.22 12.87 13.96 11.94 13.13C11.22 12.49 10.73 11.69 10.59 11.45C10.45 11.2 10.57 11.07 10.7 10.95C10.81 10.84 10.95 10.66 11.07 10.51C11.19 10.37 11.24 10.27 11.32 10.1C11.4 9.94 11.36 9.8 11.3 9.68C11.24 9.56 10.75 8.35 10.54 7.86C10.34 7.38 10.14 7.45 9.98 7.44C9.84 7.44 9.68 7.37 9.53 7.37Z' />
                                </svg>
                            </div>
                            <div className='footer-contact__item-content'>
                                <div className='footer-contact__item-badge footer-contact__item-badge--whatsapp'>Direct Hotline</div>
                                <div className='footer-contact__item-title'>WhatsApp Support</div>
                                <div className='footer-contact__item-value'>+254 757 722 344</div>
                            </div>
                            <div className='footer-contact__item-actions'>
                                <a
                                    href='https://wa.me/254757722344'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='footer-contact__btn footer-contact__btn--whatsapp'
                                    title='Chat on WhatsApp'
                                    onClick={() => setIsOpen(false)}
                                >
                                    <svg viewBox='0 0 24 24' width='13' height='13' fill='currentColor'>
                                        <path d='M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2Z' />
                                    </svg>
                                    <span>Chat</span>
                                </a>
                                <a
                                    href='tel:+254757722344'
                                    className='footer-contact__btn footer-contact__btn--call'
                                    title='Call Directly'
                                    onClick={() => setIsOpen(false)}
                                >
                                    <svg viewBox='0 0 24 24' width='12' height='12' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' />
                                    </svg>
                                    <span>Call</span>
                                </a>
                            </div>
                        </div>

                        {/* 2. Telegram Channel */}
                        <div className='footer-contact__item footer-contact__item--telegram'>
                            <div className='footer-contact__item-icon footer-contact__item-icon--telegram'>
                                <svg viewBox='0 0 24 24' width='20' height='20' fill='currentColor'>
                                    <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z' />
                                </svg>
                            </div>
                            <div className='footer-contact__item-content'>
                                <div className='footer-contact__item-badge footer-contact__item-badge--telegram'>Signals & Bots</div>
                                <div className='footer-contact__item-title'>Telegram Community</div>
                                <div className='footer-contact__item-value'>@Legacytradinghub</div>
                            </div>
                            <div className='footer-contact__item-actions'>
                                <a
                                    href='https://t.me/Legacytradinghub'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='footer-contact__btn footer-contact__btn--telegram'
                                    title='Join Telegram Channel'
                                    onClick={() => setIsOpen(false)}
                                >
                                    <svg viewBox='0 0 24 24' width='13' height='13' fill='currentColor'>
                                        <path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z' />
                                    </svg>
                                    <span>Join</span>
                                </a>
                            </div>
                        </div>

                        {/* 3. Email Developer */}
                        <div className='footer-contact__item footer-contact__item--email'>
                            <div className='footer-contact__item-icon footer-contact__item-icon--email'>
                                <svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                    <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
                                    <polyline points='22,6 12,13 2,6' />
                                </svg>
                            </div>
                            <div className='footer-contact__item-content'>
                                <div className='footer-contact__item-badge footer-contact__item-badge--email'>Engineering Support</div>
                                <div className='footer-contact__item-title'>Developer Email</div>
                                <div className='footer-contact__item-value' title='Profithubdeveloper@gmail.com'>Profithubdeveloper@gmail.com</div>
                            </div>
                            <div className='footer-contact__item-actions'>
                                <a
                                    href='mailto:Profithubdeveloper@gmail.com'
                                    className='footer-contact__btn footer-contact__btn--email'
                                    title='Send Email to Developer'
                                    onClick={() => setIsOpen(false)}
                                >
                                    <svg viewBox='0 0 24 24' width='13' height='13' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <line x1='22' y1='2' x2='11' y2='13' />
                                        <polygon points='22 2 15 22 11 13 2 9 22 2' />
                                    </svg>
                                    <span>Email</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Card Footer Bar */}
                    <div className='footer-contact__card-footer'>
                        <span className='footer-contact__response-badge'>
                            <svg viewBox='0 0 24 24' width='12' height='12' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                <circle cx='12' cy='12' r='10' />
                                <polyline points='12 6 12 12 16 14' />
                            </svg>
                            Typical response time: under 5 minutes
                        </span>
                    </div>
                </div>
            )}

            {/* Trigger Button in Footer Bar */}
            <button
                type='button'
                id='footer-contact-btn'
                className={`footer-contact__trigger ${isOpen ? 'footer-contact__trigger--active' : ''}`}
                onClick={togglePopover}
                title='Direct Support & Community (WhatsApp, Telegram, Email)'
                aria-label='Direct Support & Community'
                aria-expanded={isOpen}
            >
                {/* Modern Chat / Support Headset Icon */}
                <span className='footer-contact__trigger-icon-wrap'>
                    <svg
                        className='footer-contact__trigger-icon'
                        viewBox='0 0 24 24'
                        width='14'
                        height='14'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    >
                        <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
                        <circle cx='8' cy='10' r='1' fill='currentColor' />
                        <circle cx='12' cy='10' r='1' fill='currentColor' />
                        <circle cx='16' cy='10' r='1' fill='currentColor' />
                    </svg>
                    <span className='footer-contact__trigger-ping' />
                </span>
                <span className='footer-contact__trigger-label'>Contact</span>
            </button>
        </div>
    );
};
