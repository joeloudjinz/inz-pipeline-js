# Jest Configuration for InzPipeline

This project uses Jest for testing with the following configuration:

## Configuration Features

- **TypeScript Support**: Uses `ts-jest` preset for seamless TypeScript compilation
- **Module Resolution**: Properly configured for the project's module structure
- **Test Environment**: Node.js environment for backend testing
- **File Patterns**: Matches test files with patterns like `*.test.ts`, `*.spec.ts`, etc.
- **Coverage Reporting**: Generates coverage reports in multiple formats (text, lcov, html, clover)
- **Async Testing**: Configured with appropriate timeout for async operations
- **Global Setup/Teardown**: Includes setup and teardown scripts
- **Reporting**: Includes JUnit XML reporting for CI/CD integration

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx jest test/your-test-file.test.ts
```

## Test Structure

Tests should be placed in the `test/` directory and follow the naming convention `*.test.ts` or `*.spec.ts`.

## Key Configuration Options

- `preset: 'ts-jest'` - Handles TypeScript compilation
- `testEnvironment: 'node'` - Appropriate for backend library
- `collectCoverage: true` - Generates coverage reports
- `testTimeout: 30000` - Sufficient for async operations
- `moduleNameMapper` - Supports path aliases if needed
- `transform` - Transforms TypeScript files appropriately