/// <reference types="pouchdb-find" />
/// <reference types="pouchdb-core" />
/// <reference types="pouchdb-mapreduce" />
/// <reference types="pouchdb-replication" />
import { AdvancedDictionary } from "../common/AdvancedDictionary";
import { DbSetBuilder } from "./dbset/DbSetBuilder";
import { IIndexApi } from "../indexing/IndexApi";
import { IPreviewChanges, IPurgeResponse } from "../types/common-types";
import { IDataContext, DataContextOptions } from "../types/context-types";
import { IDbSetBase, IDbSet } from "../types/dbset-types";
import { IDbRecordBase, IDbRecord, ISplitDbRecord } from "../types/entity-types";
import { PouchDbInteractionBase } from "./PouchDbInteractionBase";
export declare class DataContext<TDocumentType extends string> extends PouchDbInteractionBase<TDocumentType> implements IDataContext {
    protected readonly PRISTINE_ENTITY_KEY = "__pristine_entity__";
    protected readonly DIRTY_ENTITY_MARKER = "__isDirty";
    static PROXY_MARKER: string;
    protected _removals: IDbRecordBase[];
    protected _additions: IDbRecordBase[];
    protected _attachments: AdvancedDictionary<IDbRecordBase>;
    protected _removeById: string[];
    private _configuration;
    private _hasReferenceDbSet;
    private _asyncCache;
    $indexes: IIndexApi;
    private _dbSets;
    constructor(name?: string, options?: DataContextOptions);
    getAllDocs(): Promise<IDbRecordBase[]>;
    /**
     * Enable DataContext speed optimizations.  Needs to be run once per application per database.  Typically, this should be run on application start.
     * @returns void
     */
    optimize(): Promise<void>;
    /**
     * Gets an instance of IDataContext to be used with DbSets
     */
    protected getContext(): this;
    /**
     * Gets an API to be used by DbSets
     * @returns IData
     */
    private _getApi;
    private _addDbSet;
    /**
     * Used by the context api
     * @param data
     */
    private _detach;
    /**
     * Used by the context api
     * @param data
     */
    private _sendData;
    /**
     * Used by the context api
     */
    private _getTrackedData;
    private _reinitialize;
    /**
     * Provides equality comparison for Entities
     * @param first
     * @param second
     * @returns boolean
     */
    private areEqual;
    private _map;
    private _makeTrackable;
    private _getPendingChanges;
    previewChanges(): Promise<IPreviewChanges>;
    private _makePristine;
    private _getModifications;
    private _getCachedTempDbs;
    private _setCachedTempDbs;
    validateCache(): Promise<void>;
    private _tryDestroyDatabase;
    saveChanges(): Promise<number>;
    protected onAfterSaveChanges(modifications: {
        adds: number;
        removes: number;
        updates: number;
    }): Promise<void>;
    /**
     * Starts the dbset fluent API.  Only required function call is create(), all others are optional
     * @param documentType Document Type for the entity
     * @returns {DbSetBuilder}
     */
    protected dbset<TEntity extends IDbRecord<TDocumentType>>(documentType: TDocumentType): DbSetBuilder<TDocumentType, TEntity, never, IDbSet<TDocumentType, TEntity, never>>;
    protected splitDbSet<TSplitDocumentType extends string, TSplitEntity extends IDbRecord<TSplitDocumentType>, TEntity extends ISplitDbRecord<TDocumentType, TSplitDocumentType, TSplitEntity>>(documentType: TDocumentType): DbSetBuilder<TDocumentType, TEntity, "referencePath" | "reference._id" | "reference._rev" | "reference.DocumentType", IDbSet<TDocumentType, TEntity, "referencePath" | "reference._id" | "reference._rev" | "reference.DocumentType">>;
    query<TEntity extends IDbRecord<TDocumentType>>(callback: (provider: PouchDB.Database) => Promise<TEntity[]>): Promise<TEntity[]>;
    hasPendingChanges(): boolean;
    empty(): Promise<void>;
    destroyDatabase(): Promise<void>;
    purge(purgeType?: "memory" | "disk"): Promise<IPurgeResponse>;
    static asUntracked<T extends IDbRecordBase>(...entities: T[]): T[];
    static isProxy(entities: IDbRecordBase): boolean;
    static isDate(value: any): boolean;
    static merge<T extends IDbRecordBase>(to: T, from: T, options?: {
        skip?: string[];
    }): void;
    [Symbol.iterator](): {
        next: () => {
            value: IDbSetBase<string>;
            done: boolean;
        };
    };
}
