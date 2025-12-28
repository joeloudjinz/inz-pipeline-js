import {DemoPipeline} from './demo-pipeline';

async function runDemo() {
    const demo = new DemoPipeline();
    await demo.run();
}

runDemo().catch(error => {
    console.error('Demo pipeline execution failed:', error);
});