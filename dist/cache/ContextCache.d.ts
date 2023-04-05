import { IContextCache } from '../types/cache-types';
declare class ContextCache implements IContextCache {
    private _data;
    upsert(key: string, value: any): void;
    remove(key: string): void;
    get<T extends any>(key: string): T;
    contains(key: string): boolean;
}
export declare const cache: ContextCache;
export {};
