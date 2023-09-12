# pouchdb-entity-fabric
PouchDB abstraction layer modeled after .net's Entity Framework

```
npm install pouchdb-entity-fabric
```

PouchDB Entity Fabric is an abstraction layer that wraps [PouchDB](https://pouchdb.com/) and makes creating repeatable processes in PouchDB easier.  Often times using PouchDB, a repository layer needs to be created and adding new document types requires a new repository.  PouchDB Entity Fabric removes the need for these repository layers all together.  Let's get to the code:

## Documentation
https://github.com/Agrejus/pouchdb-entity-fabric/wiki

## Releases
2.0.5
- Changed call order of data reinitialization and onSaveChanges in case SaveChanges is called within onSaveChanges
- Added documentType and map to types on a DbSet.  Can be used to get the document type that is mapped to the document

2.1.0
- Added ability to tag entities with meta data.  Tags can be retrieved in onSaveChanges and onBeforeSaveChanges to detect different scenarios.  
    - Use Case: Developers want to know if an entity was removed by a user action or programatic action.  A Tag can be added before the `.remove()` call to indicate which part of code initiated the action
- onBeforeSaveChanges and onAfterSaveChanges calls were altered to include tags

2.1.1
- Fixed onBeforeSaveChanges, meta -> tag
- Allowed for add/remove of items inside of onBeforeSaveChanges.  Previously any add/remove would be thrown away
- Allowed for tags to be added inside of onBeforeSaveChanges