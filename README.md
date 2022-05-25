# pouchdb-entity-fabric
PouchDB abstraction layer modeled after .net's Entity Framework

```
npm install pouchdb-entity-fabric
```

[PouchDB](https://pouchdb.com/) is an open-source JavaScript database that is designed to run within the browser.  PouchDB Entity Fabric is an abstraction layer that wraps PouchDB and makes creating repeatable processes in PouchDB easier.  Often times using PouchDB, a repository layer needs to be created and adding new document types requires a new repository.  PouchDB Entity Fabric removes the need for these repository layers all together.  Let's get to the code:

## Installation
```
npm install pouchdb-entity-fabric
```

## Getting Started
To get started with PouchDB Entity Fabric, inherit from the base DataContext class

```
import { DataContext } from 'pouchdb-entity-fabric';

export enum DocumentTypes {
    MyFirstDocument = "MyFirstDocument"
}

interface IMyFirstEntity {
    propertyOne: string;
    propertyTwo: string;
}

export class PouchDbDataContext extends DataContext<DocumentTypes> {
    constructor() {
        super('some-db')
    }

    myFirstDbSet = this.createDbSet<IMyFirstEntity>(DocumentTypes.MyFirstDocument, "propertyOne", "propertyTwo");
}
```

## Adding Data

```
const context = new PouchDbDataContext();

context.myFirstDbSet.add({ propertyOne: "some value", propertyTwo: "some value" });

await context.saveChanges();
```

## Removing Data

```
context.myFirstDbSet.remove(someEntity);

await context.saveChanges();
```

## Methods
DbSet Methods
```
add(entity: TEntity): Promise<void>;
addRange(entities: TEntity[]): Promise<void>;
remove(entity: TEntity) : Promise<void>;
removeRange(entities: TEntity[]) : Promise<void>;
all(): Promise<(TEntityType & TEntity)[]>;
filter(selector: (entity: (TEntityType & TEntity), index?: number, array?: (TEntityType & TEntity)[]) => boolean): Promise<(TEntityType & TEntity)[]>;
find(selector: (entity: (TEntityType & TEntity), index?: number, array?: (TEntityType & TEntity)[]) => boolean) : Promise<(TEntityType & TEntity) | undefined>
onBeforeAdd(action: (entity: TEntity & TEntityType) => void): void;
isMatch(first: TEntity, second: TEntity): boolean;
detach(entities: TEntity[]): (TEntity & TEntityType)[];
match(entities:IDbRecordBase[]): (TEntityType & TEntity)[]
```

DataContext Methods
```
saveChanges(): Promise<number>;
getAllDocs(): Promise<IDbRecordBase[]>
```