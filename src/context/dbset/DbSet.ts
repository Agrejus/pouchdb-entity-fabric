import { AdapterFactory } from '../../adapters/AdapterFactory';
import { IDbSetFetchAdapter, IDbSetGeneralAdapter, IDbSetIndexAdapter, IDbSetModificationAdapter } from '../../types/adapter-types';
import { DeepPartial, EntitySelector } from '../../types/common-types';
import { IDbSetProps, IDbSetEnumerable, IDbSet } from '../../types/dbset-types';
import { IDbRecord, OmittedEntity, IDbRecordBase } from '../../types/entity-types';

/**
 * Data Collection for set of documents with the same type.  To be used inside of the DbContext
 */
export class DbSet<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> implements IDbSet<TDocumentType, TEntity, TExtraExclusions> {

    protected readonly _fetchAdapter: IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions>;
    protected readonly _generalAdapter: IDbSetGeneralAdapter<TDocumentType, TEntity, TExtraExclusions>;
    protected readonly _indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>;
    protected readonly _modificationAdapter: IDbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions>;

    get types() {
        return {
            modify: {} as OmittedEntity<TEntity, TExtraExclusions>,
            result: {} as TEntity,
            documentType: {} as TEntity["DocumentType"],
            map: {} as { [DocumentType in TEntity["DocumentType"]]: TEntity }
        }
    }

    /**
     * Constructor
     * @param props Properties for the constructor
     */
    constructor(props: IDbSetProps<TDocumentType, TEntity>) {
        const adapterFactory = new AdapterFactory<TDocumentType, TEntity, TExtraExclusions>(props);

        this._indexAdapter = adapterFactory.createIndexAdapter();
        this._fetchAdapter = adapterFactory.createFetchAdapter(this._indexAdapter);
        this._generalAdapter = adapterFactory.createGeneralAdapter();
        this._modificationAdapter = adapterFactory.createModificationAdapter(this._indexAdapter);
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
        return await this._modificationAdapter.remove(...entities);
    }

    useIndex(name: string): IDbSetEnumerable<TDocumentType, TEntity> {
        this._indexAdapter.useIndex(name);
        return this;
    }

    async empty() {
        await this._modificationAdapter.empty();
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

    async query(request: DeepPartial<PouchDB.Find.FindRequest<TEntity>>) {

        const defaultRequest: PouchDB.Find.FindRequest<TEntity> = {
            selector: {
                DocumentType: this.info().DocumentType
            }
        }

        const mergedRequest = this.merge(request as PouchDB.Find.FindRequest<TEntity>, defaultRequest)

        return await this._fetchAdapter.query(mergedRequest);
    }

    private merge(target: PouchDB.Find.FindRequest<TEntity>, source: PouchDB.Find.FindRequest<TEntity>) {

        // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties
        // https://gist.github.com/ahtcx/0cd94e62691f539160b32ecda18af3d6
        for (const key of Object.keys(source)) {
            if ((source as any)[key] instanceof Object) {
                Object.assign((source as any)[key], this.merge((target as any)[key], (source as any)[key]))
            }
        }

        // Join `target` and modified `source`
        Object.assign(target || {}, source)
        return target
    }
}