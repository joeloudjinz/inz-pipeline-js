import {PipelineContext} from "../../src";
import {InputData} from "./models/input.model";
import {OutputData} from "./models/output.model";

export class Context extends PipelineContext<InputData, OutputData> {
    constructor() {
        super();
        this.input = new InputData();
        this.output = new OutputData();
    }
}