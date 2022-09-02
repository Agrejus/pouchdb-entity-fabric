import { Work } from './typings';

export interface IIndexApi {
    all(): Promise<PouchDB.Find.Index[]>;
    find(selector: (index: PouchDB.Find.Index) => boolean): Promise<PouchDB.Find.Index | undefined>;
    filter(selector: (index: PouchDB.Find.Index) => boolean): Promise<PouchDB.Find.Index[]>;
    remove(index: PouchDB.Find.DeleteIndexOptions): Promise<PouchDB.Find.DeleteIndexResponse<{}>>;
    create(creator: (factory: IIndexFactory) => void): Promise<PouchDB.Find.CreateIndexResponse<{}>>;
}

export class IndexApi implements IIndexApi {

    private readonly _doWork: Work;

    constructor(doWork: Work) {
        this._doWork = doWork;
    }

    async all() {
        return this._doWork(async w => {
            const response = await w.getIndexes();

            return response.indexes;
        })
    }

    async find(selector: (index: PouchDB.Find.Index) => boolean) {
        return this._doWork(async w => {
            const response = await w.getIndexes();

            return response.indexes.find(selector);
        })
    }

    async filter(selector: (index: PouchDB.Find.Index) => boolean) {
        return this._doWork(async w => {
            const response = await w.getIndexes();

            return response.indexes.filter(selector);
        })
    }

    async create(creator: (factory: IIndexFactory) => void) {

        return this._doWork(w => {

            const instance = new IndexFactory();
            creator(instance);

            const ddoc = instance.DesignDocumentName;
            const name = instance.Name;
            const fields = instance.Creator.Fields;

            return w.createIndex({
                index: {
                    fields,
                    ddoc,
                    name
                }
            })
        })
    }

    async remove(index: PouchDB.Find.DeleteIndexOptions) {
        return this._doWork(w => w.deleteIndex(index))
    }
}

interface IIndexFactory {
    fields(creator: (factory: IKeyFactory) => void): IIndexFactory;

    /**
     * This is the name to use for useIndex
     * @param name Name
     * @returns 
     */
    designDocumentName(name: string): IIndexFactory;
    name(name: string): IIndexFactory;
}

class IndexFactory implements IIndexFactory {

    get Name() { return this._name; }
    get DesignDocumentName() { return this._designDocumentName; }
    get Creator() { return this._creator; }

    private _creator: KeyFactory;
    private _name?: string;
    private _designDocumentName?: string;

    fields(creator: (factory: IKeyFactory) => void) {
        const instance = new KeyFactory();
        creator(instance);

        this._creator = instance;
        return this;
    }

    designDocumentName(name: string) {
        this._designDocumentName = name;
        return this;
    }

    name(name: string) {
        this._name = name;
        return this;
    }
}

interface IKeyFactory {
    add(name: string): IKeyFactory;
}

class KeyFactory implements IKeyFactory {

    private readonly _fields: string[] = [];

    get Fields() { return this._fields; }

    add(name: string) {
        this._fields.push(name);
        return this;
    }
}


//     $indexes.
//     all()
//     find()
//     create(name:string)
//         fields(w => w.add())
//     remove(name:string)