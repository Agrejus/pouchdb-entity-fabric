import PouchDB from 'pouchdb';
import { AdvancedDictionary } from '../common/AdvancedDictionary';
import { IPurgeResponse, IPreviewChanges } from './common-types';
import { IDbSetApi } from './dbset-types';
import { IDbRecordBase } from './entity-types';

export type Work = <T>(action: (db: PouchDB.Database) => Promise<T>, shouldClose?: boolean) => Promise<T>;

export type DataContextEventCallback<TDocumentType> = ({ DocumentType }: { DocumentType: TDocumentType }) => void;
export type DataContextEvent = 'entity-created' | 'entity-removed' | 'entity-updated';

export type DatabaseConfigurationAdditionalConfiguration = {

}

export type DataContextOptions = PouchDB.Configuration.DatabaseConfiguration & DatabaseConfigurationAdditionalConfiguration;

export interface IDataContext {

    /**
     * Persist changes to the underlying data store.  Returns number of documents modified
     * @returns {Promise<number>}
     */
    saveChanges(): Promise<number>;

    /**
     * Get all documents in the underlying data store
     * @returns {Promise<IDbRecordBase[]>}
     */
    getAllDocs(): Promise<IDbRecordBase[]>;

    /**
     * Check to see if there are any unsaved changes
     * @returns {boolean}
     */
    hasPendingChanges(): boolean;

    /**
     * Enable DataContext speed optimizations.  Needs to be run once per application per database.  Typically, this should be run on application start.
     * @returns {Promise<void>}
     */
    optimize(): Promise<void>;

    /**
     * Remove all entities from all DbSets in the data context, saveChanges must be called to persist these changes to the store
     * @returns {Promise<void>}
     */
    empty(): Promise<void>;

    /**
     * Destroy Pouch Database
     * @returns {Promise<void>}
     */
    destroyDatabase(): Promise<void>;

    /**
     * Will purge all _deleted documents from the data
     * @param purgeType "memory" purge will replicate to an in-memory db, then back to the original db.  "disk" will replicate to a new db on the device and then back to the original db.  There is less chance for data loss with "disk" vs "memory" if the app were to be closed or crash during replication.
     * @returns {Promise<IPurgeResponse>}
     */
    purge(purgeType: "memory" | "disk"): Promise<IPurgeResponse>

    /**
     * Will list changes that will be persisted.  Changes are add, remove, update.  NOTE:  This is a copy of the changes, changes made will not be persisted
     * @returns {Promise<IPreviewChanges>}
     */
    previewChanges(): Promise<IPreviewChanges>
}

export interface ITrackedData {
    add: IDbRecordBase[];
    remove: IDbRecordBase[];
    attach: AdvancedDictionary<IDbRecordBase>;
    removeById: string[]
}

export interface IPrivateContext<TDocumentType extends string> extends IDataContext {
    _getApi: () => IDbSetApi<TDocumentType>;
}