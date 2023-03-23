export interface IContextCache {
    upsert(key: string, value: any): void;
    remove(key: string): void;
}

export enum CacheKeys {
    IsOptimized = "IsOptimized"
}