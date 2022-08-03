/// <reference types="pouchdb-find" />
import { Work } from './typings';
export interface IIndexApi {
    all(): Promise<PouchDB.Find.Index[]>;
    find(selector: (index: PouchDB.Find.Index) => boolean): Promise<PouchDB.Find.Index | undefined>;
    filter(selector: (index: PouchDB.Find.Index) => boolean): Promise<PouchDB.Find.Index[]>;
    remove(index: PouchDB.Find.DeleteIndexOptions): Promise<PouchDB.Find.DeleteIndexResponse<{}>>;
    create(creator: (factory: IIndexFactory) => void): Promise<PouchDB.Find.CreateIndexResponse<{}>>;
}
export declare class IndexApi implements IIndexApi {
    private readonly _doWork;
    constructor(doWork: Work);
    all(): Promise<PouchDB.Find.Index[]>;
    find(selector: (index: PouchDB.Find.Index) => boolean): Promise<PouchDB.Find.Index>;
    filter(selector: (index: PouchDB.Find.Index) => boolean): Promise<PouchDB.Find.Index[]>;
    create(creator: (factory: IIndexFactory) => void): Promise<PouchDB.Find.CreateIndexResponse<{}>>;
    remove(index: PouchDB.Find.DeleteIndexOptions): Promise<PouchDB.Find.DeleteIndexResponse<{}>>;
}
interface IIndexFactory {
    fields(creator: (factory: KeyFactory) => void): IIndexFactory;
    designDocumentName(name: string): IIndexFactory;
    name(name: string): IIndexFactory;
}
interface IKeyFactory {
    add(name: string): IKeyFactory;
}
declare class KeyFactory implements IKeyFactory {
    private readonly _fields;
    get Fields(): string[];
    add(name: string): this;
}
export {};
