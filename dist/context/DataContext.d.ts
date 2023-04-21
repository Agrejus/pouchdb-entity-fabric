import { AdvancedDictionary } from "../common/AdvancedDictionary";
import { IIndexApi } from "../indexing/IndexApi";
import { IPreviewChanges, IPurgeResponse } from "../types/common-types";
import { IDataContext, DataContextOptions } from "../types/context-types";
import { IDbSet } from "../types/dbset-types";
import { IDbRecordBase, IIndexableEntity } from "../types/entity-types";
import { PouchDbInteractionBase } from "./PouchDbInteractionBase";
import { AsyncCache } from '../cache/AsyncCache';
import { DbSetInitializer } from './dbset/builders/DbSetInitializer';
export declare class DataContext<TDocumentType extends string> extends PouchDbInteractionBase<TDocumentType> implements IDataContext {
    protected readonly PRISTINE_ENTITY_KEY = "__pristine_entity__";
    protected readonly DIRTY_ENTITY_MARKER = "__isDirty";
    static PROXY_MARKER: string;
    protected _removals: IDbRecordBase[];
    protected _additions: IDbRecordBase[];
    protected _attachments: AdvancedDictionary<IDbRecordBase>;
    protected _removeById: string[];
    private _configuration;
    protected asyncCache: AsyncCache;
    $indexes: IIndexApi;
    protected dbSets: {
        [key: string]: IDbSet<string, any>;
    };
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
    protected addDbSet(dbset: IDbSet<string, any>): void;
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
    private _mapInstance;
    private _mapAndSetDefaults;
    private _makeTrackable;
    private _getPendingChanges;
    previewChanges(): Promise<IPreviewChanges>;
    private _makePristine;
    private _getModifications;
    saveChanges(): Promise<number>;
    protected onBeforeSaveChanges(modifications: IDbRecordBase[]): Promise<void>;
    protected onAfterSetRev(entity: IIndexableEntity): void;
    protected onAfterSaveChanges(modifications: {
        adds: number;
        removes: number;
        updates: number;
    }): Promise<void>;
    /**
     * Starts the dbset fluent API.  Only required function call is create(), all others are optional
     * @returns {DbSetInitializer}
     */
    protected dbset(): DbSetInitializer<TDocumentType>;
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
            value: IDbSet<string, any, never>;
            done: boolean;
        };
    };
}
