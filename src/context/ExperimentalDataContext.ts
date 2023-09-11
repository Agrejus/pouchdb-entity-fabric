import PouchDB from 'pouchdb';
import { parseDocumentReference } from '../common/LinkedDatabase';
import { EntityAndTag, IDbSet } from '../types/dbset-types';
import { IDbRecordBase, IIndexableEntity, ISplitDbRecord, SplitDocumentDocumentPropertyName, SplitDocumentPathPropertyName } from '../types/entity-types';
import { DataContext } from './DataContext';
import { ExperimentalDbSetInitializer } from './dbset/builders/ExperimentalDbSetInitializer';
import { DataContextOptions } from '../types/context-types';
import { IDatabaseStore } from '../types/store-types';
import { DatabaseStoreFactory } from '../store/DatabaseStoreFactory';

export class ExperimentalDataContext<TDocumentType extends string> extends DataContext<TDocumentType> {

    private _hasSplitDbSet: boolean | null = null;
    private _remappings: { [key: string]: { reference: IDbRecordBase, parent: IDbRecordBase } } = {}
    private _referencesToAddBack: { [key: string]: any } = {}
    private _databaseStore: IDatabaseStore;

    constructor(name?: string, options?: DataContextOptions) {
        super(name, options);
        this._databaseStore = DatabaseStoreFactory.getDataStore(this.asyncCache)
    }

    private async _validateSplitDocuments() {
        const cachedDatabaseNames = await this._databaseStore.getDatabaseNames();
        const list: string[] = [];

        for (const dbName of cachedDatabaseNames) {
            try {
                const wasDestroyed = await this._tryDestroyDatabase(new PouchDB(dbName));

                if (wasDestroyed === false) {
                    const allDocs = await this.query({
                        selector: {
                            referencePath: { $regex: new RegExp(dbName, "g") }
                        },
                        fields: ["_id"]
                    });

                    // check for orphaned docs
                    if (allDocs.docs.length === 0) {
                        const db = new PouchDB(dbName);
                        await db.destroy();
                        continue;
                    }

                    // contains data
                    list.push(dbName)
                }

            } catch {
                // swallow
            }
        }

        await this._databaseStore.upsertDatabaseName(...list)
    }

    private async _tryDestroyDatabase(db: PouchDB.Database<{}>) {
        const all = await db.allDocs({ include_docs: false });
        if (all.rows.length === 0) {

            this
            await db.destroy();
            return true;
        }

        return false;
    }

    private _getHasSplitDbSet() {

        if (this._hasSplitDbSet != null) {
            return this._hasSplitDbSet;
        }

        for (const dbset of this) {
            if ((dbset as IDbSet<TDocumentType, any>).info().SplitDbSetOptions.enabled === true) {
                this._hasSplitDbSet = true;
                return true
            }
        }

        this._hasSplitDbSet = false;

        return false;
    }

    protected override onAfterSetRev(indexableEntity: IIndexableEntity<any>) {
        // Remap Reference because we deleted it on save
        if (this._remappings[indexableEntity._id]) {

            const dbSet = this.dbSets[indexableEntity.DocumentType] as IDbSet<TDocumentType, any>;

            // only add back on save if its managed
            if (dbSet.info().SplitDbSetOptions.isManaged === true) {
                (this._remappings[indexableEntity._id].parent as ISplitDbRecord<any, any, any>).reference = this._remappings[indexableEntity._id].reference
            }

            if (this._referencesToAddBack[this._remappings[indexableEntity._id].reference?._id]) {
                (this._remappings[indexableEntity._id].parent as ISplitDbRecord<any, any, any>).reference = this._referencesToAddBack[this._remappings[indexableEntity._id].reference?._id];
            }
        }
    }

    protected override async onBeforeSaveChanges(getChanges: () => { adds: EntityAndTag[], removes: EntityAndTag[], updates: EntityAndTag[] }) {

        if (this._getHasSplitDbSet() === true) {

            const changes = getChanges();
            const { adds, removes, updates } = changes;
            const modifications = [
                ...adds.map(w => w.entity),
                ...removes.map(w => w.entity),
                ...updates.map(w => w.entity)
            ];
            const referenceModifications: { [key: string]: { hasRemovals: boolean, documents: IDbRecordBase[] } } = {};

            if (modifications.length > 0) {
                // keep the path and tear off the references
                for (const item of modifications) {

                    const dbSet = this.dbSets[item.DocumentType] as IDbSet<TDocumentType, any>;

                    if (dbSet.info().SplitDbSetOptions.enabled === false) {
                        // Skip changes on disabled db sets
                        continue;
                    }

                    const castedItem = (item as ISplitDbRecord<TDocumentType, any, any>);
                    const document = (castedItem[SplitDocumentDocumentPropertyName] ?? {}) as IDbRecordBase;
                    const referencePath = castedItem[SplitDocumentPathPropertyName] as string;

                    this._remappings[item._id] = { parent: item, reference: document }

                    const reference = parseDocumentReference(referencePath);

                    if (reference == null) {
                        continue;
                    }

                    if (document._id == null) {
                        (document as IIndexableEntity)._id = reference.selector.value;
                    }

                    if (dbSet.info().SplitDbSetOptions.isManaged === false) {
                        // Skip changes on dbset if unmanaged
                        this._referencesToAddBack[document._id] = castedItem[SplitDocumentDocumentPropertyName];
                        delete castedItem[SplitDocumentDocumentPropertyName];
                        continue;
                    }

                    const isDeletion = "_deleted" in castedItem;

                    if (isDeletion) {
                        delete (castedItem as any)[SplitDocumentPathPropertyName];
                    }

                    delete castedItem[SplitDocumentDocumentPropertyName];

                    if (!referenceModifications[reference.databaseName]) {
                        referenceModifications[reference.databaseName] = {
                            documents: [],
                            hasRemovals: false
                        }
                    }

                    if (referenceModifications[reference.databaseName].hasRemovals === false && "_deleted" in item) {
                        referenceModifications[reference.databaseName].hasRemovals = true;
                    }

                    // mark reference document for removal or not below
                    referenceModifications[reference.databaseName].documents.push(isDeletion === true ? { ...document, _deleted: true } as any : document);
                }
            }

            const cachedDatabaseNames = await this._databaseStore.getDatabaseNames();
            const dbList: Set<string> = new Set<string>(cachedDatabaseNames);

            for (const group in referenceModifications) {
                try {
                    const documents = referenceModifications[group].documents;
                    const referenceDb = new PouchDB(group);
                    dbList.add(group)

                    const deletions: { _id: string, _rev: string, _deleted?: boolean }[] = documents.filter((w: any) => ('_deleted' in w) === true && w._deleted === true);
                    const upserts = documents.filter(w => ('_deleted' in w) === false);
                    const readyDeletions = deletions.filter(w => w._rev != null);
                    const deletionsWithNoRev = deletions.filter(w => w._rev == null);

                    if (deletionsWithNoRev.length > 0) {

                        const resolvedDocuments = await referenceDb.find({
                            selector: {
                                _id: { $in: documents.filter(w => w._rev == null).map(w => w._id) }
                            },
                            fields: ["_id", "_rev"]
                        });

                        const resovledDeletions = resolvedDocuments.docs.map(w => ({ ...w, _deleted: true }))
                        readyDeletions.push(...resovledDeletions)
                    }

                    const referenceBulkDocsResponse = await referenceDb.bulkDocs([...upserts, ...readyDeletions]);
                    const referenceModificationResult = this.formatBulkDocsResponse(referenceBulkDocsResponse)

                    for (let i = 0; i < documents.length; i++) {
                        const document = documents[i];
                        const referenceToAddBack = this._referencesToAddBack[document._id];

                        if (referenceToAddBack != null) {
                            (document as IIndexableEntity)[SplitDocumentDocumentPropertyName] = referenceToAddBack
                        }

                        const found = referenceModificationResult.successes[document._id];

                        // update the rev in case we edit the record again
                        if (found && found.ok === true) {
                            const indexableEntity = document as IIndexableEntity;
                            indexableEntity._rev = found.rev;
                        }
                    }

                    if (referenceModifications[group].hasRemovals === true) {
                        const result = await this._tryDestroyDatabase(referenceDb);

                        if (result) {
                            dbList.delete(group)
                        }
                    }
                } catch (e: any) {
                    // Swallow error
                }
            }

            this._databaseStore.upsertDatabaseName(...dbList)
        }
    }


    protected override async onAfterSaveChanges(getChanges: () => { adds: EntityAndTag[]; removes: EntityAndTag[]; updates: EntityAndTag[]; }) {
        this._remappings = {};
        this._referencesToAddBack = {}

        await this._validateSplitDocuments();
    }

    /**
     * Starts the dbset fluent API.  Only required function call is create(), all others are optional
     * @returns {DbSetInitializer}
     */
    protected experimentalDbset(): ExperimentalDbSetInitializer<TDocumentType> {
        return new ExperimentalDbSetInitializer<TDocumentType>(this.addDbSet.bind(this), this);
    }
}