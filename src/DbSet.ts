import { EntitySelector, IDbRecord, IDbRecordBase, IDbSet, OmittedEntity, IDbSetProps, IDbSetEnumerable } from './typings';
import { AdapterFactory } from './adapters/AdapterFactory';
import { IDbSetDestructionAdapter, IDbSetFetchAdapter, IDbSetGeneralAdapter, IDbSetIndexAdapter, IDbSetModificationAdapter } from './adapters/types';

/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export class DbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> implements IDbSet<TDocumentType, TEntity, TExtraExclusions> {

    private readonly _destructionAdapter: IDbSetDestructionAdapter<TDocumentType, TEntity, TExtraExclusions>;
    private readonly _fetchAdapter: IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions>;
    private readonly _generalAdapter: IDbSetGeneralAdapter<TDocumentType, TEntity, TExtraExclusions>;
    private readonly _indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>;
    private readonly _modificationAdapter: IDbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions>;

    /**
     * Constructor
     * @param props Properties for the constructor
     */
    constructor(props: IDbSetProps<TDocumentType, TEntity>) {
        const adapterFactory = new AdapterFactory<TDocumentType, TEntity, TExtraExclusions>(props);

        this._destructionAdapter = adapterFactory.createDestructionAdapter();
        this._fetchAdapter = adapterFactory.createFetchAdapter();
        this._generalAdapter = adapterFactory.createGeneralAdapter();
        this._indexAdapter = adapterFactory.createIndexAdapter();
        this._modificationAdapter = adapterFactory.createModificationAdapter();
    }

    info() {
        return this._generalAdapter.info();
    }

    instance(...entities: OmittedEntity<TEntity, TExtraExclusions>[]) {
        return this._modificationAdapter.instance(...entities);
    }

    async add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]) {
        return await this._modificationAdapter.add(...entities);
    }

    async upsert(...entities: (OmittedEntity<TEntity, TExtraExclusions> | Omit<TEntity, "DocumentType">)[]) {
        return await this._modificationAdapter.upsert(...entities);
    }

    async remove(...ids: string[]): Promise<void>;
    async remove(...entities: TEntity[]): Promise<void>;
    async remove(...entities: any[]) {
        return await this._destructionAdapter.remove(...entities);
    }

    useIndex(name: string): IDbSetEnumerable<TDocumentType, TEntity, TExtraExclusions> {
        this._indexAdapter.useIndex(name);
        return this;
    }

    async empty() {
        await this._destructionAdapter.empty();
    }

    async all() {
        return await this._fetchAdapter.all();
    }

    async filter(selector: EntitySelector<TDocumentType, TEntity>) {
        return await this._fetchAdapter.filter(selector);
    }

    isMatch(first: TEntity, second: any) {
        return this._generalAdapter.isMatch(first, second);
    }

    match(...items: IDbRecordBase[]) {
        return this._generalAdapter.match(...items);
    }

    async get(...ids: string[]) {
        return await this._fetchAdapter.get(...ids);
    }

    async find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined> {
        return await this._fetchAdapter.find(selector);
    }

    unlink(...entities: TEntity[]) {
        this._generalAdapter.unlink(...entities);
    }

    async markDirty(...entities: TEntity[]) {
        return await this._generalAdapter.markDirty(...entities);
    }

    async link(...entities: TEntity[]) {
        return await this._generalAdapter.link(...entities);
    }

    async first() {
        return await this._fetchAdapter.first();
    }

    // on(event: "add", callback: DbSetEventCallback<TDocumentType, TEntity>): void;
    // on(event: "remove", callback: DbSetEventCallback<TDocumentType, TEntity> | DbSetIdOnlyEventCallback): void;
    // on(event: "remove-invoked", callback: DbSetEventCallbackAsync<TDocumentType, TEntity> | DbSetIdOnlyEventCallbackAsync): void;
    // on(event: "add-invoked", callback: DbSetEventCallbackAsync<TDocumentType, TEntity>): void;
    // on(event: DbSetEvent | DbSetAsyncEvent, callback: any) {

    //     if (event === 'add-invoked' || event === "remove-invoked") {
    //         this._asyncEvents[event].push(callback)
    //         return;
    //     }

    //     this._events[event].push(callback);
    // }
}