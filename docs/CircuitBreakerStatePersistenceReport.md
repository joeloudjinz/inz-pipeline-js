# Circuit Breaker State Persistence in Distributed Systems: Analysis and Findings

## Introduction

The circuit breaker pattern is a critical design pattern for building resilient systems by preventing cascading failures and ensuring graceful degradation. However, implementing circuit breaker state persistence in distributed systems presents unique challenges and considerations. This report analyzes the problem of circuit breaker state management, examines research findings, and provides conclusions based on the gathered information.

## The Problem: Local vs Global Circuit Breaker State

### Current Implementation Issue

In the InzPipeline library, both `CircuitBreakerPolicy` and `CircuitBreakerStrategy` maintain their state (circuit state, failure count, last failure time) as instance properties. This means:

1. **State is tied to the policy/strategy instance**: Each time a new circuit breaker is created, it starts with a fresh state (Closed, failureCount = 0, etc.)
2. **No shared state across pipeline executions**: When a pipeline is executed with a circuit breaker policy and then executed again, it will start with a fresh state rather than continuing from where it left off
3. **State resets between pipe executions**: If the same pipe is executed multiple times in different pipeline runs, the circuit breaker state will reset

### Example of the Problem

Consider the following scenario:
- Pipeline A executes with a pipe that has a circuit breaker policy
- The pipe fails 4 times, so the circuit breaker is at 4/5 failures (still closed)
- Pipeline B (or another execution of Pipeline A) executes the same pipe
- The circuit breaker starts fresh at 0/5 failures instead of continuing from 4/5
- The pipe fails again, now at 1/5 failures in the new instance
- It would need 4 more failures to trip the circuit breaker, even though it was almost tripped in the previous execution

This defeats the purpose of a circuit breaker, which is designed to protect systems by tracking failure patterns across multiple requests, not just within a single execution context.

## Research Findings

### Martin Fowler's Original Circuit Breaker Pattern

According to Martin Fowler's original article on the circuit breaker pattern:

#### State Management
- The circuit breaker maintains three states: **Closed** (normal operation), **Open** (tripped state), and **Half-Open** (trial state)
- State transitions occur based on failure thresholds and time intervals
- The state is maintained in memory within the circuit breaker object itself

#### Persistence
- The original pattern doesn't explicitly discuss persistence mechanisms
- The state is maintained in memory within the circuit breaker object
- Variables track failure count, last failure time, and current state

#### Global vs Local State
- The article doesn't specify whether the state should be global or local
- Based on implementation examples, the state appears to be local to each circuit breaker instance
- Each circuit breaker object maintains its own state for the specific service it's protecting
- Multiple instances of the same service would have independent circuit breaker states

### Distributed Systems Considerations

Research from groundcover.com reveals important considerations for circuit breaker state management in distributed systems:

#### State Synchronization Challenge
- Each instance typically has its own circuit breaker state
- This creates inconsistent behavior where some instances trip while others don't
- Two approaches to handle this:
  1. **Centralized state store**: Share circuit breaker state across instances
  2. **Accept eventual consistency**: Allow instances to have different states but converge over time

#### Distributed System Challenges
1. **State Synchronization**: Each instance maintains its own circuit breaker state, leading to potential inconsistencies
2. **Monitoring Complexity**: Need for comprehensive visibility across all services
3. **Threshold Tuning**: Configuring appropriate thresholds becomes more complex with different load patterns
4. **Observability Requirements**: Tracking circuit breaker state across all services increases monitoring complexity
5. **Resource Protection**: Ensuring circuit breakers effectively protect resources across the entire distributed system

#### Solutions for Distributed State Management
1. **Centralized State Store**: Implement shared storage for circuit breaker state across instances
2. **Eventual Consistency**: Accept different states temporarily but allow convergence over time

## Analysis of Global vs Local State Approaches

### Local State Approach (Current Implementation)

**Advantages:**
- Simpler implementation with no shared state management
- No external dependencies for state storage
- Lower latency for state access
- Better performance due to in-memory operations

**Disadvantages:**
- Inconsistent behavior across different pipeline executions
- Circuit breaker effectiveness reduced due to state resets
- May not properly protect shared resources across executions
- Failure patterns are not tracked across pipeline runs

### Global/Shared State Approach

**Advantages:**
- Consistent circuit breaker behavior across all pipeline executions
- Proper protection of shared resources
- Accurate tracking of failure patterns across time
- More effective prevention of cascading failures

**Disadvantages:**
- Increased complexity with shared state management
- Potential performance impact due to external state storage
- Additional failure points if using external storage
- More complex deployment and maintenance

## Conclusion and Recommendations

Based on the research and analysis, the decision between local and global circuit breaker state depends on the specific use case and requirements:

### For Pipeline Libraries Like InzPipeline

For a pipeline processing library like InzPipeline, a **hybrid approach** is recommended:

1. **Default to Local State**: Maintain the current behavior as the default for simplicity and performance
2. **Provide Global State Option**: Implement an optional shared state mechanism for scenarios where cross-execution state persistence is needed
3. **Configurable State Management**: Allow users to choose between local and shared state based on their requirements

### Implementation Strategy

1. **State Registry**: Create a registry pattern that can maintain shared circuit breaker states across pipeline executions
2. **Named Circuit Breakers**: Allow circuit breakers to be named so they can be shared across different pipeline executions
3. **Optional Persistence**: Provide options for in-memory, file-based, or external storage (Redis, etc.) for shared state
4. **Backward Compatibility**: Ensure the existing local state behavior remains the default to maintain compatibility

### Best Practices

1. **Clear Documentation**: Clearly document the differences between local and shared state approaches
2. **Monitoring**: Provide comprehensive monitoring for circuit breaker state regardless of the approach used
3. **Configuration**: Make state management configurable based on the specific needs of the pipeline
4. **Performance Considerations**: Optimize for performance while maintaining the benefits of shared state when needed

The key insight from the research is that there is no one-size-fits-all solution. The choice between local and global state depends on the specific requirements of the system, including the tolerance for inconsistent behavior, performance requirements, and complexity tolerance. For a pipeline library, providing both options with clear guidance on when to use each approach would be the most effective solution.

## Resources Used

The following resources were used to gather information for this report:

1. Martin Fowler's original article on the Circuit Breaker pattern: https://martinfowler.com/bliki/CircuitBreaker.html
2. Groundcover article on Circuit Breaker Pattern: https://www.groundcover.com/learn/performance/circuit-breaker-pattern
3. Baeldung article on Circuit Breaker Pattern in Microservices: https://www.baeldung.com/cs/microservices-circuit-breaker-pattern
4. GeeksforGeeks article on Circuit Breaker Pattern in Microservices: https://www.geeksforgeeks.org/system-design/what-is-circuit-breaker-pattern-in-microservices/
5. Wikipedia article on Circuit Breaker Design Pattern: https://en.wikipedia.org/wiki/Circuit_breaker_design_pattern