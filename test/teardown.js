/**
 * Global teardown for Jest tests
 * This file runs once after all test suites
 */

module.exports = async () => {
    // Clean up any global resources
    console.log('Global teardown completed');
};