import { IDbSetFetchAdapter, IDbSetIndexAdapter } from '../types/adapter-types';
import { EntitySelector } from '../types/common-types';
import { IDbSetProps } from '../types/dbset-types';
import { IDbRecord } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';

export class DbSetFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions> {

    protected indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>;

    constructor(props: IDbSetProps<TDocumentType, TEntity>, indexAdapter: IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions>) {
        super(props);
        this.indexAdapter = indexAdapter;
    }

    async filter(selector: EntitySelector<TDocumentType, TEntity>) {
        const getIndex = this.indexAdapter.get.bind(this.indexAdapter);
        const data = await this.allDataAndMakeTrackable(getIndex);

        const result = [...data].filter(selector);

        await this.onAfterDataFetched(result);

        this.api.send(result)

        return result;
    }

    async all() {
        const getIndex = this.indexAdapter.get.bind(this.indexAdapter);
        return await this._all(getIndex)
    }

    async get(...ids: string[]) {
        const entities = await this.api.getStrict(...ids);
        const result = entities.map(w => this.api.makeTrackable(w, this.defaults.retrieve, this.isReadonly, this.map) as TEntity);

        await this.onAfterDataFetched(result);

        if (result.length > 0) {
            this.api.send(result)
        }

        return result;
    }


    async find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined> {
        const getIndex = this.indexAdapter.get.bind(this.indexAdapter);
        const data = await this.allDataAndMakeTrackable(getIndex);
        const result = [...data].find(selector);

        if (result) {

            await this.onAfterDataFetched([result]);

            this.api.send([result])
        }

        return result;
    }

    async first() {
        const getIndex = this.indexAdapter.get.bind(this.indexAdapter);
        const data = await this.allDataAndMakeTrackable(getIndex);
        const result = data[0];

        if (result) {

            await this.onAfterDataFetched([result]);

            this.api.send([result])
        }

        return result as TEntity | undefined;
    }
}