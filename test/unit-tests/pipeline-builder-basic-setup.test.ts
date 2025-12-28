import {PipelineBuilder} from '../../src/pipeline-builder';
import {TestPipelineContext} from '../test-pipeline-context';
import {BasePipe} from '../../src/base-pipe';

// Mock pipe for testing
class TestPipe extends BasePipe<{ value: number }, { result: number }> {
    async handle(context: any): Promise<void> {
        context.output = {result: context.input.value * 2};
    }
}

describe('PipelineBuilder - Basic Pipeline Setup', () => {
    let builder: PipelineBuilder<{ value: number }, { result: number }>;
    let context: TestPipelineContext<{ value: number }, { result: number }>;
    let source: { value: number };

    beforeEach(() => {
        builder = new PipelineBuilder<{ value: number }, { result: number }>();
        context = new TestPipelineContext<{ value: number }, { result: number }>();
        source = {value: 5};
    });

    test('should attach context and source correctly', () => {
        builder.attachContext(context).setSource(source);

        // We can't directly access private fields, so we'll test the validation
        expect(() => (builder as any).validateConfiguration()).rejects.toThrow("At least one step must be attached to the pipeline");
    });

    test('should attach a simple pipe', async () => {
        const testPipe = new TestPipe();
        builder.attachContext(context).setSource(source).attachPipe(testPipe);

        await expect((builder as any).validateConfiguration()).resolves.not.toThrow();
    });

    test('should fail validation without context', async () => {
        const testPipe = new TestPipe();
        builder.setSource(source).attachPipe(testPipe);

        await expect((builder as any).validateConfiguration()).rejects.toThrow("Context must be attached, call attachContext()");
    });

    test('should fail validation without source', async () => {
        const testPipe = new TestPipe();
        builder.attachContext(context).attachPipe(testPipe);

        await expect((builder as any).validateConfiguration()).rejects.toThrow("Source must be set, call setSource()");
    });

    test('should fail validation without steps', async () => {
        builder.attachContext(context).setSource(source);

        await expect((builder as any).validateConfiguration()).rejects.toThrow("At least one step must be attached to the pipeline");
    });
});