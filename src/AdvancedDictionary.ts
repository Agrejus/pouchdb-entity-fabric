import { IIndexableEntity } from "./typings";

export class AdvancedDictionary<T> {

    private _data: IIndexableEntity<T[]> = {};
    private _key: string;
    private _enumeration: T[] = [];
    private _length: number = 0;

    get length() {
        return this._length;
    }

    constructor(key: keyof T) {
        this._key = key as string
    }

    push(...items: T[]) {
        for (let i = 0; i < items.length; i++) {
            const item: IIndexableEntity = items[i];
            const key = item[this._key];

            if (!this._data[key]) {
                this._data[key] = [];
            }

            this._data[key].push(item as T);
        }

        this._length += items.length;
        this._enumeration = [];
    }

    get(...entities: T[]) {
        const result: T[] = [];

        for (let i = 0; i < entities.length; i++) {
            const entity: IIndexableEntity = entities[i];
            const key = entity[this._key];
            const items = this._data[key];

            if (items != null) {
                result.push(...items);
            }
        }

        return result;
    }

    remove(...entities: T[]) {
        for (let i = 0; i < entities.length; i++) {
            const entity: IIndexableEntity = entities[i];
            const key = entity[this._key];
            delete this._data[key];
        }
        this._length -= entities.length;
        this._enumeration = [];
    }

    filter(predicate: (value: T, index: number, array: T[]) => boolean): T[] {

        if (this._enumeration.length === 0) {
            for (let key in this._data) {
                const data = this._data[key];
                this._enumeration.push(...data);
            }
        }

        return this._enumeration.filter(predicate);
    }
}