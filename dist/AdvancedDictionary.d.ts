export declare class AdvancedDictionary<T> {
    private _data;
    private _key;
    private _enumeration;
    private _length;
    get length(): number;
    constructor(key: keyof T);
    push(...items: T[]): void;
    get(...entities: T[]): T[];
    remove(...entities: T[]): void;
    filter(predicate: (value: T, index: number, array: T[]) => boolean): T[];
    forEach(callback: (value: T) => void): void;
}
