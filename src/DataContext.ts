/// <reference path="./DataContext.d.ts" />
import PouchDB from 'pouchdb';
import { DbSet, IIndexableEntity, PRISTINE_ENTITY_KEY } from "./DbSet";
import findAdapter from 'pouchdb-find';

PouchDB.plugin(findAdapter);

export class DataContext<TDocumentType extends string> implements IDataContext {

    protected _db: PouchDB.Database;
    protected _removals: IDbRecordBase[] = [];
    protected _additions: IDbRecordBase[] = [];
    protected _attachments: IDbRecordBase[] = [];
    protected _removeById: string[] = [];
    protected _collectionName!: string;

    private _dbSets: IDbSetBase<string>[] = [];

    constructor(name?: string, options?: PouchDB.Configuration.DatabaseConfiguration) {
        this._db = new PouchDB(name, options);
    }

    /**
     * Gets all data from the data store
     */
    protected async getAllData(documentType?: TDocumentType) {

        const findOptions: PouchDB.Find.FindRequest<IDbRecordBase> = {
            selector: {
                collectiontype: this._collectionName
            }
        }

        if (documentType != null) {
            findOptions.selector.DocumentType = documentType;
        }

        const result = await this._db.find(findOptions);

        return result.docs as IDbRecordBase[];
    }

    async getAllDocs() {
        return this.getAllData();
    }

    /**
     * Gets an instance of IDataContext to be used with DbSets
     */
    protected getContext() { return this; }

    /**
     * Inserts entity into the data store, this is used by DbSet
     * @param entity 
     * @param onComplete 
     */
    protected async insertEntity(entity: IDbAdditionRecord<any>, onComplete?: (result: IDbRecord<any>) => void) {
        const response = await this._db.post(entity);
        const result: IDbRecord<any> = entity as any;

        (result as any)._rev = response.rev;

        if (!result._id) {
            (result as any)._id = response.id;
        }

        if (onComplete != null) {
            onComplete(result);
        }

        return response.ok;
    }

    /**
     * Updates entity in the data store, this is used by DbSet
     * @param entity 
     * @param onComplete 
     */
    protected async updateEntity(entity: IDbRecordBase, onComplete: (result: IDbRecord<any>) => void): Promise<boolean> {

        try {
            const response = await this._db.put(entity);
            const result: IDbRecord<any> = entity as any;

            (result as any)._rev = response.rev;

            onComplete(result);

            return response.ok;
        } catch {
            const found = await this.getEntity(entity._id);

            const result: IDbRecord<any> = entity as any;

            (result as any)._rev = found!._id;

            const response = await this._db.put(result);

            (result as any)._rev = response.rev;

            onComplete(result);

            return response.ok;
        }
    }

    /**
     * Does a bulk operation in the data store
     * @param entities 
     */
    protected async bulkDocs(entities: IDbRecordBase[]): Promise<IBulkDocsResponse[]> {

        const response = await this._db.bulkDocs(entities);

        return response.map(w => {

            if ('error' in w) {
                const error = w as PouchDB.Core.Error;

                return {
                    id: error.id,
                    ok: false,
                    error: error.message,
                    rev: error.rev
                } as IBulkDocsResponse;
            }

            const success = w as PouchDB.Core.Response;

            return {
                id: success.id,
                ok: success.ok,
                rev: success.rev
            } as IBulkDocsResponse
        });
    }

    /**
     * Remove entity in the data store, this is used by DbSet
     * @param entity 
     */
    protected async removeEntity(entity: IDbRecordBase) {
        const response = await this._db.remove(entity as any);
        return response.ok;
    }

    /**
     * Remove entity in the data store, this is used by DbSet
     * @param entity 
     */
    protected async removeEntityById(id: string) {
        const entity = await this._db.get(id);
        const response = await this._db.remove(entity);
        return response.ok;
    }

    /**
     * Get entity from the data store, this is used by DbSet
     * @param id 
     */
    protected async getEntity(id: string) {
        try {
            return await this._db.get<IDbRecordBase>(id);
        } catch (e) {
            return null
        }
    }

    /**
     * Gets an API to be used by DbSets
     * @returns IData
     */
    private _getApi(): IDbSetApi<TDocumentType> {
        return {
            getTrackedData: this._getTrackedData.bind(this),
            getAllData: this.getAllData.bind(this),
            send: this._sendData.bind(this),
            detach: this._detach.bind(this)
        }
    }

    /**
     * Used by the context api
     * @param data 
     * @param matcher 
     */
     private _detach(data: IDbRecordBase[], matcher: (first: IDbRecordBase, second: IDbRecordBase) => boolean) {

        const result = [];
        for (let i = 0; i < data.length; i++) {
            const detachment = data[i];
            const index = this._attachments.findIndex(w => matcher(detachment, w));

            if (index === -1) {
                continue;
            }

            const clone: IDbRecordBase = JSON.parse(JSON.stringify(this._attachments[index]));

            this._attachments[index] = clone;

            result.push(clone);
        }

        return result;
    }

    /**
     * Used by the context api
     * @param data 
     */
    private _sendData(data: IDbRecordBase[]) {
        this._attachments = [...this._attachments, ...data].filter((w, i, self) => self.indexOf(w) === i);
    }

    /**
     * Used by the context api
     */
    private _getTrackedData() {
        return {
            add: this._additions,
            remove: this._removals,
            attach: this._attachments,
            removeById: this._removeById
        } as ITrackedData;
    }

    private reinitialize() {
        this._additions = [];
        this._removals = [];
        this._removeById = [];
    }

    /**
     * Provides equality comparison for Entities
     * @param first 
     * @param second 
     * @returns boolean
     */
    private areEqual(first: IDbRecordBase, second: IDbRecordBase) {

        if (!first && !second) {
            return true;
        }

        if (!first || !second) {
            return false;
        }

        const skip = ["_id", "_rev"];
        const keys = Object.keys(first).filter(w => skip.includes(w) === false);

        return keys.some(w => {
            const firstPropertyValue = (first as any)[w];
            const secondPropertyValue = (second as any)[w];

            if (Array.isArray(firstPropertyValue) && Array.isArray(secondPropertyValue)) {
                return firstPropertyValue.length === secondPropertyValue.length && firstPropertyValue.every((val, index) => val === secondPropertyValue[index]);
            }

            return (first as any)[w] != (second as any)[w]
        }) === false;
    }

    /**
     * Persist changes to the underlying data store
     * @returns number
     */
    async saveChanges() {
        try {

            const data = this._getTrackedData();
            const { add, remove, removeById } = data;

            // Check to see if we have any updates, let's not needlessly update
            // if we don't need to
            const updated = this._attachments.filter(w => {

                const indexableEntity = w as IIndexableEntity;
                if (indexableEntity[PRISTINE_ENTITY_KEY] === undefined) {
                    return false;
                }

                const pristineKeys = Object.keys(indexableEntity[PRISTINE_ENTITY_KEY]);

                for (let pristineKey of pristineKeys) {
                    if (indexableEntity[PRISTINE_ENTITY_KEY][pristineKey] != indexableEntity[pristineKey]) {
                        return true
                    }
                }

                return false;
            }).map(w => {
                const indexableEntity = w as IIndexableEntity;
                delete indexableEntity[PRISTINE_ENTITY_KEY];

                // remove the pristine entity, this will get re-added 
                // after any change happens because this is a proxy
                return indexableEntity as IDbRecordBase;
            });

            const addsWithIds = add.filter(w => !!w._id);
            const addsWithoutIds = add.filter(w => w._id == null);
            const modifications = [...updated, ...addsWithIds, ...remove.map(w => ({ ...w, _deleted: true }))];
            const modificationResult = await this.bulkDocs(modifications);
            const successfulModifications = modificationResult.filter(w => w.ok === true);

            for (let modification of modifications) {
                const found = successfulModifications.find(w => w.id === modification._id);

                // update the rev in case we edit the record again
                if (found && found.ok === true) {
                    (modification as any)._rev = found.rev;
                }
            }

            const additionsWithGeneratedIds = await Promise.all(addsWithoutIds.map(w => this.addEntityWithoutId(w)))
            const removalsById = await Promise.all(removeById.map(w => this.removeEntityById(w)));

            this.reinitialize()

            return [...removalsById, ...additionsWithGeneratedIds, ...modificationResult.map(w => w.ok)].filter(w => w === true).length;
        } catch (e) {
            this.reinitialize()
            throw e;
        }
    }

    protected addEntityWithoutId(entity: IDbRecordBase) {
        return new Promise<IBulkDocsResponse>(async (resolve, reject) => {
            try {
                const result = await this.insertEntity(entity);
                resolve({ ok: result, id: "", rev: "" })
            } catch (e) {
                console.error(e);
                reject({ ok: false, id: "", rev: "" })
            }
        })
    }

    protected createDbSet<TEntity>(documentType: TDocumentType, ...idKeys: IdKeys<TEntity>): IDbSet<TDocumentType, TEntity, IDbRecord<TDocumentType>> {
        const dbSet = new DbSet<TDocumentType, TEntity, IDbRecord<TDocumentType>>(documentType, this, ...idKeys);

        this._dbSets.push(dbSet);

        return dbSet;
    }

    async query<TEntity, TEntityType extends IDbRecord<TDocumentType> = IDbRecord<TDocumentType>>(callback: (provider: PouchDB.Database) => Promise<(TEntity & TEntityType)[]>) {
        return await callback(this._db);
    }

    [Symbol.iterator]() {
        let index = -1;
        const data = this._dbSets;

        return {
            next: () => ({ value: data[++index], done: !(index in data) })
        };
    }
}