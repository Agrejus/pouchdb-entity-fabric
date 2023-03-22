export class IndexStore {

    private readonly _default: string | null = null;
    private _once: string | null = null;

    constructor(defaultName: string) {
        this._default = defaultName;
    }

    once(name: string) {
        this._once = name;
    }

    get(): string | null {
        if (this._once) {
            const result = this._once;
            this._once = null;
            return result;
        }

        return this._default
    }
}