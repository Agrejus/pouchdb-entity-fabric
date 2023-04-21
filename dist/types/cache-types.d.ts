export interface IContextCache {
    upsert(key: string, value: any): void;
    remove(key: string): void;
}
export declare enum CacheKeys {
    IsOptimized = "IsOptimized"
}
