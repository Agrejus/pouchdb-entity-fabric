import { DataContext } from '../DataContext';
import { IDbRecord, IDbSetProps, IIndexableEntity, OmittedEntity } from '../typings';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';
import { IDbSetModificationAdapter } from './types';

export class DbSetModificationAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetModificationAdapter<TDocumentType, TEntity, TExtraExclusions> {

    constructor(props: IDbSetProps<TDocumentType, TEntity>) {
        super(props);
    }

    private _processAddition(entity: OmittedEntity<TEntity, TExtraExclusions>) {
        const addItem: IDbRecord<TDocumentType> = entity as any;
        (addItem as any).DocumentType = this.documentType;
        const id = this.getKeyFromEntity(entity as any);

        if (id != undefined) {
            (addItem as any)._id = id;
        }

        // if (this._events["add"].length > 0) {
        //     this._events["add"].forEach(w => w(entity as any));
        // }

        return this.api.makeTrackable(addItem, this.defaults.add, this.isReadonly, this.map) as TEntity;
    }

    instance(...entities: OmittedEntity<TEntity, TExtraExclusions>[]) {
        return entities.map(entity => ({ ...this._processAddition(entity) }));
    }

    async add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]) {
        const data = this.api.getTrackedData();
        const { add } = data;

        const result = entities.map(entity => {
            const indexableEntity: IIndexableEntity = entity as any;

            if (indexableEntity["_rev"] !== undefined) {
                throw new Error('Cannot add entity that is already in the database, please modify entites by reference or attach an existing entity')
            }

            const trackableEntity = this._processAddition(entity);

            add.push(trackableEntity);

            return trackableEntity;
        });

        // if (this._asyncEvents['add-invoked'].length > 0) {
        //     await Promise.all(this._asyncEvents['add-invoked'].map(w => w(result as any)))
        // }

        return result
    }

    async upsert(...entities: (OmittedEntity<TEntity, TExtraExclusions> | Omit<TEntity, "DocumentType">)[]) {
        // build the id's
        const all = await this.getAllData();
        const allDictionary: { [key: string]: TEntity } = all.reduce((a, v) => ({ ...a, [v._id]: v }), {})
        const result: TEntity[] = [];

        for (let entity of entities as any[]) {
            const instance = entity._id != null ? entity as TEntity : { ...this._processAddition(entity) } as TEntity;
            const found = allDictionary[instance._id]

            if (found) {
                const mergedAndTrackable = this.api.makeTrackable(found, this.defaults.add, this.isReadonly, this.map) as TEntity;

                DataContext.merge(mergedAndTrackable, entity, { skip: [this.api.PRISTINE_ENTITY_KEY] });

                this.api.send([mergedAndTrackable]);
                result.push(mergedAndTrackable)
                continue;
            }

            const [added] = await this.add(entity);

            result.push(added)
        }

        return result;
    }
}