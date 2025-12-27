/**
 * Simple test to verify Jest configuration works properly
 */
import {PipelineBuilder} from '../../src/PipelineBuilder';
import {TestInput, TestOutput, TestContext, TestPipe} from '../TestUtilities';

describe('Jest Configuration Test', () => {
    it('should execute a simple pipeline', async () => {
        const builder = new PipelineBuilder<TestInput, TestOutput>();
        const context = new TestContext();
        const source = {value: 5};

        await builder
            .setSource(source)
            .attachContext(context)
            .attachPipe(new TestPipe())
            .flush();

        expect(context.output.result).toBe(10);
    });

    it('should handle async operations properly', async () => {
        const result = await new Promise(resolve => {
            setTimeout(() => resolve('completed'), 10);
        });

        expect(result).toBe('completed');
    });
});