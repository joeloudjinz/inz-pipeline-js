# inz-pipeline-js

A TypeScript pipeline library for processing data through configurable steps, inspired by
the [InzPipeline](https://github.com/joeloudjinz/InzPipeline) .NET library.

## Table of Contents
- [Overview](#overview)
- [Basic Usage](#basic-usage)
- [Creating Pipes](#creating-pipes)
- [Advanced Features](#advanced-features)
- [API Reference](#api-reference)
- [Running the Example App](#running-the-example-app)
- [Running the Tests](#running-the-tests)

## Overview

The inz-pipeline-js library provides a fluent API for building data processing pipelines with support for:

- Sequential execution of operations
- Parallel execution of operations
- Conditional execution of operations
- Sub-pipelines for composition and reusability
- Comprehensive error handling policies (retry, circuit breaker, fallback)
- Advanced recovery strategies (retry with backoff, circuit breaker strategy)
- Performance metrics tracking with detailed timing and memory usage
- Resource management with key-value store
- Pipeline validation to ensure proper resource dependencies
- Type safety with generic types throughout

## Basic Usage

```typescript
import {PipelineBuilder, PipelineContext, BasePipe} from 'inz-pipeline-js';

// Define your input and output types
interface InputData {
    value: number;
}

interface OutputData {
    result: number;
}

// Create a context that extends PipelineContext
class MyContext extends PipelineContext<InputData, OutputData> {
    constructor() {
        super();
        this.input = {value: 0};
        this.output = {result: 0};
    }
}

// Create a custom pipe by extending BasePipe
class MultiplyPipe extends BasePipe<InputData, OutputData> {
    private factor: number;

    constructor(factor: number) {
        super();
        this.factor = factor;
    }

    async handle(context: IPipelineContext<InputData, OutputData>): Promise<void> {
        // Perform your operation here
        context.output.result = context.input.value * this.factor;
    }
}

// Create and run a simple pipeline
async function runPipeline() {
    const builder = new PipelineBuilder<InputData, OutputData>();
    const context = new MyContext();
    const source = {value: 5};

    await builder
        .setSource(source)
        .attachContext(context)
        .attachPipe(new MultiplyPipe(2))
        .enablePerformanceMetrics()
        .flush();

    console.log('Result:', context.output.result);
    console.log('Performance:', context.getPerformanceMetricsSummary());
}
```

## Creating Pipes

To create a pipe, extend the `BasePipe<TIn, TOut>` class:

```typescript
import {BasePipe, IPipelineContext} from 'inz-pipeline-js';

class MyPipe extends BasePipe<InputData, OutputData> {
    async handle(context: IPipelineContext<InputData, OutputData>): Promise<void> {
        // Perform your operation here
        context.output.result = context.input.value * 2;
    }

    // Optional: Define required resources for validation
    getRequiredResources?(): string[] {
        return ['required-resource-key'];
    }

    // Optional: Define provided resources for validation
    getProvidedResources?(): string[] {
        return ['provided-resource-key'];
    }
}
```

## Advanced Features

### Sub-Pipelines

```typescript
import {SubPipeline} from 'inz-pipeline-js';

const subPipeline = new SubPipeline<InputData, OutputData>((subBuilder) => {
    subBuilder
        .attachPipe(new Pipe1())
        .attachPipe(new Pipe2());
});

await builder
    .setSource(source)
    .attachContext(context)
    .attachSubPipeline(subPipeline)
    .flush();
```

### Conditional Pipes

```typescript
await builder
    .setSource(source)
    .attachContext(context)
    .attachConditionalPipe(new MyPipe(), (ctx) => ctx.input.value > 10)
    .flush();
```

### Parallel Execution

```typescript
await builder
    .setSource(source)
    .attachContext(context)
    .attachParallelPipes(new Pipe1(), new Pipe2(), new Pipe3())
    .flush();
```

### Error Handling Policies

#### Retry Policy

```typescript
// With exponential backoff
await builder
    .setSource(source)
    .attachContext(context)
    .attachPipeWithRetryPolicy(
        new FailingPipe(),
        3,           // max attempts
        1000,        // initial delay (ms)
        60000,       // max delay (ms)
        true         // use exponential backoff
    )
    .flush();
```

#### Circuit Breaker Policy

```typescript
await builder
    .setSource(source)
    .attachContext(context)
    .attachPipeWithCircuitBreakerPolicy(
        new UnreliablePipe(),
        5,           // failure threshold
        60000        // timeout (ms)
    )
    .flush();
```

#### Fallback Policy

```typescript
await builder
    .setSource(source)
    .attachContext(context)
    .attachPipeWithFallbackPolicy(
        new PrimaryPipe(),
        new FallbackPipe()
    )
    .flush();
```

### Recovery Strategies

#### Retry with Backoff Strategy

```typescript
await builder
    .setSource(source)
    .attachContext(context)
    .attachPipeWithRetryStrategy(
        new FailingPipe(),
        3,           // max attempts
        1000,        // initial delay (ms)
        60000        // max delay (ms)
    )
    .flush();
```

#### Circuit Breaker Strategy

```typescript
await builder
    .setSource(source)
    .attachContext(context)
    .attachPipeWithCircuitBreakerStrategy(
        new UnreliablePipe(),
        5,           // failure threshold
        60000        // timeout (ms)
    )
    .flush();
```

### Performance Metrics

```typescript
await builder
    .setSource(source)
    .attachContext(context)
    .enablePerformanceMetrics('my-correlation-id')
    .attachPipe(new MyPipe())
    .flush();

console.log(context.getPerformanceMetricsSummary());
```

### Resource Management

```typescript
// In your pipe implementation
async handle(context: IPipelineContext<InputData, OutputData>): Promise<void> {
    // Add a resource to the context
    context.addResource('my-resource-key', {some: 'data'});

    // Get a resource from the context
    const resource = context.getResource('my-resource-key');

    // Try to get a resource with a default value
    const {success, value} = context.tryGetResource('optional-resource', 'default-value');
}
```

### Pipeline Validation

```typescript
import {DefaultPipelineValidator} from 'inz-pipeline-js';

await builder
    .setSource(source)
    .attachContext(context)
    .attachValidator(new DefaultPipelineValidator<InputData, OutputData>())
    .attachPipe(new MyPipe())
    .flush();
```

## API Reference

### PipelineBuilder<TIn, TOut>

The main orchestrator class that provides a fluent API for building and executing pipelines. It manages:

- Pipeline steps (Sequential, Parallel, Conditional, SubPipeline)
- Context attachment and source data
- Error handling policies and recovery strategies
- Performance metrics collection
- Pipeline validation

### PipelineContext<TIn, TOut>

The context that flows through the pipeline, carrying data and state between pipes. It provides:

- Input/output data storage
- Resource management (key-value store)
- Error tracking and logging
- Performance metrics
- Error handling options
- Validation results

### BasePipe<TIn, TOut>

Abstract base class for all pipe implementations that provides:

- Required and provided resource tracking
- Async handle method that all pipes must implement

### SubPipeline<TIn, TOut>

A reusable pipeline component that can be embedded within other pipelines, enabling pipeline composition and
reusability.

## Pipeline Step Types

### SequentialStep

Executes a single pipe sequentially with error handling policies and recovery strategies.

### ParallelStep

Executes multiple pipes concurrently using Promise.all() with individual configurations.

### ConditionalStep

Executes a pipe only if a condition function evaluates to true.

### SubPipelineStep

Executes a nested pipeline within the main pipeline, sharing the same context.

## Error Handling & Recovery Mechanisms

### Policies

- **RetryPolicy**: Configurable retry logic with attempts, delays, and exponential backoff
- **CircuitBreakerPolicy**: Circuit breaker pattern to prevent repeated failures
- **FallbackPolicy**: Execute fallback pipe when primary pipe fails

### Strategies

- **RetryWithBackoffStrategy**: Recovery strategy with exponential backoff
- **CircuitBreakerStrategy**: Recovery strategy implementing circuit breaker pattern

## Configuration & Models

### Configuration Classes

- **PipeConfiguration**: Individual pipe settings (error handling, timeouts, etc.)
- **ErrorHandlingOptions**: Global pipeline error handling options

### Data Models

- **PerformanceMetricsModel**: Execution timing, memory usage, and custom metrics
- **MemoryMetricsModel**: Memory usage tracking (initial, final, peak, allocated)
- **PipelineErrorModel**: Detailed error representation with timestamps and pipe names


## Running the Example App

The example app demonstrates various features of the library. To run it:

1. Navigate to the project root directory:
   ```bash
   cd /path/to/inz-pipeline-js
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run the example app:
   ```bash
   npm run example:dummy-app
   ```

The example app will demonstrate:
- Pipeline with performance metrics enabled
- Pipeline with performance metrics disabled
- Pipeline with error handling features
- Pipeline with validation features
- Pipeline with cancellation features
- Pipeline with cancellable pipe features

## Running the Tests

The project includes comprehensive unit and integration tests. To run them:

1. Navigate to the project root directory:
   ```bash
   cd /path/to/inz-pipeline-js
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run all tests:
   ```bash
   npm test
   ```

4. Run tests in watch mode:
   ```bash
   npm run test:watch
   ```

5. Run specific test files:
   ```bash
   npm run test -- test/unit-tests/pipeline-builder-basic-setup.test.ts
   ```

The test suite includes:
- Unit tests for individual components
- Integration tests for complex pipeline scenarios
- Error handling tests
- Performance metrics tests
- Resource management tests
- Sub-pipeline integration tests
- Parallel and conditional execution tests
- Real-world usage scenario tests