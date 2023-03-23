import { IDbSetFetchAdapter } from '../types/adapter-types';
import { EntitySelector } from '../types/common-types';
import { IDbSetProps } from '../types/dbset-types';
import { IDbRecord } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';

export class DbSetFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions> {

    constructor(props: IDbSetProps<TDocumentType, TEntity>) {
        super(props);
    }

    async filter(selector: EntitySelector<TDocumentType, TEntity>) {
        const data = await this.allDataAndMakeTrackable();

        const result = [...data].filter(selector);

        await this.onAfterDataFetched(result);

        this.api.send(result)

        return result;
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

        const data = await this.allDataAndMakeTrackable();
        const result = [...data].find(selector);

        if (result) {

            await this.onAfterDataFetched([result]);

            this.api.send([result])
        }

        return result;
    }

    async first() {
        const data = await this.allDataAndMakeTrackable();
        const result = data[0];

        if (result) {

            await this.onAfterDataFetched([result]);

            this.api.send([result])
        }

        return result as TEntity | undefined;
    }
}