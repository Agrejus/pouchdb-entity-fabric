- Predicate builder
    - Create index on the fly

- strict mode
    - log missing indexes



$indexes.
    all()
    find()
    add(name:string)
        fields(w => w.add())
    remove()

$views.
    all()
    find()
    add(name:string)
        fields(w => w.add(x => x.id)?.asPartial().add())
    remove()

explainChanges()

Maybe?
- Way to undo changes?