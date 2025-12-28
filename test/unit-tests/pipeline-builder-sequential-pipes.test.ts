import {PipelineBuilder} from '../../src/pipeline-builder';
import {TestPipelineContext} from '../test-pipeline-context';
import {BasePipe} from '../../src/base-pipe';

// Mock pipe for testing
class TestPipe extends BasePipe<{ value: number }, { result: number }> {
    async handle(context: any): Promise<void> {
        context.output = {result: context.input.value * 2};
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

describe('PipelineBuilder - Sequential Pipes', () => {
    let builder: PipelineBuilder<{ value: number }, { result: number }>;
    let context: TestPipelineContext<{ value: number }, { result: number }>;
    let source: { value: number };

    beforeEach(() => {
        builder = new PipelineBuilder<{ value: number }, { result: number }>();
        context = new TestPipelineContext<{ value: number }, { result: number }>();
        source = {value: 5};
    });

    test('should execute a single sequential pipe successfully', async () => {
        const testPipe = new TestPipe();
        builder.attachContext(context).setSource(source).attachPipe(testPipe);

        await builder.flush();

        expect(context.output).toEqual({result: 10}); // 5 * 2
    });

    test('should execute multiple sequential pipes', async () => {
        const testPipe1 = new TestPipe(); // 5 * 2 = 10
        const addPipe = new AddPipe(5); // 10 + 5 = 15

        builder.attachContext(context).setSource(source).attachPipe(testPipe1).attachPipe(addPipe);

        await builder.flush();

        expect(context.output).toEqual({result: 15}); // (5 * 2) + 5 = 15
    });

    test('should execute multiple sequential pipes with data flow between them', async () => {
        const testPipe1 = new TestPipe(); // 5 * 2 = 10
        const addPipe = new AddPipe(5); // 10 + 5 = 15 (using previous result as base)

        builder.attachContext(context).setSource(source).attachPipe(testPipe1).attachPipe(addPipe);

        await builder.flush();

        expect(context.output).toEqual({result: 15}); // (5 * 2) + 5 = 15
    });

    test('should maintain execution order of sequential pipes', async () => {
        const addPipe1 = new AddPipe(10); // 5 + 10 = 15
        const addPipe2 = new AddPipe(5);  // 15 + 5 = 20
        const addPipe3 = new AddPipe(3);  // 20 + 3 = 23

        builder.attachContext(context).setSource(source)
            .attachPipe(addPipe1)
            .attachPipe(addPipe2)
            .attachPipe(addPipe3);

        await builder.flush();

        expect(context.output).toEqual({result: 23}); // ((5 + 10) + 5) + 3 = 23
    });

    test('should handle pipe that modifies existing output', async () => {
        // Initialize context with existing output
        context.output = {result: 100};
        
        const addPipe = new AddPipe(25); // 100 + 25 = 125

        builder.attachContext(context).setSource(source).attachPipe(addPipe);

        await builder.flush();

        expect(context.output).toEqual({result: 125}); // 100 + 25 = 125
    });
});