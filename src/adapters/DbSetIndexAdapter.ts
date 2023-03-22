import { IDbRecord, IDbSetProps } from '../typings';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';
import { IDbSetIndexAdapter } from './types';

export class DbSetIndexAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions> {

    constructor(props: IDbSetProps<TDocumentType, TEntity>) {
        super(props);
    }

    useIndex(name: string) {
        this.indexStore.once(name);
    }
}