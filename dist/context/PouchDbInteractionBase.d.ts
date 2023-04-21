/// <reference types="pouchdb-core" />
/// <reference types="pouchdb-find" />
import { IBulkDocsResponse, IQueryParams } from "../types/common-types";
import { IDbRecordBase } from "../types/entity-types";
import { PouchDbBase } from "./PouchDbBase";
export declare abstract class PouchDbInteractionBase<TDocumentType extends string> extends PouchDbBase {
    constructor(name?: string, options?: PouchDB.Configuration.DatabaseConfiguration);
    protected formatBulkDocsResponse(response: (PouchDB.Core.Response | PouchDB.Core.Error)[]): {
        errors: {
            [key: string]: IBulkDocsResponse;
        };
        errors_count: number;
        successes: {
            [key: string]: IBulkDocsResponse;
        };
        successes_count: number;
    };
    /**
     * Does a bulk operation in the data store
     * @param entities
     */
    protected bulkDocs(entities: IDbRecordBase[]): Promise<{
        errors: {
            [key: string]: IBulkDocsResponse;
        };
        errors_count: number;
        successes: {
            [key: string]: IBulkDocsResponse;
        };
        successes_count: number;
    }>;
    /**
     * Get entity from the data store, this is used by DbSet, will throw when an id is not found, very fast
     * @param ids
     */
    protected getStrict(...ids: string[]): Promise<IDbRecordBase[]>;
    /**
     * Get entity from the data store, this is used by DbSet, will NOT throw when an id is not found, much slower than strict version
     * @param ids
     */
    protected get(...ids: string[]): Promise<IDbRecordBase[]>;
    protected query(selector: PouchDB.Find.FindRequest<{}>): Promise<PouchDB.Find.FindResponse<{}>>;
    protected find(selector: PouchDB.Find.FindRequest<{}>): Promise<IDbRecordBase[]>;
    /**
     * Gets all data from the data store
     */
    protected getAllData(payload?: IQueryParams<TDocumentType>): Promise<IDbRecordBase[]>;
}
