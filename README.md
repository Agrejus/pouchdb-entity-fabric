# pouchdb-entity-fabric
PouchDB abstraction layer modeled after .net's Entity Framework

```
npm install pouchdb-entity-fabric
```

PouchDB Entity Fabric is an abstraction layer that wraps [PouchDB](https://pouchdb.com/) and makes creating repeatable processes in PouchDB easier.  Often times using PouchDB, a repository layer needs to be created and adding new document types requires a new repository.  PouchDB Entity Fabric removes the need for these repository layers all together.  Let's get to the code:

## Changes
### 1.4.1 -> 1.4.2 
- Added `.previewChanges()` to `DataContext`
- Changed processing order of changes
    - **Old**: Adds, Removals, Updates
    - **New**: Removals, Adds, Updates
    - Will now remove entities first, this will help with single instance dbset's when users want to remove and add.  `saveChanges()` will only need to be called once now in this case instead of between the removal and add
- Changed `DbSet` key building in the fluent API.  Options are now:
    - `add()` to start a chaining operation to build the Id
    - `none()` tell the dbset that the key should be the document type.  This will only allow a max of one entity in the dbset
    - `auto()` automatically generate a key for the dbset.  This is currently the default when `keys()` is not supplied to the fluent API.
- Exported `DeepPartial`
- Changed `first()` on `DbSet` to return `Entity | undefined` instead of `Entity`

## Installation
```
npm install pouchdb-entity-fabric
```

## Getting Started
To get started with PouchDB Entity Fabric, create a new data context class by inheriting from `DataContext<>`, create a document type enum, create interface for the entities, and declare your dbset's as properties.  Full example below:

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).create();
}
```

### Context Usage
Once your context is created, simply create a new context to:

- Create
- Remove
- Update
- Delete
- Advanced Functions

#### Creating Data
To add data to our underlying database, we must add an entity to the context and save it.

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).create();
}


const context = new PouchDbDataContext();

const [myFirstItem] = await context.myFirstDbSet.add({ propertyOne: "some value", propertyTwo: "some value" });
await context.saveChanges();

// myFirstItem will have the _rev, _id, DocumentType properties added to the entity returned from add().  Those id's will be populated accordingly, _rev will always be populated after saveChanges() is called.  In this case the _id property will be set after add() is called
```

We can also create many entites with the same `add()` function.

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).create();
}


const context = new PouchDbDataContext();

const [myFirstItem, mySecondItem, myThirdItem] = await context.myFirstDbSet.add(
    { propertyOne: "some value 1", propertyTwo: "some value 1" },
    { propertyOne: "some value 2", propertyTwo: "some value 2" },
    { propertyOne: "some value 3", propertyTwo: "some value 3" });

await context.saveChanges();

// myFirstItem, mySecondItem, myThirdItem will have the _rev, _id, DocumentType properties added to the entity returned from add().  Those id's will be populated accordingly, _rev will always be populated after saveChanges() is called.  In this case the _id property will be set after add() is called
```

#### Reading Data
To read data from the underlying database, there are several methods available:
 - `all()` - Read all the data in the dbset
 - `filter()` - Filter and return data in the dbset that matches the filter selector
 - `find()` - Find and return one entity in the dbset that matches the filter selector
 - `get()` - Get one or more entities by their id
 - `first()` - Get the first entity in the dbset


```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).create();
}


const context = new PouchDbDataContext();

const all = await context.myFirstDbSet.all();
const filter = await context.myFirstDbSet.filter(w => w.propertyOne == "some value");
const find = await context.myFirstDbSet.find(w => w.propertyOne == "some value");
const get = await context.myFirstDbSet.get("some id"); 
const first = await context.myFirstDbSet.first(); 
```

#### Updating Data
To update data from our underlying database, we must retrieve and entity or entities first and them update them.  Once updates are made, save changes needs to be called.

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).create();
}


const context = new PouchDbDataContext();

const first = await context.myFirstDbSet.first()

first.propertyTwo = "some updated value";

await context.saveChanges();
```

#### Deleting Data
To remove data from our underlying database, we must remove an entity by passing in the id or entire entity and save it.

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).create();
}


const context = new PouchDbDataContext();

const first = await context.myFirstDbSet.first()
await context.myFirstDbSet.remove(first);
await context.saveChanges();
```

We can also removing many entites using the same `remove()` function.

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).create();
}


const context = new PouchDbDataContext();

// remove all entites from the dbset
const all = await context.myFirstDbSet.all()
await context.myFirstDbSet.remove(...all);
await context.saveChanges();
```

### Entity Declaration
Entites can be declared a few different ways.  Two of the main ways are to create an interface and inherit from `IDbRecord<TDocumentType>` or add the properties from `IDbRecord<TDocumentType>` to your entity.

```typescript
interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

// OR

interface IMyFirstEntity {
    propertyOne: string;
    propertyTwo: string;
    readonly _id: string;
    readonly _rev: string;
    readonly DocumentType: DocumentTypes;
}
```

## Concepts
Below are the main concepts in pouchdb-entity-fabric

### Creating a DatabaseContext
A database context allows interaction with pouchdb.  Dev's can create as many context's as they wish, if the database names are the same, each context will act on the same database even though one or more context's exist.  Keep in mind, when adding/removing/updating data, all changes are stored in memory in the corresponding context until `saveChanges()` is called. 

To create a data context, dev's must create an enum of document types add pass that in as a generic parameter. Below is an example of creating a data context with one dbset:

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).create();
}
```

### Creating a DbSet
The DbSet concept is derrived from .NET's entity framework and works the same way.  Items must be changed in the DbSet, once all changes are made, `saveChanges()` must be called on the context to persist all changes from the DbSet.

DbSet's are very powerful and are developed to adapt to the evolution of the software.  The DbSet Fluent API contains many different options for creating a `DbSet<>`.  See advanced Concepts below for all the different dbset options and what they do

To get started, declare your entities and document types like we did below.  Next, give your `DbSet<>` any name you wish.  Last, supply the correct parameters for `dbset()`.

#### Auto Id Generation
If dev's do not specify any parameters to the dbset on how to create an id for each document, an id will be auto generated instead.

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).create();
}

// _____ OR ______ //

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).keys(w => w.auto()).create();
}
```

#### Manual Id Generation
When using manual id's for entities, the id format will be `DocumentType/params`.  Notice, the id will always start with the document type followed by the keys supplied to the dbset.

In the below example, we are using propertyOne and propertyTwo to build our unique id.  The resulting id will be `MyFirstDocument/${propertyOne}/${propertyTwo}`.

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).keys(w => w.add("propertyOne").add("propertyTwo")).create();
}
```

With the fluent dbset API, dev's can also format the values when building an id for an entity.  For example, if we want a date to be part of the id and want to format it differently, we can pass a function into they key builder of the dbset fluent API.

In the below example, we are using propertyOne,  propertyTwo, and dateProperty to build our unique id.  The resulting id will be `MyFirstDocument/${propertyOne}/${propertyTwo}/${dateProperty.toISOString()}`.

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
    dateProperty: Date;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).keys(w => w.add("propertyOne").add("propertyTwo").add(w => w.dateProperty.toISOString())).create();
}
```

#### Single Entity Db Set
Sometimes we only want a dbset to have only one entity and never any more.  This is very useful for things like configurations.

In the below example, we are marking the keys as none.  The resulting id will be `MyFirstDocument`.

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).keys(w => w.none()).create();
}
```

## Advanced Concepts
PouchDb Entity Fabric has many different advanced options for dev's to fit an scenario.  

### Data Purging
When documents are removed from pouchdb, they are still kept in the database, only they have a `_deleted` property on them marking them as deleted.  When fetching data, they will not show, but will still take up valuable space.  To combat this, there is a purge method modeled after this [post](https://github.com/pouchdb/pouchdb/issues/802).  Purging the database will remove all deleted documents and keep the original data.

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).create();
}


const context = new PouchDbDataContext();

const result = await context.purge();
```

### DbSet Fluent API
The DbSet Fluent API is a very powerful mechanism to create a dbset that will fit the software's needs.  With the Fluent API, a DbSet can exclude properties when adding them, have defaults to either retroactively add new columns or to set values for excluded properties.  There is also advanced entity key building, adding events, and extending the functionality of the dbset.

#### DbSet Fluent API - Key Builder
The key builder in the Fluent API can be used to build a custom key for each entity that is added to the dbset.  With the fluent key builder, the id will be created in the order the properties are specified.


```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
    dateProperty: Date
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).keys(w => w.add("propertyOne").add(x => x.dateProperty.toISOString())).create();
}
```

#### DbSet Fluent API - Exclusions
Exclusions exist for developers to specify properties that need to be omitted when an entity is added to the dbset via the `add()` method.  When exclusions are specified, it is implied these properties will be set later in the `add` event or using defaults, below

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
    dateProperty: Date
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).exclude("dateProperty").create();
}

const context = new PouchDbDataContext();

const [item] = await context.myFirstDbSet.add({
    propertyOne: "some value",
    propertyTwo: "some value"
});

// PLEASE MAKE SURE dateProperty is set before calling save changes
```

#### DbSet Fluent API - Defaults
Defaults are handy with exclusions because the value will be the same every time we add an entity or retroactively adding properties that are not nullable.  There are two defaults, `add` and `retrieve`.  `add` defaults will be set when `add()` is called on the dbset. `retrieve` defaults will be set when retrieving data from the dbset using one of `all()`, `filter()`, `find()`, `get()`, `first()`, `getAllDocs()`.  

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
    dateProperty: Date
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).exclude("dateProperty").defaults({ dateProperty: new Date() }).create();
}

const context = new PouchDbDataContext();

const [item] = await context.myFirstDbSet.add({
    propertyOne: "some value",
    propertyTwo: "some value"
});

// dateProperty will be set to a new date on add and will be set when the document is retrieved if it does not exist

// result
{
    _id: "SomeDocument/some value/some value",
    _rev: "<generated>",
    dateProperty: new Date(),
    DocumentType: "MyFirstDocument",
    propertyOne: "some value",
    propertyTwo: "some value"
}
```

Conversely, we can set defaults for `add` and `retrieve` if we need.

#### DbSet Fluent API - Extending the DbSet
Dev's can add more functionality to a dbset if needed by extending the existing dbset that gets created

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
    dateProperty: Date
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).extend((Instance, props) => {
        return new class extends Instance {
                constructor() {
                    super(props)
                }
        
                someNewMethod() {
                    throw new Error('Implement me')
                }
            }
    }).create();
}

const context = new PouchDbDataContext();

const value = context.myFirstDbSet.someNewMethod();
```

#### DbSet Fluent API - Readonly DbSet
Dev's can also mark a dbset as readonly, only allowing dev's to add/remove from the dbset.  Updates are not allowed

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
    dateProperty: Date
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).readonly().create();
}

const context = new PouchDbDataContext();

```

## Linking/Unlinking Entities
Linking entities is useful for transferring entites from one context to another.  For example, if dev's want to pass an entity from one context to one or many child functions and do not want to pass the context with it.  We can pass the entity and create a new context, link, and save changes.  When an entity is linked, the dbset will automatically grab the latest _rev in the database for the document and set it on the linked entity.

Unlinking entities is useful to make changes to the entity that will not be persisted to the underlying data store after saveChanges() is called.

### Linking
```typescript

const someNewContext = new PouchDbDataContext();

await someNewContext.myFirstDbSet.link(someEntity); // NOTE: Ensure changes are made to the entity after its attached

someEntity.propertyOne = "some changed value"

await context.saveChanges(); // Changes will be persisted
```

### Unlinking
```typescript
context.myFirstDbSet.unlink(someEntity);

someEntity.propertyOne = "some changed value"

await context.saveChanges(); // No Changes will be peristed
```

## Get All Documents
If dev's want to get all documents in the database and filter that down by dbset, we can use `getAllDocs()` with `match()` to speed up this process.  `getAllDocs()` will be faster than fetching data on each dbset.

```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument",
    MySecondDocument = "MySecondDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

interface IMySecondEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).create();
    mySecondDbSet = this.dbset<IMySecondEntity>(DocumentTypes.MySecondDocument).create();
}

const context = new PouchDbDataContext();
const all = await context.getAllDocs();
const myFirstDocuments = await context.myFirstDbSet.match(...all);
const mySecondDocuments = await context.mySecondDbSet.match(...all);

```

## DataContext Index Fluent API 
The data context now has a fluent api for dealing with indexes in PouchDB.  This makes it easier to create, find, and remove indexes.

### Creating an index
```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument",
    MySecondDocument = "MySecondDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

interface IMySecondEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).create();
}

const context = new PouchDbDataContext();
await context.$indexes.create(w => w.name("some-name").fields(x => x.add("myProperty")));

```

### Finding an index
```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument",
    MySecondDocument = "MySecondDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

interface IMySecondEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).create();
}

const context = new PouchDbDataContext();
const found = await context.$indexes.find(w => w.name === "some-name");
const filtered = await context.$indexes.filter(w => w.name === "some-name");

```

### Removing an index
```typescript
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument",
    MySecondDocument = "MySecondDocument"
}

interface IMyFirstEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

interface IMySecondEntity extends IDbRecord<DocumentTypes> {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    myFirstDbSet = this.dbset<IMyFirstEntity>(DocumentTypes.MyFirstDocument).create();
}

const context = new PouchDbDataContext();
await context.$indexes.remove({
    name: "some-name",
    ddoc: "some-ddoc"
});

```

## DbSet Events
DbSet's have two available event that can be subscribed to, `"add"`, `"remove"`.  
- `"add"` event is called after the entity is queued for addition.
- `"remove"` event is called after the entity is queued for removal.

## DataContext Events
The DataContext has three available events that can be subscribed to, `"entity-created"`, `"entity-updated"`, `"entity-removed"`.  
- `"entity-created"` event is called after the entity is created in the underlying data store.
- `"entity-updated"` event is called after the entity is updated in the underlying data store.
- `"entity-removed"` event is called after the entity is removed in the underlying data store.

## API
### DbSet Methods
| Method | Description |
| ----- | --- |
| `add(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): Promise<TEntity[]>` | Add one or more entities from the underlying data context, saveChanges must be called to persist these items to the store |
| `instance(...entities: OmittedEntity<TEntity, TExtraExclusions>[]): TEntity[]` | Create one or more entities and do not add it to the underlying data context.  This is useful for creating entities and passing them to other functions. Call add to add the entity to a context for persistance |
| `isMatch(first: TEntity, second: TEntity): boolean` | Check for equality between two entities |
| `remove(...ids: string[]): Promise<void>` | Remove one or more entities by id from the underlying data context, saveChanges must be called to persist these items to the store |
| `remove(...entities: TEntity[]): Promise<void>` | Remove one or more entities from the underlying data context, saveChanges must be called to persist these items to the store |
| `empty(): Promise<void>` | Remove all entities from the DbSet, save changes must be called to persist changes |
| `all(): Promise<TEntity[]>` | Return all items in the underlying data store for the document type |
| `get(...ids: string[]): Promise<TEntity[]>` | Find entity by an id or ids |
| `filter(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity[]>` | Filter items in the underlying data store and return the results |
| `match(...items: IDbRecordBase[]): TEntity[]` | Matches items with the same document type.  Useful for retrieving all docs and calling match() to find the ones that belong in the db set |
| `find(selector: (entity: TEntity, index?: number, array?: TEntity[]) => boolean): Promise<TEntity \| undefined>` | Find an entity for the underlying document type |
| `unlink(...entities: TEntity[]): void` | Unlinks an entity or entities from the context so they can be modified and changes will not be persisted to the underlying data store |
| `link(...entites: TEntity[]): Promise<void>` | Link an existing entitiy or entities to the underlying Data Context from another Data Context, saveChanges must be called to persist these items to the store |
| `first(): Promise<TEntity | undefined>` | Get first item in the DbSet |  
| `on(event: "add", callback: DbSetEventCallback<TDocumentType, TEntity>): void` | Called when an item is queued for creation in the underlying data context |
| `on(event: "remove", callback: DbSetEventCallback<TDocumentType, TEntity> \| DbSetIdOnlyEventCallback): void` | Called when an item is queued for removal in the underlying data context |
| `nfo(): IDbSetInfo<TDocumentType, TEntity>` | Get DbSet info |

### DataContext Methods
| Method | Description |
| ----- | --- |
| `saveChanges(): Promise<number>` | Persist all changes to PouchDB, returns a count of all documents modified |
| `getAllDocs(): Promise<IDbRecordBase[]>` | Get all documents regardless of document type |
| `protected dbset<TEntity extends IDbRecord<TDocumentType>>(documentType: TDocumentType): IDbSet<TDocumentType, TEntity, TExtraExclusions>` | Starts the dbset fluent API.  Only required function call is create(), all others are optional |
| `on(event: DataContextEvent, callback: DataContextEventCallback<TDocumentType>): void` | Subscribe to events on the data context |
| `hasPendingChanges(): boolean` | Check whether or not the context has any pending changes |
| `query<TEntity extends IDbRecord<TDocumentType>>(callback: (provider: PouchDB.Database) => Promise<TEntity[]>): Promise<TEntity[]>` | Invoke a query on PouchDB and return the result |
| `empty(): Promise<void>` | Remove all entities from all DbSets in the data context, saveChanges must be called to persist these changes to the store |
| `destroyDatabase(): Promise<void>` | Destroy Pouch Database |
| `optimize(): Promise<void>` | Add optimizations to increase performance of PouchDB |
| `protected createDb():PouchDB.Database<{}> ` | Can override and create a new instance of PouchDB |
| `previewChanges(): Promise<IPreviewChanges>` | Will list changes that will be persisted.  Changes are add, remove, update.  NOTE:  This is a copy of the changes, changes made will not be persisted |

## Issues

### Web Workers
When pushing Proxy classes (entities) to a WebWorker, structuredCloning will fail because Proxy classes cannot be deeply cloned

Work Around - override structuredClone and clone the proxy properly by called `DataContext.asUntracked()`

### Comlink
When pushing Proxy classes (entities) to a WebWorker, structuredCloning will fail because Proxy classes cannot be deeply cloned

Work Around - Create a wrapper for comlink and provide the proper cloning mechanism
```typescript
import { transferHandlers, wrap, TransferHandler, expose } from 'comlink';
import { DataContext } from 'pouchdb-entity-fabric';

// handle cloning of proxy object
const proxyTransferhandler: TransferHandler<{ data: any }, any> = {
	canHandle: ((e: any) => {
        // we assume or proxy is e.data
		try {
			const canHandle = e != null && 'data' in e && DataContext.isProxy(e.data ?? {})

			return canHandle;
		} catch {
			return false
		}
	}) as any,
	serialize: (value) => {
		const clone = { ...value, data: { ...value.data } };
		return [clone, []]
	},
	deserialize: (value) => {
		return value;
	}
}

transferHandlers.set("EVENT", proxyTransferhandler);

export { transferHandlers, wrap, expose };
```


