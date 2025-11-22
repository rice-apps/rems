declare module 'hnsw-lite' {
    export class HNSW {
        constructor(maxLayers: number, maxEdges: number, distanceFunction?: string | Function);
        add(id: string, vector: number[]): void;
        addBulk(bulkData: [string, number[]][]): void;
        remove(nodeId: string): void;
        query(queryVector: number[], nClosest?: number): string[];
        toJSON(): object;
        static rebuildFromJSON(json: object): HNSW;
    }
}
