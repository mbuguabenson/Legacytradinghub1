module.exports = {
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@deriv-com/translations$': '<rootDir>/src/__mocks__/translations.js',
        '^@deriv-com/ui$': '<rootDir>/src/__mocks__/ui.js',
    },
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
    moduleDirectories: ['node_modules', 'src'],
};
