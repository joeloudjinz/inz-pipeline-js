import {SequentialStep} from '../../src/steps/sequential-step';
import {PipeConfiguration} from '../../src/configuration/pipe-configuration';
import {BasePipe} from '../../src/base-pipe';
import {TestPipelineContext} from '../test-pipeline-context';

// Mock pipe that succeeds
class SuccessPipe extends BasePipe<{ value: number }, { result: number }> {
    async handle(context: any): Promise<void> {
        context.output = {result: context.input.value * 2};
    }
}

// Mock pipe that fails
class FailingPipe extends BasePipe<{ value: number }, { result: number }> {
    async handle(context: any): Promise<void> {
        throw new Error('Intentional failure for testing');
    }
}

// Mock pipe that adds to the result
class AddPipe extends BasePipe<{ value: number }, { result: number }> {
    private readonly addValue: number;

    constructor(addValue: number) {
        super();
        this.addValue = addValue;
    }

    async handle(context: any): Promise<void> {
        if (!context.output) {
            context.output = {result: context.input.value + this.addValue};
        } else {
            context.output.result += this.addValue;
        }
    }
}

describe('SequentialStep Tests', () => {
    let context: TestPipelineContext<{ value: number }, { result: number }>;
    let source: { value: number };

    beforeEach(() => {
        context = new TestPipelineContext<{ value: number }, { result: number }>();
        source = {value: 5};
        context.input = source;
    });

    test('should execute sequential step without error handling', async () => {
        const successPipe = new SuccessPipe();
        const config = new PipeConfiguration<{ value: number }, { result: number }>();
        const step = new SequentialStep(successPipe, config);

        await expect(step.execute(context)).resolves.not.toThrow();
        expect(context.output).toEqual({result: 10}); // 5 * 2
    });

    test('should execute sequential step and handle errors when continueOnFailure is true', async () => {
        context.continueOnFailure = true;
        const failingPipe = new FailingPipe();
        const config = new PipeConfiguration<{ value: number }, { result: number }>();
        const step = new SequentialStep(failingPipe, config);

        await expect(step.execute(context)).resolves.not.toThrow();
        expect(context.hasPipeFailure).toBe(true);
        expect(context.errors.length).toBeGreaterThan(0);
    });

    test('should execute sequential step and re-throw errors when continueOnFailure is false', async () => {
        context.continueOnFailure = false;
        const failingPipe = new FailingPipe();
        const config = new PipeConfiguration<{ value: number }, { result: number }>();
        const step = new SequentialStep(failingPipe, config);

        await expect(step.execute(context)).rejects.toThrow('Intentional failure for testing');
        expect(context.hasPipeFailure).toBe(true);
        expect(context.errors.length).toBeGreaterThan(0);
    });

    test('should execute sequential step with configuration and no error handling', async () => {
        const addPipe = new AddPipe(10);
        const config = new PipeConfiguration<{ value: number }, { result: number }>();
        const step = new SequentialStep(addPipe, config);

        await expect(step.execute(context)).resolves.not.toThrow();
        expect(context.output).toEqual({result: 15}); // 5 + 10
    });

    test('should get pipes for validation', () => {
        const successPipe = new SuccessPipe();
        const config = new PipeConfiguration<{ value: number }, { result: number }>();
        const step = new SequentialStep(successPipe, config);

        const pipes = step.getPipes();

        expect(pipes).toHaveLength(1);
        expect(pipes[0]).toBe(successPipe);
    });

    test('should execute multiple sequential steps in order', async () => {
        const addPipe1 = new AddPipe(5);
        const addPipe2 = new AddPipe(10);
        const config = new PipeConfiguration<{ value: number }, { result: number }>();

        const step1 = new SequentialStep(addPipe1, config);
        const step2 = new SequentialStep(addPipe2, config);

        // Execute first step
        await step1.execute(context);
        expect(context.output).toEqual({result: 10}); // 5 + 5

        // Execute second step
        await step2.execute(context);
        expect(context.output).toEqual({result: 20}); // 10 + 10
    });
});