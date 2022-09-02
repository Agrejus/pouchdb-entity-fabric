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

operation
    asUntracked

useIndex("").first()

useIndex should return a copy of the dbset?  Maybe?
    How can we set one time meta data
    Can we set it, consume it, and remove it?  I think so
    