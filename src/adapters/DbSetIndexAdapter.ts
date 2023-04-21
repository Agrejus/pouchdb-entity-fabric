import { IndexStore } from '../indexing/IndexStore';
import { IDbSetIndexAdapter } from '../types/adapter-types';
import { IDbSetProps } from '../types/dbset-types';
import { IDbRecord } from '../types/entity-types';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';

export class DbSetIndexAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends string = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetIndexAdapter<TDocumentType, TEntity, TExtraExclusions> {

    protected indexStore: IndexStore;

    constructor(props: IDbSetProps<TDocumentType, TEntity>) {
        super(props);
        this.indexStore = new IndexStore(props.index);
    }

    get(): string | null {
        return this.indexStore.get();
    }

    useIndex(name: string) {
        this.indexStore.once(name);
    }
}