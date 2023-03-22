import { IDbRecord, IDbSetProps, IIndexableEntity } from '../typings';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';
import { IDbSetDestructionAdapter } from './types';

export class DbSetDestructionAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetDestructionAdapter<TDocumentType, TEntity, TExtraExclusions> {

    constructor(props: IDbSetProps<TDocumentType, TEntity>) {
        super(props);
    }

    async remove(...ids: string[]): Promise<void>;
    async remove(...entities: TEntity[]): Promise<void>;
    async remove(...entities: any[]) {

        // if (this._asyncEvents['remove-invoked'].length > 0) {
        //     await Promise.all(this._asyncEvents['remove-invoked'].map(w => w(entities as any)))
        // }

        if (entities.some(w => typeof w === "string")) {
            await Promise.all(entities.map(w => this._removeById(w)))
            return;
        }

        await Promise.all(entities.map(w => this._remove(w)))
    }

    async empty() {
        const items = await this.all();
        await this.remove(...items);
    }

    private async _remove(entity: TEntity) {
        const data = this.api.getTrackedData();
        const { remove } = data;

        const ids = remove.map(w => w._id);
        const indexableEntity = entity as IIndexableEntity;

        if (ids.includes(indexableEntity._id)) {
            throw new Error(`Cannot remove entity with same id more than once.  _id: ${indexableEntity._id}`)
        }

        // this._events["remove"].forEach(w => w(entity as any));

        remove.push(entity as any);
    }

    private async _removeById(id: string) {
        const data = this.api.getTrackedData();
        const { removeById } = data;

        if (removeById.includes(id)) {
            throw new Error(`Cannot remove entity with same id more than once.  _id: ${id}`)
        }

        // this._events["remove"].forEach(w => w(id as any));

        removeById.push(id);
    }
}