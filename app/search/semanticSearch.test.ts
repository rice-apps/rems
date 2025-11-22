import { SemanticSearchEngine } from './semanticSearch';
import * as RNFS from 'react-native-fs';

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
    DocumentDirectoryPath: '/mock/path',
    exists: jest.fn(),
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
}));

// Mock @fugood/transformers
jest.mock('@fugood/transformers', () => ({
    pipeline: jest.fn().mockResolvedValue((text: string) => ({
        data: new Float32Array(384).fill(0.1),
    })),
    env: {
        allowRemoteModels: true,
        allowLocalModels: true,
    },
}));

describe('SemanticSearchEngine', () => {
    let engine: SemanticSearchEngine;

    beforeEach(() => {
        engine = new SemanticSearchEngine();
        jest.clearAllMocks();
    });

    it('should initialize correctly', async () => {
        (RNFS.exists as jest.Mock).mockResolvedValue(false);
        await engine.initialize();
        expect(RNFS.mkdir).toHaveBeenCalledWith(expect.stringContaining('vector_db'));
    });

    it('should index documents', async () => {
        const docs = [
            { id: '1', text: 'hello world', source: 'test', nodeIndex: 0 },
        ];
        (RNFS.exists as jest.Mock).mockResolvedValue(true);

        await engine.indexDocuments(docs);

        expect(RNFS.writeFile).toHaveBeenCalled();
    });

    it('should search documents', async () => {
        // Setup state manually or via indexDocuments
        const docs = [
            { id: '1', text: 'hello world', source: 'test', nodeIndex: 0 },
            { id: '2', text: 'foo bar', source: 'test', nodeIndex: 1 },
            { id: '3', text: 'baz qux', source: 'test', nodeIndex: 2 },
        ];
        (RNFS.exists as jest.Mock).mockResolvedValue(true);

        await engine.indexDocuments(docs);

        const results = await engine.search('hello');

        expect(results.length).toBeGreaterThan(0);
        expect(results[0].id).toBe('1');
        expect(results[0].score).toBeGreaterThan(0);
    });
});
