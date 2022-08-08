- Predicate builder
    - Create index on the fly

- strict mode
    - log missing indexes


$indexes.
    all()
    find()
    create(name:string)
        fields(w => w.add())
    remove(name:string)

$filters.
    all()
    find()
    create(name:string)
        fields(w => w.add(x => x.id)?.asPartial().add())
    remove(name:string)

    ex -

{
    _id: '_design/mydesign',
    filters: {
        myfilter: function (doc) {
            return doc.type === 'marsupial';
        }.toString()
    }
}



explainChanges()

dbSet
    readonly
    caching?

Maybe?
- Way to undo changes?