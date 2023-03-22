import { EntitySelector, IDbRecord, IDbSetProps } from '../typings';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';
import { IDbSetFetchAdapter } from './types';

export class DbSetFetchAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetFetchAdapter<TDocumentType, TEntity, TExtraExclusions> {

    constructor(props: IDbSetProps<TDocumentType, TEntity>) {
        super(props);
    }

    async filter(selector: EntitySelector<TDocumentType, TEntity>) {
        const data = await this.allDataAndMakeTrackable();

        const result = [...data].filter(selector);

        this.api.send(result)

        return result;
    }


    async get(...ids: string[]) {
        const entities = await this.api.getStrict(...ids);
        const result = entities.map(w => this.api.makeTrackable(w, this.defaults.retrieve, this.isReadonly, this.map) as TEntity);

        if (result.length > 0) {
            this.api.send(result)
        }

        return result;
    }


    async find(selector: EntitySelector<TDocumentType, TEntity>): Promise<TEntity | undefined> {

        const data = await this.allDataAndMakeTrackable();
        const result = [...data].find(selector);

        if (result) {
            this.api.send([result])
        }

        return result;
    }

    async first() {
        const data = await this.allDataAndMakeTrackable();
        const result = data[0];

        if (result) {
            this.api.send([result])
        }

        return result as TEntity | undefined;
    }
}