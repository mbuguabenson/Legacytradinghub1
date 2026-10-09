const React = require('react');

module.exports = {
    useDevice: () => ({ isDesktop: true, isMobile: false, isTablet: false }),
    Text: ({ children, className }) => React.createElement('span', { className }, children),
    Header: ({ children, className }) => React.createElement('header', { className }, children),
    Wrapper: ({ children, variant, className }) => React.createElement('div', { className, 'data-variant': variant }, children),
    Button: ({ children, onClick, className }) => React.createElement('button', { onClick, className }, children),
};
