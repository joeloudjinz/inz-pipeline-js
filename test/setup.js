/**
 * Global setup for Jest tests
 * This file runs once before all test suites
 */

module.exports = async () => {
    // Set up any global configuration needed for tests
    process.env.NODE_ENV = 'test';

    // Any other global setup code can go here
    console.log('Global setup completed');
};