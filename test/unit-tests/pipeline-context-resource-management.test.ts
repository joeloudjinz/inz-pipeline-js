import {PipelineContext} from '../../src/pipeline-context';

// Define simple input and output types for testing
interface TestInput {
    value: number;
}

interface TestOutput {
    result: string;
}

// Create a concrete implementation of PipelineContext for testing
class TestContext extends PipelineContext<TestInput, TestOutput> {
    constructor() {
        super();
        this.input = { value: 0 };
        this.output = { result: '' };
    }
}

describe('PipelineContext - Resource Management', () => {
    let context: TestContext;

    beforeEach(() => {
        context = new TestContext();
    });

    test('should add resource to context', () => {
        const resourceKey = 'test.resource.key';
        const resourceValue = 'test resource value';

        context.addResource(resourceKey, resourceValue);

        expect(context.getResource(resourceKey)).toBe(resourceValue);
    });

    test('should throw error when adding duplicate resource key', () => {
        const resourceKey = 'test.resource.key';
        const resourceValue1 = 'test resource value 1';
        const resourceValue2 = 'test resource value 2';

        context.addResource(resourceKey, resourceValue1);

        expect(() => {
            context.addResource(resourceKey, resourceValue2);
        }).toThrow(`A resource with key '${resourceKey}' already exists in the context.`);
    });

    test('should get resource from context', () => {
        const resourceKey = 'test.resource.key';
        const resourceValue = 'test resource value';

        context.addResource(resourceKey, resourceValue);

        const retrievedResource = context.getResource(resourceKey);

        expect(retrievedResource).toBe(resourceValue);
    });

    test('should throw error when getting non-existent resource', () => {
        const resourceKey = 'non.existent.key';

        expect(() => {
            context.getResource(resourceKey);
        }).toThrow(`Resource with key '${resourceKey}' was not found in the context.`);
    });

    test('should try get resource and return success when resource exists', () => {
        const resourceKey = 'test.resource.key';
        const resourceValue = 'test resource value';

        context.addResource(resourceKey, resourceValue);

        const result = context.tryGetResource(resourceKey);

        expect(result).toEqual({ success: true, value: resourceValue });
    });

    test('should try get resource and return failure when resource does not exist', () => {
        const resourceKey = 'non.existent.key';

        const result = context.tryGetResource(resourceKey);

        expect(result).toEqual({ success: false, value: undefined });
    });

    test('should try get resource with default value when resource does not exist', () => {
        const resourceKey = 'non.existent.key';
        const defaultValue = 'default value';

        const result = context.tryGetResource(resourceKey, defaultValue);

        expect(result).toEqual({ success: false, value: defaultValue });
    });

    test('should try add resource and return true when key does not exist', () => {
        const resourceKey = 'test.resource.key';
        const resourceValue = 'test resource value';

        const result = context.tryAddResource(resourceKey, resourceValue);

        expect(result).toBe(true);
        expect(context.getResource(resourceKey)).toBe(resourceValue);
    });

    test('should try add resource and return false when key already exists', () => {
        const resourceKey = 'test.resource.key';
        const resourceValue1 = 'test resource value 1';
        const resourceValue2 = 'test resource value 2';

        context.addResource(resourceKey, resourceValue1);
        const result = context.tryAddResource(resourceKey, resourceValue2);

        expect(result).toBe(false);
        expect(context.getResource(resourceKey)).toBe(resourceValue1);
    });

    test('should update existing resource in context', () => {
        const resourceKey = 'test.resource.key';
        const resourceValue1 = 'test resource value 1';
        const resourceValue2 = 'test resource value 2';

        context.addResource(resourceKey, resourceValue1);
        context.updateResource(resourceKey, resourceValue2);

        expect(context.getResource(resourceKey)).toBe(resourceValue2);
    });

    test('should throw error when updating non-existent resource', () => {
        const resourceKey = 'non.existent.key';
        const resourceValue = 'test resource value';

        expect(() => {
            context.updateResource(resourceKey, resourceValue);
        }).toThrow(`Resource with key '${resourceKey}' was not found in the context.`);
    });

    test('should remove existing resource from context', () => {
        const resourceKey = 'test.resource.key';
        const resourceValue = 'test resource value';

        context.addResource(resourceKey, resourceValue);
        const result = context.removeResource(resourceKey);

        expect(result).toBe(true);
        expect(() => {
            context.getResource(resourceKey);
        }).toThrow(`Resource with key '${resourceKey}' was not found in the context.`);
    });

    test('should return false when removing non-existent resource', () => {
        const resourceKey = 'non.existent.key';

        const result = context.removeResource(resourceKey);

        expect(result).toBe(false);
    });

    test('should handle multiple different resources correctly', () => {
        const key1 = 'resource.key.1';
        const value1 = 'value 1';
        const key2 = 'resource.key.2';
        const value2 = { complex: 'object', with: ['array', 'values'] };
        const key3 = 'resource.key.3';
        const value3 = 42;

        context.addResource(key1, value1);
        context.addResource(key2, value2);
        context.addResource(key3, value3);

        expect(context.getResource(key1)).toBe(value1);
        expect(context.getResource(key2)).toEqual(value2);
        expect(context.getResource(key3)).toBe(value3);
    });

    test('should handle resources with different types', () => {
        const stringKey = 'string.resource';
        const stringValue = 'string value';
        const numberKey = 'number.resource';
        const numberValue = 123;
        const objectKey = 'object.resource';
        const objectValue = { prop: 'value', nested: { another: 'value' } };
        const arrayKey = 'array.resource';
        const arrayValue = [1, 2, 3, 'mixed', { obj: 'in array' }];

        context.addResource(stringKey, stringValue);
        context.addResource(numberKey, numberValue);
        context.addResource(objectKey, objectValue);
        context.addResource(arrayKey, arrayValue);

        expect(context.getResource(stringKey)).toBe(stringValue);
        expect(context.getResource(numberKey)).toBe(numberValue);
        expect(context.getResource(objectKey)).toEqual(objectValue);
        expect(context.getResource(arrayKey)).toEqual(arrayValue);
    });
});