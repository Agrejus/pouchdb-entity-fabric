- strict mode
    - log missing indexes

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

single instance for dbset builder
document the marker to id a Proxy


dbSet
    readonly
    caching?

Maybe?
- Way to undo changes?