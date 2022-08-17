import { DataContext } from "../DataContext";
import { IDbRecord, IDbRecordBase, IDbSet } from "../typings";
import PouchDB from 'pouchdb';
import memoryAdapter from 'pouchdb-adapter-memory';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import { DbSetBuilder } from "../DbSetBuilder";

describe('dbset - fluent api', () => {

    const dbs: { [key: string]: DataContext<DocumentTypes> } = {}
    const dbFactory = <T extends typeof PouchDbDataContext>(Context: T, dbname?: string) => {
        const name = dbname ?? `${uuidv4()}-db`;
        const result = new Context(name);
        dbs[name] = result;
        return result;
    }

    const createDbContexts = <T extends DataContext<DocumentTypes>>(factory: (name: string) => T[]) => {
        const name = `${uuidv4()}-db`;
        const contexts = factory(name);

        for (const context of contexts) {
            dbs[name] = context;
        }

        return contexts;
    }

    PouchDB.plugin(memoryAdapter);

    enum DocumentTypes {
        Notes = "Notes",
        Contacts = "Contacts",
        OverrideContacts = "OverrideContacts",
        OverrideContactsV2 = "OverrideContactsV2",
        Books = "Books",
        BooksWithOn = "BooksWithOn",
        BooksWithOnV2 = "BooksWithOnV2",
        BooksNoKey = "BooksNoKey",
        BooksV3 = "BooksV3",
        BooksWithDefaults = "BooksWithDefaults",
        BooksWithDefaultsV2 = "BooksWithDefaultsV2",
        BooksWithNoDefaults = "BooksWithNoDefaults",
        BooksWithTwoDefaults = "BooksWithTwoDefaults",
        Cars = "Cars",
        Preference = "Preference",
        PreferenceV2 = "PreferenceV2",
        ReadonlyPreference = "ReadonlyPreference",
        BooksWithDateMapped = "BooksWithDateMapped"
    }

    interface IContact extends IDbRecord<DocumentTypes> {
        firstName: string;
        lastName: string;
        address: string;
        phone: string;
    }

    interface INote extends IDbRecord<DocumentTypes> {
        contents: string;
        createdDate: Date;
        userId: string;
    }

    interface IBook extends IDbRecord<DocumentTypes> {
        author: string;
        publishDate?: Date;
        rejectedCount: number;
        status: "pending" | "approved" | "rejected";
    }

    interface IBookV4 extends IDbRecord<DocumentTypes> {
        author: string;
        publishDate?: Date;
        createdDate: Date;
        rejectedCount: number;
        status: "pending" | "approved" | "rejected";
    }

    interface ICar extends IDbRecord<DocumentTypes> {
        make: string;
        model: string;
        year: number;
        manufactureDate: Date;
    }

    interface IPreference extends IDbRecord<DocumentTypes> {
        isSomePropertyOn: boolean;
        isOtherPropertyOn: boolean;
    }

    interface ISyncDocument<TDocumentType extends string> extends IDbRecord<TDocumentType> {
        SyncStatus: "Pending" | "Failed" | "Succeeded";
        SyncRetryCount: number
    }

    interface ISetStatus {
        failed: number;
        pending: number;
        succeeded: number;
    }

    interface IBookV3 extends ISyncDocument<DocumentTypes> {
        author: string;
        publishDate?: Date;
        rejectedCount: number;
    }

    class PouchDbDataContext extends DataContext<DocumentTypes> {

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

        books = this.dbset<IBook>(DocumentTypes.Books).exclude("status", "rejectedCount").create();
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

        //map({ property: "author", map: w => w })
        booksNoKey = this.dbset<IBook>(DocumentTypes.BooksNoKey).exclude("status", "rejectedCount").keys(w => w.none()).create();
        notes = this.dbset<INote>(DocumentTypes.Notes).create();
        contacts = this.dbset<IContact>(DocumentTypes.Contacts).keys(w => w.add("firstName").add("lastName")).create();
        booksV3 = this._setupSyncDbSet<IBookV3>(DocumentTypes.BooksV3).create();
        cars = this.dbset<ICar>(DocumentTypes.Cars).keys(w => w.add(x => x.manufactureDate.toISOString()).add(x => x.make).add("model")).create()
        preference = this.dbset<IPreference>(DocumentTypes.Preference).keys(w => w.add(_ => "static")).create();
        preferencev2 = this.dbset<IPreference>(DocumentTypes.PreferenceV2).keys(w => w.add(() => "")).create();
        readonlyPreference = this.dbset<IPreference>(DocumentTypes.ReadonlyPreference).keys(w => w.add(_ => "static")).readonly().create();

        overrideContacts = this.dbset<IContact>(DocumentTypes.OverrideContacts).keys(w => w.add("firstName").add("lastName")).create(w => ({ ...w, otherFirst: w.first }));
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
    }

    class BooksWithOneDefaultContext extends DataContext<DocumentTypes> {

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


    class BooksWithTwoDefaultContext extends DataContext<DocumentTypes> {

        constructor(name: string) {
            super(name);
        }

        booksWithTwoDefaults = this.dbset<IBook>(DocumentTypes.BooksWithTwoDefaults).exclude("status", "rejectedCount").create();
    }

    class DefaultPropertiesDataContext extends PouchDbDataContext {
        constructor(name: string) {
            super(name);
            this.books.on("add", entity => {
                entity.status = "pending";
            })
        }
    }

    afterAll(async () => {
        const dbNames = Object.keys(dbs)
        await Promise.all(dbNames.map(w => dbs[w].destroyDatabase()));
    })

    it('should add entity and return reference', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(contact.DocumentType).toBe(DocumentTypes.Contacts);
        expect(contact._id).toBe("Contacts/James/DeMeuse");
        expect(contact._rev).not.toBeDefined();

        expect(contact.firstName).toBe("James");
        expect(contact.lastName).toBe("DeMeuse");
        expect(contact.phone).toBe("111-111-1111");
        expect(contact.address).toBe("1234 Test St");
    });

    it('supplying no keys should default to auto', async () => {
        const context = dbFactory(PouchDbDataContext);

        expect(context.books.info().KeyType).toBe("auto")
    });

    it('should only allow one single entity per dbset', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [preference] = await context.preference.add({
            isOtherPropertyOn: true,
            isSomePropertyOn: false
        });

        expect(preference.DocumentType).toBe(DocumentTypes.Preference);
        expect(preference._id).toBe(`${DocumentTypes.Preference}/static`);
        expect(preference._rev).not.toBeDefined();

        expect(preference.isOtherPropertyOn).toBe(true);
        expect(preference.isSomePropertyOn).toBe(false);
    });

    it('should empty and add when only single document allowed', async () => {
        const context = dbFactory(PouchDbDataContext);
        await context.preference.add({
            isOtherPropertyOn: true,
            isSomePropertyOn: false
        });

        await context.saveChanges();

        await context.preference.empty();
        await context.preference.add({
            isOtherPropertyOn: false,
            isSomePropertyOn: false
        });

        await context.saveChanges();

        const items = await context.preference.all();

        expect(items.length).toBe(1);
        const [item] = items;
        expect(item?.isOtherPropertyOn).toBe(false);
        expect(item?.isSomePropertyOn).toBe(false);
    });

    it('should only allow one single entity per dbset - no key', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [preference] = await context.preferencev2.add({
            isOtherPropertyOn: true,
            isSomePropertyOn: false
        });

        expect(preference.DocumentType).toBe(DocumentTypes.PreferenceV2);
        expect(preference._id).toBe(`${DocumentTypes.PreferenceV2}/`);
        expect(preference._rev).not.toBeDefined();

        expect(preference.isOtherPropertyOn).toBe(true);
        expect(preference.isSomePropertyOn).toBe(false);
    });

    it('should only allow one single entity per dbset using none from fluent builder', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [book] = await context.booksNoKey.add({
            author: "me"
        });

        expect(book.DocumentType).toBe(DocumentTypes.BooksNoKey);
        expect(book._id).toBe(DocumentTypes.BooksNoKey);
        expect(book._rev).not.toBeDefined();

        expect(book.author).toBe("me");
    });

    it('should only allow one single entity per dbset and update one entity', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [preference] = await context.preference.add({
            isOtherPropertyOn: true,
            isSomePropertyOn: false
        });

        expect(preference.DocumentType).toBe(DocumentTypes.Preference);
        expect(preference._id).toBe(`${DocumentTypes.Preference}/static`);
        expect(preference._rev).not.toBeDefined();

        expect(preference.isOtherPropertyOn).toBe(true);
        expect(preference.isSomePropertyOn).toBe(false);

        await context.saveChanges();

        const [preference2] = await context.preference.add({
            isOtherPropertyOn: true,
            isSomePropertyOn: false
        });

        await context.saveChanges();

        const preferences = await context.preference.all();

        expect(preferences.length).toBe(1)
    });

    it('should update an entity with previous rev', async () => {

        const dbname = uuidv4();
        const context = dbFactory(DefaultPropertiesDataContext, dbname);
        const [newBook] = await context.books.add({
            author: "James",
            publishDate: new Date()
        });


        await context.saveChanges();

        expect(newBook._rev).toBeDefined();

        const book = await context.books.first();

        context.books.unlink(book);

        const secondBook = await context.books.first();
        secondBook.author = "DeMeuse"
        await context.saveChanges();

        const secondaryContext = dbFactory(DefaultPropertiesDataContext, dbname);
        const [linkedBook] = await secondaryContext.books.link(book);

        linkedBook.author = "James DeMeuse";
        await secondaryContext.saveChanges();

        expect(linkedBook._rev.startsWith("3")).toBe(true)
    });

    it('should add entity, save, and set _rev', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        expect(contact.DocumentType).toBe(DocumentTypes.Contacts);
        expect(contact._id).toBe("Contacts/James/DeMeuse");
        expect(contact._rev).toBeDefined();

        expect(contact.firstName).toBe("James");
        expect(contact.lastName).toBe("DeMeuse");
        expect(contact.phone).toBe("111-111-1111");
        expect(contact.address).toBe("1234 Test St");
    });

    it('should add entity, save, and generate an id', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [note] = await context.notes.add({
            contents: "Some Note",
            createdDate: new Date(),
            userId: "jdemeuse"
        });

        await context.saveChanges();

        expect(note.DocumentType).toBe(DocumentTypes.Notes);

        expect(note._id).toMatch(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/)
        expect(note._rev).toBeDefined();

        expect(note.contents).toBe("Some Note");
        expect(note.createdDate).toBeDefined();
        expect(note.userId).toBe("jdemeuse");
    });

    it('should add entity and create id from selector', async () => {
        const now = new Date();
        const context = dbFactory(PouchDbDataContext);
        const [car] = await context.cars.add({
            make: "Chevrolet",
            manufactureDate: now,
            model: "Silverado",
            year: 2021
        });

        expect(car.DocumentType).toBe(DocumentTypes.Cars);
        expect(car._id).toBe(`${DocumentTypes.Cars}/${now.toISOString()}/Chevrolet/Silverado`);
        expect(car._rev).not.toBeDefined();

        expect(car.make).toBe("Chevrolet");
        expect(car.model).toBe("Silverado");
        expect(car.year).toBe(2021);
        expect(car.manufactureDate).toBe(now);
    });

    it('should add entity, exlude a property and set the default on the add event', async () => {
        const context = dbFactory(DefaultPropertiesDataContext);
        const [book] = await context.books.add({
            author: "James DeMeuse",
            publishDate: new Date()
        });

        await context.saveChanges();

        expect(book.DocumentType).toBe(DocumentTypes.Books);
        expect(book._id).toBeDefined();
        expect(book._rev).toBeDefined();

        expect(book.author).toBe("James DeMeuse");
        expect(book.publishDate).toBeDefined();
        expect(book.status).toBe("pending");
    });

    it('should add entity and not map the returning date', async () => {
        const context = dbFactory(DefaultPropertiesDataContext);
        const [book] = await context.books.add({
            author: "James DeMeuse",
            publishDate: new Date()
        });

        await context.saveChanges();

        expect(book.DocumentType).toBe(DocumentTypes.Books);
        expect(book._id).toBeDefined();
        expect(book._rev).toBeDefined();

        expect(book.author).toBe("James DeMeuse");
        expect(book.publishDate).toBeDefined();
        expect(book.status).toBe("pending");
        expect(Object.prototype.toString.call(book.publishDate)).toBe('[object Date]');

        const found = await context.books.first();

        expect(Object.prototype.toString.call(found?.publishDate)).toBe('[object String]');
    });

    it('should add entity and map the returning date', async () => {
        const context = dbFactory(DefaultPropertiesDataContext);
        const [book] = await context.booksWithDateMapped.add({
            author: "James DeMeuse",
            publishDate: new Date(),
            createdDate: new Date()
        });

        await context.saveChanges();

        expect(book.DocumentType).toBe(DocumentTypes.BooksWithDateMapped);
        expect(book._id).toBeDefined();
        expect(book._rev).toBeDefined();

        expect(book.author).toBe("James DeMeuse");
        expect(Object.prototype.toString.call(book.publishDate)).toBe('[object Date]');
        expect(Object.prototype.toString.call(book.createdDate)).toBe('[object Date]');
        expect(book.status).toBe("pending");

        const found = await context.booksWithDateMapped.first();

        expect(Object.prototype.toString.call(found?.publishDate)).toBe('[object Date]');
        expect(Object.prototype.toString.call(found?.createdDate)).toBe('[object Date]');
    });

    it('should add entity, exlude a property and set the default on the add event with fluent builder', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [book] = await context.booksWithOn.add({
            author: "James DeMeuse",
            publishDate: new Date()
        });

        await context.saveChanges();

        expect(book.DocumentType).toBe(DocumentTypes.BooksWithOn);
        expect(book._id).toBeDefined();
        expect(book._rev).toBeDefined();

        expect(book.author).toBe("James DeMeuse");
        expect(book.publishDate).toBeDefined();
        expect(book.status).toBe("pending");
    });

    it('should add entity, exlude a property and set the default on the add event with fluent builder invoke', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [book] = await context.booksWithOnV2.add({
            author: "James DeMeuse",
            publishDate: new Date()
        });

        await context.saveChanges();

        expect(book.DocumentType).toBe(DocumentTypes.BooksWithOnV2);
        expect(book._id).toBeDefined();
        expect(book._rev).toBeDefined();

        expect(book.author).toBe("James DeMeuse");
        expect(book.publishDate).toBeDefined();
        expect(book.status).toBe("pending");
    });

    it('should get correct number of entities from all', async () => {
        const context = dbFactory(PouchDbDataContext);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.cars.add({
            make: "test",
            manufactureDate: new Date(),
            model: "test",
            year: 2000
        });

        await context.saveChanges();

        const all = await context.contacts.all();

        expect(all.length).toBe(1);
    });

    it('should remove one entity by reference', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        await context.contacts.remove(contact);

        await context.saveChanges();

        const all = await context.contacts.all();

        expect(all.length).toBe(0);
    });

    it('should remove one entity by id', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        await context.contacts.remove(contact._id);

        await context.saveChanges();

        const all = await context.contacts.all();

        expect(all.length).toBe(0);
    });

    it('should remove many entities by reference', async () => {
        const context = dbFactory(PouchDbDataContext);
        const generated: IContact[] = [];

        for (let i = 0; i < 20; i++) {
            const [contact] = await context.contacts.add({
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                phone: faker.phone.phoneNumber(),
                address: faker.address.streetAddress()
            });

            generated.push(contact);
        }

        await context.saveChanges();

        let all = await context.contacts.all();

        expect(all.length).toBe(20);

        await context.contacts.remove(...all);
        await context.saveChanges();

        all = await context.contacts.all();

        expect(all.length).toBe(0);
    });

    it('should remove many entities by id', async () => {

        const context = dbFactory(PouchDbDataContext);
        const generated: IContact[] = [];

        for (let i = 0; i < 20; i++) {
            const [contact] = await context.contacts.add({
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                phone: faker.phone.phoneNumber(),
                address: faker.address.streetAddress()
            });

            generated.push(contact);
        }

        await context.saveChanges();

        let all = await context.contacts.all();

        expect(all.length).toBe(20);

        await context.contacts.remove(...all.map(w => w._id));

        await context.saveChanges();

        all = await context.contacts.all();

        expect(all.length).toBe(0);
    });

    it('should remove correct entity', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [one, _] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "John",
            lastName: "Doe",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        await context.saveChanges();

        await context.contacts.remove(one);

        await context.saveChanges();

        const all = await context.contacts.all();

        expect(all.length).toBe(1);
        expect(all[0]._id).toBe("Contacts/John/Doe");
    });

    it('should get first entity', async () => {
        const context = dbFactory(PouchDbDataContext);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "John",
            lastName: "Doe",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        await context.saveChanges();

        const first = await context.contacts.first();

        expect(first.firstName).toBe("James");
        expect(first.lastName).toBe("DeMeuse");
        expect(first.phone).toBe("111-111-1111");
        expect(first.address).toBe("1234 Test St");
    });

    it('should match entity', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [one] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "John",
            lastName: "Doe",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        await context.saveChanges();

        const two = await context.contacts.first();
        const doesMatch = context.contacts.isMatch(one, two)
        expect(doesMatch).toBe(true);
    });

    it('should not match entity', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [_, one] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "John",
            lastName: "Doe",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        await context.saveChanges();

        const two = await context.contacts.first();
        const doesMatch = context.contacts.isMatch(one, two)
        expect(doesMatch).toBe(false);
    });

    it('should empty entities from dbset', async () => {
        const context = dbFactory(PouchDbDataContext);
        const generated: IContact[] = [];

        for (let i = 0; i < 20; i++) {
            const [contact] = await context.contacts.add({
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                phone: faker.phone.phoneNumber(),
                address: faker.address.streetAddress()
            });

            generated.push(contact);
        }

        await context.saveChanges();

        let all = await context.contacts.all();

        expect(all.length).toBe(20);

        await context.contacts.empty();
        await context.saveChanges();

        all = await context.contacts.all();

        expect(all.length).toBe(0);
    });

    it('should filter entities', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [first] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "John",
            lastName: "Doe",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        await context.saveChanges();

        const filtered = await context.contacts.filter(w => w.firstName === "James");

        expect(filtered.length).toBe(1);

        const doesMatch = context.contacts.isMatch(filtered[0], first);
        expect(doesMatch).toBe(true);
    });

    it('should match correct entities from base documents', async () => {
        const context = dbFactory(PouchDbDataContext);


        for (let i = 0; i < 20; i++) {
            await context.contacts.add({
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                phone: faker.phone.phoneNumber(),
                address: faker.address.streetAddress()
            });

            await context.books.add({
                author: faker.name.firstName()
            });

            await context.notes.add({
                contents: faker.random.words(),
                createdDate: new Date(),
                userId: faker.name.firstName()
            });
        }

        await context.saveChanges();

        const allDocs = await context.getAllDocs();

        const contacts = context.contacts.match(...allDocs);

        expect(contacts.length).toBe(20);
    });

    it('should find correct entity', async () => {
        const context = dbFactory(PouchDbDataContext);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "John",
            lastName: "Doe",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        await context.saveChanges();

        const filtered = await context.contacts.find(w => w.firstName === "John");

        expect(filtered).toBeDefined();

        if (filtered == null) {
            return
        }

        expect(filtered._id).toBe("Contacts/John/Doe");
    });

    it('should find no entity', async () => {
        const context = dbFactory(PouchDbDataContext);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "John",
            lastName: "Doe",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        await context.saveChanges();

        const filtered = await context.contacts.find(w => w.firstName === "Test");

        expect(filtered).not.toBeDefined();
    });

    it('should detach entities from context reference after adding', async () => {

        const context = dbFactory(PouchDbDataContext);
        const [contact] = await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        context.contacts.unlink(contact);

        contact.firstName = "Test";

        expect(context.hasPendingChanges()).toBe(false);
        await context.saveChanges();

        const updated = await context.contacts.find(w => w.firstName === "James");

        expect(updated).toBeDefined();

        if (updated == null) {
            return;
        }

        expect(updated.firstName).toBe("James");
    });

    it('should detach entities from context reference after adding and getting from find', async () => {

        const context = dbFactory(PouchDbDataContext);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const contact = await context.contacts.find(w => w.firstName === "James");

        expect(contact).toBeDefined();

        if (contact == null) {
            return;
        }

        context.contacts.unlink(contact);

        contact.firstName = "Test";

        expect(context.hasPendingChanges()).toBe(false);
        await context.saveChanges();

        const updated = await context.contacts.find(w => w.firstName === "James");

        expect(updated).toBeDefined();

        if (updated == null) {
            return;
        }

        expect(updated.firstName).toBe("James");
    });

    it('should detach entities from context reference after adding and getting from first', async () => {

        const context = dbFactory(PouchDbDataContext);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const contact = await context.contacts.first();

        context.contacts.unlink(contact);

        contact.firstName = "Test";

        expect(context.hasPendingChanges()).toBe(false);
        await context.saveChanges();

        const updated = await context.contacts.find(w => w.firstName === "James");

        expect(updated?.firstName).toBe("James");
    });

    it('should detach entities from context reference after adding and getting from filter', async () => {

        const context = dbFactory(PouchDbDataContext);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const [contact] = await context.contacts.filter(w => w.firstName === "James");

        context.contacts.unlink(contact);

        contact.firstName = "Test";

        expect(context.hasPendingChanges()).toBe(false);
        await context.saveChanges();

        const updated = await context.contacts.find(w => w.firstName === "James");

        expect(updated?.firstName).toBe("James");
    });

    it('should detach one entity from context reference after retrieving from list', async () => {

        const context = dbFactory(PouchDbDataContext);

        for (let i = 0; i < 20; i++) {
            await context.contacts.add({
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                phone: faker.phone.phoneNumber(),
                address: faker.address.streetAddress()
            });

            await context.books.add({
                author: faker.name.firstName()
            });

            await context.notes.add({
                contents: faker.random.words(),
                createdDate: new Date(),
                userId: faker.name.firstName()
            });
        }

        await context.saveChanges();

        const [one, two] = await context.contacts.all();

        context.contacts.unlink(one);

        one.firstName = "Value One";
        two.firstName = "Value Two"

        expect(context.hasPendingChanges()).toBe(true);
        const changeCount = await context.saveChanges();

        expect(changeCount).toBe(1);

        const foundOne = await context.contacts.find(w => w.firstName === "Value One");
        const foundTwo = await context.contacts.find(w => w.firstName === "Value Two");

        expect(foundOne).not.toBeDefined();
        expect(foundTwo).toBeDefined();
    });

    it('should attach one entity', async () => {

        const dbname = uuidv4()
        const context = dbFactory(PouchDbDataContext, dbname);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const [contact] = await context.contacts.filter(w => w.firstName === "James");

        context.contacts.unlink(contact);

        contact.firstName = "Test";

        expect(context.hasPendingChanges()).toBe(false);
        await context.saveChanges();

        const updated = await context.contacts.find(w => w.firstName === "James");

        expect(updated?.firstName).toBe("James");

        contact.firstName = "James";

        const secondContext = dbFactory(PouchDbDataContext, dbname);

        // attaching re-enables entity tracking for properties changed
        const [linkedContact] = await secondContext.contacts.link(contact);

        linkedContact.firstName = "Test";

        expect(secondContext.hasPendingChanges()).toBe(true);
        await secondContext.saveChanges();

        const afterAttach = await secondContext.contacts.find(w => w.firstName === "Test");

        expect(afterAttach).toBeDefined();
    });

    it('should attach many entities', async () => {

        const dbname = uuidv4()
        const context = dbFactory(PouchDbDataContext, dbname);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        }, {
            firstName: "John",
            lastName: "Doe",
            phone: "222-222-2222",
            address: "6789 Test St"
        });

        await context.saveChanges();

        const otherContext = dbFactory(PouchDbDataContext, dbname);
        const [one, two] = await otherContext.contacts.all();

        otherContext.contacts.unlink(one, two);

        one.firstName = "Test";
        two.firstName = "Test";

        expect(otherContext.hasPendingChanges()).toBe(false);
        await otherContext.saveChanges();

        const [updatedOne, updatedTwo] = await otherContext.contacts.all();

        expect(updatedOne.firstName).toBe("James");
        expect(updatedTwo.firstName).toBe("John");

        one.firstName = "James";
        two.firstName = "John";

        const secondContext = dbFactory(PouchDbDataContext, dbname);

        // attaching re-enables entity tracking for properties changed
        const [linkedOne, linkedTwo] = await secondContext.contacts.link(one, two);

        linkedOne.firstName = "Test";
        linkedTwo.firstName = "Test";

        expect(secondContext.hasPendingChanges()).toBe(true);
        await secondContext.saveChanges();

        const afterAttach = await secondContext.contacts.filter(w => w.firstName === "Test");

        expect(afterAttach.length).toBe(2);
    });

    it('extended dbset should call base methods with no issues', async () => {
        const context = dbFactory(PouchDbDataContext);
        await context.overrideContacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const first = await context.overrideContacts.otherFirst();

        expect(first).toBeDefined();
    });

    it('extended dbset should call base methods with no issues - v2', async () => {
        const context = dbFactory(PouchDbDataContext);
        await context.overrideContactsV2.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const first = await context.overrideContactsV2.otherFirst();

        expect(first).toBeDefined();
    });

    it('dbset should set defaults on add', async () => {
        const context = dbFactory(PouchDbDataContext);
        const date = new Date();
        const [book] = await context.booksWithDefaults.add({
            author: "james",
            publishDate: date
        });

        expect(book.status).toBe("pending");
        expect(book.rejectedCount).toBe(0);
        expect(book.author).toBe("james");
        expect(book.DocumentType).toBe(DocumentTypes.BooksWithDefaults);
        expect(book.publishDate).toBe(date);
        expect(book._id).toBeDefined();
        expect(book._rev).not.toBeDefined();
    });

    it('dbset should set defaults on add - v2', async () => {
        const context = dbFactory(PouchDbDataContext);
        const date = new Date();
        const [book] = await context.booksWithDefaultsV2.add({
            author: "james",
            publishDate: date
        });

        expect(book.status).toBe("pending");
        expect(book.rejectedCount).toBe(0);
        expect(book.author).toBe("james");
        expect(book.DocumentType).toBe(DocumentTypes.BooksWithDefaultsV2);
        expect(book.publishDate).toBe(date);
        expect(book._id).toBeDefined();
        expect(book._rev).not.toBeDefined();
    });

    it('dbset should set defaults after fetch', async () => {
        const [missingContext, context] = createDbContexts(name => [new BooksWithOneDefaultContext(name), new PouchDbDataContext(name)]);
        const date = new Date();
        await missingContext.booksWithDefaults.add({
            author: "james",
            publishDate: date
        });

        await missingContext.saveChanges();

        const book = await context.booksWithDefaults.first();

        expect(book.status).toBe("pending");
        expect(book.rejectedCount).toBe(0);
        expect(book.author).toBe("james");
        expect(book.DocumentType).toBe(DocumentTypes.BooksWithDefaults);
        expect(book.publishDate).toBe(date.toISOString());
        expect(book._id).toBeDefined();
        expect(book._rev).toBeDefined();
    });

    it('dbset should set defaults after fetch - v2', async () => {
        const [missingContext, context] = createDbContexts(name => [new BooksWithOneDefaultContext(name), new PouchDbDataContext(name)]);
        const date = new Date();
        await missingContext.booksWithDefaultsV2.add({
            author: "james",
            publishDate: date
        });

        await missingContext.saveChanges();

        const book = await context.booksWithDefaultsV2.first();

        expect(book.status).toBe("pending");
        expect(book.rejectedCount).toBe(0);
        expect(book.author).toBe("james");
        expect(book.DocumentType).toBe(DocumentTypes.BooksWithDefaultsV2);
        expect(book.publishDate).toBe(date.toISOString());
        expect(book._id).toBeDefined();
        expect(book._rev).toBeDefined();
    });

    it('should set _rev on linked entity', async () => {

        const dbname = uuidv4();
        const context = dbFactory(PouchDbDataContext, dbname);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const [contact] = await context.contacts.filter(w => w.firstName === "James");

        context.contacts.unlink(contact);

        contact.firstName = "Test";

        expect(context.hasPendingChanges()).toBe(false);
        await context.saveChanges();

        const updated = await context.contacts.find(w => w.firstName === "James");

        if (updated == null) {
            throw new Error('contact not found')
        }

        expect(updated.firstName).toBe("James");

        updated.firstName = "UPDATE ME";

        await context.saveChanges();

        const secondContext = dbFactory(PouchDbDataContext, dbname);

        expect(contact._rev).not.toBe(updated._rev);

        const [linkedContact] = await secondContext.contacts.link(contact);

        expect(linkedContact._rev).toBe(updated._rev);
    });

    it('dbset should set defaults after fetch for add and retrieve', async () => {
        const [missingContext, context] = createDbContexts(name => [new BooksWithTwoDefaultContext(name), new PouchDbDataContext(name)]);
        const date = new Date();
        await missingContext.booksWithTwoDefaults.add({
            author: "james",
            publishDate: date
        });

        await missingContext.saveChanges();

        const retrievedBook = await context.booksWithTwoDefaults.first();

        const [addedBook] = await context.booksWithTwoDefaults.add({
            author: "james",
            publishDate: date
        });

        expect(retrievedBook.status).toBe("approved");
        expect(retrievedBook.rejectedCount).toBe(-1);
        expect(retrievedBook.author).toBe("james");
        expect(retrievedBook.DocumentType).toBe(DocumentTypes.BooksWithTwoDefaults);
        expect(retrievedBook.publishDate).toBe(date.toISOString());
        expect(retrievedBook._id).toBeDefined();
        expect(retrievedBook._rev).toBeDefined();

        expect(addedBook.status).toBe("pending");
        expect(addedBook.rejectedCount).toBe(0);
        expect(addedBook.author).toBe("james");
        expect(addedBook.DocumentType).toBe(DocumentTypes.BooksWithTwoDefaults);
        expect(addedBook.publishDate).toBe(date);
        expect(addedBook._id).toBeDefined();
        expect(addedBook._rev).not.toBeDefined();
    });

    it('dbset should set defaults after fetch for add and retrieve for all docs', async () => {
        const [missingContext, context] = createDbContexts(name => [new BooksWithTwoDefaultContext(name), new PouchDbDataContext(name)]);
        const date = new Date();
        await missingContext.booksWithTwoDefaults.add({
            author: "james",
            publishDate: date
        });

        await missingContext.saveChanges();

        const all = await context.getAllDocs();
        const [retrievedBook] = context.booksWithTwoDefaults.match(...all)

        const [addedBook] = await context.booksWithTwoDefaults.add({
            author: "james",
            publishDate: date
        });

        expect(retrievedBook.status).toBe("approved");
        expect(retrievedBook.rejectedCount).toBe(-1);
        expect(retrievedBook.author).toBe("james");
        expect(retrievedBook.DocumentType).toBe(DocumentTypes.BooksWithTwoDefaults);
        expect(retrievedBook.publishDate).toBe(date.toISOString());
        expect(retrievedBook._id).toBeDefined();
        expect(retrievedBook._rev).toBeDefined();

        expect(addedBook.status).toBe("pending");
        expect(addedBook.rejectedCount).toBe(0);
        expect(addedBook.author).toBe("james");
        expect(addedBook.DocumentType).toBe(DocumentTypes.BooksWithTwoDefaults);
        expect(addedBook.publishDate).toBe(date);
        expect(addedBook._id).toBeDefined();
        expect(addedBook._rev).not.toBeDefined();
    });


    it('should create an instance and link - same as adding', async () => {
        const dbname = uuidv4();
        const context = dbFactory(PouchDbDataContext, dbname);

        const [contact] = context.contacts.instance({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        expect(context.hasPendingChanges()).toBe(false);

        const count = await context.saveChanges();

        expect(count).toBe(0)

        await context.contacts.add(contact)

        expect(context.hasPendingChanges()).toBe(true);

        const afterLinkCount = await context.saveChanges();

        expect(afterLinkCount).toBe(1);

        const found = context.contacts.first();

        expect(found).toBeDefined();
    });

    it('booksv3 - should add entity, exlude a property and set the default on the add event', async () => {
        const context = dbFactory(PouchDbDataContext);
        const [book] = await context.booksV3.add({
            author: "me",
            rejectedCount: 1,
            publishDate: new Date()
        });

        expect(book.SyncRetryCount).toBe(0);
        expect(book.SyncStatus).toBe("Pending");

        await context.saveChanges();

        expect(book.DocumentType).toBe(DocumentTypes.BooksV3);
        expect(book._id).toBeDefined();
        expect(book._rev).toBeDefined();

        expect(book.author).toBe("me");
        expect(book.publishDate).toBeDefined();
    });
});