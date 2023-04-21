import { IContextCache } from '../types/cache-types';

class ContextCache implements IContextCache {

    private _data: { [key: string]: any } = {}

    upsert(key: string, value: any) {
        this._data[key] = value
    }

    remove(key: string) {
        delete this._data[key];
    }

    get<T extends any>(key: string) {
        return this._data[key] as T | null
    }

    contains(key: string) {
        return this._data[key] != null;
    }
}

export const cache: ContextCache = new ContextCache();