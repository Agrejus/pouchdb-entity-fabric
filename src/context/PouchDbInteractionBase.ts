import PouchDB from 'pouchdb';
import { IBulkDocsResponse, IQueryParams } from "../types/common-types";
import { IDbRecordBase } from "../types/entity-types";
import { PouchDbBase } from "./PouchDbBase";

export abstract class PouchDbInteractionBase<TDocumentType extends string> extends PouchDbBase {

    constructor(name?: string, options?: PouchDB.Configuration.DatabaseConfiguration) {
        super(name, options);
    }

    /**
     * Does a bulk operation in the data store
     * @param entities 
     */
    protected async bulkDocs(entities: IDbRecordBase[]) {

        const response = await this.doWork(w => w.bulkDocs(entities));

        const result: {
            errors: { [key: string]: IBulkDocsResponse },
            errors_count: number,
            successes: { [key: string]: IBulkDocsResponse },
            successes_count: number
        } = {
            errors: {},
            successes: {},
            errors_count: 0,
            successes_count: 0
        };

        for (let item of response) {
            if ('error' in item) {
                const error = item as PouchDB.Core.Error;

                if (!error.id) {
                    continue;
                }

                result.errors_count += 1;
                result.errors[error.id] = {
                    id: error.id,
                    ok: false,
                    error: error.message,
                    rev: error.rev
                } as IBulkDocsResponse;
                continue;
            }

            const success = item as PouchDB.Core.Response;

            result.successes_count += 1;
            result.successes[success.id] = {
                id: success.id,
                ok: success.ok,
                rev: success.rev
            } as IBulkDocsResponse;
        }

        return result;
    }

    /**
     * Get entity from the data store, this is used by DbSet, will throw when an id is not found, very fast
     * @param ids 
     */
    protected async getStrict(...ids: string[]) {

        if (ids.length === 0) {
            return [];
        }

        const result = await this.doWork(w => w.bulkGet({ docs: ids.map(x => ({ id: x })) }));

        return result.results.map(w => {
            const result = w.docs[0];

            if ('error' in result) {
                throw new Error(`docid: ${w.id}, error: ${JSON.stringify(result.error, null, 2)}`)
            }

            return result.ok as IDbRecordBase;
        });
    }

    /**
     * Get entity from the data store, this is used by DbSet, will NOT throw when an id is not found, much slower than strict version
     * @param ids 
     */
    protected async get(...ids: string[]) {

        try {

            const result = await this.doWork(w => w.find({
                selector: {
                    _id: {
                        $in: ids
                    }
                }
            }), false);

            return result.docs as IDbRecordBase[];
        } catch (e) {

            if ('message' in e && e.message.includes("database is closed")) {
                throw e;
            }

            return [] as IDbRecordBase[];
        }
    }

    /**
     * Gets all data from the data store
     */
    protected async getAllData(payload?: IQueryParams<TDocumentType>) {

        try {
            const findOptions: PouchDB.Find.FindRequest<IDbRecordBase> = {
                selector: {},
            }

            if (payload?.documentType != null) {
                findOptions.selector.DocumentType = payload.documentType;
            }

            if (payload?.index != null) {
                findOptions.use_index = payload.index;
            }

            const result = await this.doWork(w => w.find(findOptions));

            return result.docs as IDbRecordBase[];
        } catch (e) {

            if ('message' in e && e.message.includes("database is closed")) {
                throw e;
            }

            return [] as IDbRecordBase[];
        }
    }
}