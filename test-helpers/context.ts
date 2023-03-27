import PouchDB from "pouchdb";
import { DataContext } from "../src/context/DataContext";
import { DbSetBuilder } from "../src/context/dbset/DbSetBuilder";
import { IDbSet } from "../src/types/dbset-types";
import { IDbRecordBase } from "../src/types/entity-types";
import { DocumentTypes, ISyncDocument, ISetStatus, IComputer, IBook, IBookV4, INote, IContact, IBookV3, ICar, IPreference } from "./types";
import { v4 as uuidv4 } from 'uuid';
import memoryAdapter from 'pouchdb-adapter-memory';

PouchDB.plugin(memoryAdapter);

export class PouchDbDataContext extends DataContext<DocumentTypes> {

    constructor(name: string) {
        super(name);
    }

    private _setupSyncDbSet<T extends ISyncDocument<DocumentTypes>>(documentType: DocumentTypes) {

        const dbset = (this.dbset<ISyncDocument<DocumentTypes>>(documentType)
            .defaults({ SyncStatus: "Pending", SyncRetryCount: 0 })
            .exclude("SyncStatus", "SyncRetryCount") as any) as DbSetBuilder<DocumentTypes, T, "SyncStatus" | "SyncRetryCount", IDbSet<DocumentTypes, T, "SyncStatus" | "SyncRetryCount">>;

        return dbset.extend((Instance, props) => {
            return new class extends Instance {
                constructor() {
                    super(props);
                    this.toStatus = this.toStatus;
                }

                async toStatus(docs?: IDbRecordBase[]) {

                    let items: any[] = [];

                    if (docs != null) {
                        items = super.match(...docs);
                    } else {
                        items = await super.all();
                    }

                    return {
                        failed: items.filter(w => w.SyncStatus === "Failed").length,
                        pending: items.filter(w => w.SyncStatus === "Pending").length,
                        succeeded: items.filter(w => w.SyncStatus === "Succeeded").length
                    } as ISetStatus
                }
            }
        });
    }

    computers = this.dbset<IComputer>(DocumentTypes.Computers).create();

    books = this.dbset<IBook>(DocumentTypes.Books).defaults({ status: "pending" }).exclude("status", "rejectedCount").create();
    booksWithDateMapped = this.dbset<IBookV4>(DocumentTypes.BooksWithDateMapped)
        .exclude("status", "rejectedCount")
        .defaults({ status: "pending" })
        .map({ property: "publishDate", map: w => !!w ? new Date(w) : undefined })
        .map({ property: "createdDate", map: w => new Date(w) })
        .create();
    booksWithOn = this.dbset<IBook>(DocumentTypes.BooksWithOn).exclude("status", "rejectedCount").on("add", entity => {
        entity.status = "pending";
    }).create();

    booksWithOnV2 = this.dbset<IBook>(DocumentTypes.BooksWithOnV2).exclude("status", "rejectedCount").on("add-invoked", async entities => {
        entities.forEach(w => w.status = "pending")
    }).create();

    booksNoKey = this.dbset<IBook>(DocumentTypes.BooksNoKey).exclude("status", "rejectedCount").keys(w => w.none()).create();
    notes = this.dbset<INote>(DocumentTypes.Notes).create();
    contacts = this.dbset<IContact>(DocumentTypes.Contacts).keys(w => w.add("firstName").add("lastName")).create();
    booksV3 = this._setupSyncDbSet<IBookV3>(DocumentTypes.BooksV3).create();
    booksV4 = this._setupSyncDbSet<IBookV3>(DocumentTypes.BooksV4).extend((Instance, props) => {
        return new class extends Instance {
            constructor() {
                super(props)
            }

            otherFirst() {
                return super.first();
            }
        }
    }).create();
    cars = this.dbset<ICar>(DocumentTypes.Cars).keys(w => w.add(x => x.manufactureDate.toISOString()).add(x => x.make).add("model")).create()
    preference = this.dbset<IPreference>(DocumentTypes.Preference).keys(w => w.add(_ => "static")).create();
    preferencev2 = this.dbset<IPreference>(DocumentTypes.PreferenceV2).keys(w => w.add(() => "")).create();
    readonlyPreference = this.dbset<IPreference>(DocumentTypes.ReadonlyPreference).keys(w => w.add(_ => "static")).readonly().create();

    overrideContactsV2 = this.dbset<IContact>(DocumentTypes.OverrideContactsV2).keys(w => w.add("firstName").add("lastName")).extend((Instance, props) => {
        return new class extends Instance {
            constructor() {
                super(props)
            }

            otherFirst() {
                return super.first();
            }
        }
    }).create();

    overrideContactsV3 = this.dbset<IContact>(DocumentTypes.OverrideContactsV3).keys(w => w.add("firstName").add("lastName")).extend((Instance, props) => {
        return new class extends Instance {
            constructor() {
                super(props)
            }

            otherFirst() {
                return super.first();
            }
        }
    }).extend((Instance, props) => {
        return new class extends Instance {
            constructor() {
                super(props)
            }

            otherOtherFirst() {
                return super.first();
            }
        }
    }).create();

    booksWithDefaults = this.dbset<IBook>(DocumentTypes.BooksWithDefaults).exclude("status", "rejectedCount").defaults({ status: "pending", rejectedCount: 0 }).create();
    booksWithDefaultsV2 = this.dbset<IBook>(DocumentTypes.BooksWithDefaultsV2).exclude("status", "rejectedCount").extend((Instance, props) => {
        return new class extends Instance {
            constructor() {
                super(props)
            }
        }
    }).defaults({ status: "pending", rejectedCount: 0 }).create();
    booksWithTwoDefaults = this.dbset<IBook>(DocumentTypes.BooksWithTwoDefaults).exclude("status", "rejectedCount").defaults({ add: { status: "pending", rejectedCount: 0 }, retrieve: { status: "approved", rejectedCount: -1 } }).create();
    booksNoDefaults = this.dbset<IBook>(DocumentTypes.BooksWithNoDefaults).exclude("status", "rejectedCount").create();

    booksWithIndex = this.dbset<IBook>(DocumentTypes.BooksWithIndex).exclude("status", "rejectedCount").useIndex('some-default-index').create();



    notesWithMapping = this.dbset<INote>(DocumentTypes.NotesWithMapping).map({ property: "createdDate", map: w => new Date(w) }).create();
}

export class BooksWithOneDefaultContext extends DataContext<DocumentTypes> {

    constructor(name: string) {
        super(name);
    }

    booksWithDefaults = this.dbset<IBook>(DocumentTypes.BooksWithDefaults).exclude("status", "rejectedCount").create();
    booksWithDefaultsV2 = this.dbset<IBook>(DocumentTypes.BooksWithDefaultsV2).exclude("status", "rejectedCount").extend((Instance, props) => {
        return new class extends Instance {
            constructor() {
                super(props)
            }
        }
    }).defaults({ status: "pending", rejectedCount: 0 }).create();
}


export class BooksWithTwoDefaultContext extends DataContext<DocumentTypes> {

    constructor(name: string) {
        super(name);
    }

    booksWithTwoDefaults = this.dbset<IBook>(DocumentTypes.BooksWithTwoDefaults).exclude("status", "rejectedCount").create();
}

export class DbContextFactory {

    private _dbs: { [key: string]: DataContext<DocumentTypes> } = {}

    getRandomDbName() {
        return uuidv4();
    }

    createContext<T extends typeof PouchDbDataContext>(Context: T, dbname?: string) {
        const name = dbname ?? `${uuidv4()}-db`;
        const result = new Context(name);
        this._dbs[name] = result;
        return result;
    }

    createDbContexts<T extends DataContext<DocumentTypes>>(factory: (name: string) => T[]) {
        const name = `${uuidv4()}-db`;
        const contexts = factory(name);
    
        for (const context of contexts) {
            this._dbs[name] = context;
        }
    
        return contexts;
    }

    async cleanupAllDbs() {
        const dbNames = Object.keys(this._dbs)
        await Promise.all(dbNames.map(w => this._dbs[w].destroyDatabase()));
    }
}