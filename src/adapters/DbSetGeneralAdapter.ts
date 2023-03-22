import { DataContext } from '../DataContext';
import { IDbRecord, IDbRecordBase, IDbSetInfo, IDbSetProps, IIndexableEntity } from '../typings';
import { validateAttachedEntity } from '../Validation';
import { DbSetBaseAdapter } from './DbSetBaseAdapter';
import { IDbSetGeneralAdapter } from './types';

export class DbSetGeneralAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExtraExclusions extends (keyof TEntity) = never> extends DbSetBaseAdapter<TDocumentType, TEntity, TExtraExclusions> implements IDbSetGeneralAdapter<TDocumentType, TEntity, TExtraExclusions> {

    constructor(props: IDbSetProps<TDocumentType, TEntity>) {
        super(props);
    }

    isMatch(first: TEntity, second: any) {
        return this.getKeyFromEntity(first) === this.getKeyFromEntity(second);
    }

    match(...items: IDbRecordBase[]) {
        return items.filter(w => w.DocumentType === this.documentType) as TEntity[]
    }

    info() {
        const info: IDbSetInfo<TDocumentType, TEntity> = {
            DocumentType: this.documentType,
            IdKeys: this.idKeys,
            Defaults: this.defaults,
            KeyType: this.keyType,
            Readonly: this.isReadonly,
            Map: this.map
        }

        return info;
    }

    merge(from: TEntity, to: TEntity) {
        return { ...from, ...to, [this.api.PRISTINE_ENTITY_KEY]: { ...from, ...((to as IIndexableEntity)[this.api.PRISTINE_ENTITY_KEY] ?? {}) }, _rev: from._rev } as TEntity
    }

    unlink(...entities: TEntity[]) {

        const validationFailures = entities.map(w => validateAttachedEntity<TDocumentType, TEntity>(w)).flat().filter(w => w.ok === false);

        if (validationFailures.length > 0) {
            const errors = validationFailures.map(w => w.error).join('\r\n')
            throw new Error(`Entities to be attached have errors.  Errors: \r\n${errors}`)
        }

        this._detachItems(entities)
    }

    async markDirty(...entities: TEntity[]) {

        if (entities.some(w => DataContext.isProxy(w) === false)) {
            throw new Error(`Entities must be linked to context in order to mark as dirty`)
        }

        return entities.map(w => {
            (w as IIndexableEntity)[this.api.DIRTY_ENTITY_MARKER] = true;
            return w;
        });
    }

    async link(...entities: TEntity[]) {

        const validationFailures = entities.map(w => validateAttachedEntity<TDocumentType, TEntity>(w)).flat().filter(w => w.ok === false);

        if (validationFailures.length > 0) {
            const errors = validationFailures.map(w => w.error).join('\r\n')
            throw new Error(`Entities to be attached have errors.  Errors: \r\n${errors}`)
        }

        // Find the existing _rev just in case it's not in sync
        const found = await this.api.getStrict(...entities.map(w => w._id));
        const foundDictionary = found.reduce((a, v) => ({ ...a, [v._id]: v._rev }), {} as IIndexableEntity);
        const result = entities.map(w => this.api.makeTrackable({ ...w, _rev: foundDictionary[w._id] }, this.defaults.add, this.isReadonly, this.map));

        this.api.send(result);

        return result;
    }

    private _detachItems(data: TEntity[]) {
        return this.api.detach(data);
    }
}