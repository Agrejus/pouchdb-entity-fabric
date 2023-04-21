export declare class IndexStore {
    private readonly _default;
    private _once;
    constructor(defaultName: string);
    once(name: string): void;
    get(): string | null;
}
