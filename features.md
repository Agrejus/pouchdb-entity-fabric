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


https://www.albahari.com/nutshell/predicatebuilder.aspx
predicateBuilder
    Take advantage of speed with larger data sets
    .and(w => w.one).equals(1)
    .and(w => w.two).lessThan(1)
        or();

        publish beta
        npm publish --tag beta

        3.1.0-beta.0