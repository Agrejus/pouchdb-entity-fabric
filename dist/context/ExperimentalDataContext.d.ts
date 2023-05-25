import { IDbRecordBase, IIndexableEntity } from '../types/entity-types';
import { DataContext } from './DataContext';
import { ExperimentalDbSetInitializer } from './dbset/builders/ExperimentalDbSetInitializer';
import { DataContextOptions } from '../types/context-types';
export declare class ExperimentalDataContext<TDocumentType extends string> extends DataContext<TDocumentType> {
    private _hasSplitDbSet;
    private _remappings;
    private _referencesToAddBack;
    private _databaseStore;
    constructor(name?: string, options?: DataContextOptions);
    private _validateSplitDocuments;
    private _tryDestroyDatabase;
    private _getHasSplitDbSet;
    protected onAfterSetRev(indexableEntity: IIndexableEntity<any>): void;
    protected onBeforeSaveChanges(modifications: IDbRecordBase[]): Promise<void>;
    protected onAfterSaveChanges(getChanges: () => {
        adds: IDbRecordBase[];
        removes: IDbRecordBase[];
        updates: IDbRecordBase[];
    }): Promise<void>;
    /**
     * Starts the dbset fluent API.  Only required function call is create(), all others are optional
     * @returns {DbSetInitializer}
     */
    protected experimentalDbset(): ExperimentalDbSetInitializer<TDocumentType>;
}
