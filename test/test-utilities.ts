import {PipelineContext} from '../src';
import {BasePipe} from '../src';

/**
 * Common interfaces and classes for testing
 */
export interface TestInput {
    value: number;
}

export interface TestOutput {
    result: number;
}

export class TestContext extends PipelineContext<TestInput, TestOutput> {
    constructor() {
        super();
        this.input = {value: 0};
        this.output = {result: 0};
    }
}

export class TestPipe extends BasePipe<TestInput, TestOutput> {
    async handle(context: any): Promise<void> {
        context.output.result = context.input.value * 2;
    }
}