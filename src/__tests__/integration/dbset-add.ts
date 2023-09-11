import { parseDocumentReference } from "../../common/LinkedDatabase";
import PouchDB from 'pouchdb';
import { DbContextFactory, PouchDbDataContext, BooksWithTwoDefaultContext, ExperimentalPouchDbDataContext } from "./shared/context";
import { DocumentTypes } from "./shared/types";
import { EntityAndTag } from "../../types/dbset-types";

describe('DbSet Add Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should add entity and return reference', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
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

    it('should only allow one single entity per dbset', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
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
        const context = contextFactory.createContext(PouchDbDataContext);
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
        const context = contextFactory.createContext(PouchDbDataContext);
        const [preference] = await context.preferencev2.add({
            isOtherPropertyOn: true,
            isSomePropertyOn: false
        });

        expect(preference.DocumentType).toBe(DocumentTypes.PreferenceV2);
        expect(preference._id).toBe(`${DocumentTypes.PreferenceV2}`);
        expect(preference._rev).not.toBeDefined();

        expect(preference.isOtherPropertyOn).toBe(true);
        expect(preference.isSomePropertyOn).toBe(false);
    });

    it('should only allow one single entity per dbset using none from fluent builder', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
        const [book] = await context.booksNoKey.add({
            author: "me"
        });

        expect(book.DocumentType).toBe(DocumentTypes.BooksNoKey);
        expect(book._id).toBe(DocumentTypes.BooksNoKey);
        expect(book._rev).not.toBeDefined();

        expect(book.author).toBe("me");
    });

    it('should only allow one single entity per dbset and update one entity', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
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

    it('should add entity, save, and set _rev', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
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
        const context = contextFactory.createContext(PouchDbDataContext);
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
        const context = contextFactory.createContext(PouchDbDataContext);
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
        const context = contextFactory.createContext(PouchDbDataContext);

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
        const context = contextFactory.createContext(PouchDbDataContext);
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
        const context = contextFactory.createContext(PouchDbDataContext);
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

    it('dbset should set defaults on add', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
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
        const context = contextFactory.createContext(PouchDbDataContext);
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

    it('dbset should set defaults after fetch for add and retrieve', async () => {
        const [missingContext, context] = contextFactory.createDbContexts(name => [new BooksWithTwoDefaultContext(name), new PouchDbDataContext(name)]);
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

        expect(retrievedBook?.status).toBe("approved");
        expect(retrievedBook?.rejectedCount).toBe(-1);
        expect(retrievedBook?.author).toBe("james");
        expect(retrievedBook?.DocumentType).toBe(DocumentTypes.BooksWithTwoDefaults);
        expect(retrievedBook?.publishDate).toBe(date.toISOString());
        expect(retrievedBook?._id).toBeDefined();
        expect(retrievedBook?._rev).toBeDefined();

        expect(addedBook.status).toBe("pending");
        expect(addedBook.rejectedCount).toBe(0);
        expect(addedBook.author).toBe("james");
        expect(addedBook.DocumentType).toBe(DocumentTypes.BooksWithTwoDefaults);
        expect(addedBook.publishDate).toBe(date);
        expect(addedBook._id).toBeDefined();
        expect(addedBook._rev).not.toBeDefined();
    });

    it('dbset should set defaults after fetch for add and retrieve for all docs', async () => {
        const [missingContext, context] = contextFactory.createDbContexts(name => [new BooksWithTwoDefaultContext(name), new PouchDbDataContext(name)]);
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
        const dbname = contextFactory.getRandomDbName();
        const context = contextFactory.createContext(PouchDbDataContext, dbname);

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
        const context = contextFactory.createContext(PouchDbDataContext);
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

    it('should insert and add with auto generated id', async () => {

        try {
            const dbname = contextFactory.getRandomDbName();
            const context = contextFactory.createContext(PouchDbDataContext, dbname);

            const all = await context.notes.all();

            expect(all.length).toBe(0);

            const [one] = await context.notes.upsert({
                contents: "some contents",
                createdDate: new Date(),
                userId: "some user"
            });

            expect(context.hasPendingChanges()).toBe(true);
            await context.saveChanges();
            expect(context.hasPendingChanges()).toBe(false);

            const [two] = await context.notes.upsert({
                contents: "some contents",
                createdDate: new Date(),
                userId: "some user"
            });

            expect(context.hasPendingChanges()).toBe(true);
            await context.saveChanges();
            expect(context.hasPendingChanges()).toBe(false);

            const allAfterAdd = await context.notes.all();
            expect(allAfterAdd.length).toBe(2);

            const foundOne = await context.notes.find(w => w._id === one._id);

            expect(foundOne).toBeDefined();

            const [upsertedOne, upsertedTwo] = await context.notes.upsert({
                _id: one._id,
                contents: "changed contents",
                createdDate: new Date(),
                userId: "changed user"
            }, {
                contents: "changed contents 2",
                createdDate: new Date(),
                userId: "changed user 2"
            });


            expect(upsertedOne._id).toBe(one._id);
            expect(context.hasPendingChanges()).toBe(true);
            await context.saveChanges();
            expect(context.hasPendingChanges()).toBe(false);

            const foundUpsertOne = await context.notes.find(w => w._id === one._id);

            expect({ ...upsertedOne, createdDate: upsertedOne.createdDate.toISOString() }).toEqual({ ...foundUpsertOne });
            expect(foundUpsertOne?.contents).toBe("changed contents");
            expect(foundUpsertOne?.userId).toBe("changed user");

            const foundUpsertTwo = await context.notes.find(w => w._id === upsertedTwo._id);
            expect(foundUpsertTwo?.contents).toBe("changed contents 2");
            expect(foundUpsertTwo?.userId).toBe("changed user 2");

            const final = await context.notes.all();
            expect(final.length).toBe(3);

        } catch (e) {
            expect(e).not.toBeDefined()
        }
    });

    it('should create split record and have no reference', async () => {
        const dbName = contextFactory.getRandomDbName();
        const context = contextFactory.createExperimentalContext(ExperimentalPouchDbDataContext, dbName);

        const [added] = await context.splitComputers.add({
            cores: 1,
            name: "some pc",
            reference: {
                contents: "Some Note",
                createdDate: "some date",
                userId: "jdemeuse"
            }
        });

        await context.saveChanges();

        expect(added.reference).toBeDefined();
        expect(added.referencePath).toBeDefined();

        const reference = parseDocumentReference(added.referencePath)

        const db = new PouchDB(dbName);
        const doc: any = await db.get(added._id);

        expect(doc.reference).not.toBeDefined();
        expect(doc.referencePath).toBeDefined();

        const refDb = new PouchDB(reference?.databaseName);
        const refDoc = await refDb.get(reference?.selector?.value ?? "");

        expect(refDoc._id).toBe(reference?.selector?.value)
    });

    it('should create split record and the unmanaged record should not have a reference to it', async () => {
        const dbName = contextFactory.getRandomDbName();
        const context = contextFactory.createExperimentalContext(ExperimentalPouchDbDataContext, dbName);

        const [added] = await context.splitComputers.add({
            cores: 1,
            name: "some pc",
            reference: {
                contents: "Some Note",
                createdDate: "some date",
                userId: "jdemeuse"
            }
        });

        await context.saveChanges();

        const [addedBook] = await context.splitBooks.add({
            author: "James",
            rejectedCount: 1,
            status: "approved",
            publishDate: "some date",
            referencePath: added.referencePath
        });

        await context.saveChanges();

        expect(addedBook.reference).not.toBeDefined();
        expect(addedBook.referencePath).toBeDefined();

        const foundBook = await context.splitBooks.find(w => w._id === addedBook._id);

        expect(foundBook?.reference).toBeDefined();
        expect(foundBook?.referencePath).toBeDefined();

        const db = new PouchDB(dbName);
        const doc: any = await db.get(foundBook!._id);

        expect(doc.reference).not.toBeDefined();
        expect(doc.referencePath).toBeDefined();

        const reference = parseDocumentReference(addedBook.referencePath!)

        const refDb = new PouchDB(reference?.databaseName);
        const refDoc = await refDb.get(reference?.selector?.value ?? "");

        expect(refDoc._id).toBe(reference?.selector?.value)
    });

    it('should create split record and the unmanaged record should not have a reference to it and should save properly', async () => {
        const dbName = contextFactory.getRandomDbName();
        const context = contextFactory.createExperimentalContext(ExperimentalPouchDbDataContext, dbName);

        const [added] = await context.splitComputers.add({
            cores: 1,
            name: "some pc",
            reference: {
                contents: "Some Note",
                createdDate: "some date",
                userId: "jdemeuse"
            }
        });

        await context.saveChanges();

        const [addedBook] = await context.splitBooks.add({
            author: "James",
            rejectedCount: 1,
            status: "approved",
            publishDate: "some date",
            referencePath: added.referencePath
        });

        await context.saveChanges();

        const foundBook = await context.splitBooks.find(w => w._id === addedBook._id);

        foundBook!.author = "Megan";

        await context.saveChanges();

        expect(foundBook?.reference).toBeDefined();
        expect(foundBook?.referencePath).toBeDefined();

        const db = new PouchDB(dbName);
        const doc: any = await db.get(foundBook!._id);

        expect(doc.reference).not.toBeDefined();
        expect(doc.referencePath).toBeDefined();

        const reference = parseDocumentReference(addedBook.referencePath!)

        const refDb = new PouchDB(reference?.databaseName);
        const refDoc = await refDb.get(reference?.selector?.value ?? "");

        expect(refDoc._id).toBe(reference?.selector?.value)
    });

    it('should append meta data to one entity', (done) => {
        const metaData = "Some Meta"
        const dbName = contextFactory.getRandomDbName();
        let calls = 0;
        const context = contextFactory.createContext(class extends PouchDbDataContext {
   
            async onAfterSaveChanges(getChanges: () => { adds: EntityAndTag[]; removes: EntityAndTag[]; updates: EntityAndTag[]; }): Promise<void> {
                calls++;
                const changes = getChanges();
                expect(changes.adds.length).toBe(1);
                expect(changes.adds[0].entity).toBeTruthy();
                expect(changes.adds[0].tag).toBe(metaData);
                expect(calls).toBe(1)
                done();
            }

        }, dbName);

        context.books.tag(metaData).add({
            author: "James"
        }).then(() => context.saveChanges());
    });

    it('should not append meta data to one entity', (done) => {
        const dbName = contextFactory.getRandomDbName();
        let calls = 0;
        const context = contextFactory.createContext(class extends PouchDbDataContext {
   
            async onAfterSaveChanges(getChanges: () => { adds: EntityAndTag[]; removes: EntityAndTag[]; updates: EntityAndTag[]; }): Promise<void> {
                calls++;
                const changes = getChanges();
                expect(changes.adds.length).toBe(1);
                expect(changes.adds[0].entity).toBeTruthy();
                expect(changes.adds[0].tag).toBeFalsy();
                expect(calls).toBe(1)
                done();
            }

        }, dbName);

        context.books.add({
            author: "James"
        }).then(() => context.saveChanges());
    });

    it('should append meta data to many entities', (done) => {
        const tag = "Some Meta"
        const dbName = contextFactory.getRandomDbName();
        let calls = 0;
        const context = contextFactory.createContext(class extends PouchDbDataContext {
   
            async onAfterSaveChanges(getChanges: () => { adds: EntityAndTag[]; removes: EntityAndTag[]; updates: EntityAndTag[]; }): Promise<void> {
                calls++;
                const changes = getChanges();
                expect(changes.adds.length).toBe(2);
                expect(changes.adds[0].entity).toBeTruthy();
                expect(changes.adds[0].tag).toBe(tag);

                expect(changes.adds[1].entity).toBeTruthy();
                expect(changes.adds[1].tag).toBe(tag);

                expect(calls).toBe(1)
                done();
            }

        }, dbName);

        context.books.tag(tag).add({
            author: "James"
        },{
            author: "Megan"
        }).then(() => context.saveChanges());
    });

    it('should append meta data to many entities in different transactions', (done) => {
        const tag = "Some Meta"
        const dbName = contextFactory.getRandomDbName();
        let calls = 0;
        const context = contextFactory.createContext(class extends PouchDbDataContext {
   
            async onAfterSaveChanges(getChanges: () => { adds: EntityAndTag[]; removes: EntityAndTag[]; updates: EntityAndTag[]; }): Promise<void> {
                calls++;
                const changes = getChanges();
                
                expect(changes.adds.length).toBe(2);
                expect(changes.adds[0].entity).toBeTruthy();
                expect(changes.adds[0].tag).toBe(tag);

                expect(changes.adds[1].entity).toBeTruthy();
                expect(changes.adds[1].tag).toBe(tag);

                expect(calls).toBe(1)
                done();
            }

        }, dbName);

        context.books.tag(tag).add({
            author: "James"
        }).then(() => {

            context.books.tag(tag).add({
                author: "Megan"
            }).then(() => {

                context.saveChanges();
            })

        });
    });

    it('should append meta to first transaction and not the second', (done) => {
        const tag = "Some Meta"
        const dbName = contextFactory.getRandomDbName();
        let calls = 0;
        const context = contextFactory.createContext(class extends PouchDbDataContext {
   
            async onAfterSaveChanges(getChanges: () => { adds: EntityAndTag[]; removes: EntityAndTag[]; updates: EntityAndTag[]; }): Promise<void> {
                calls++;
                const changes = getChanges();

                if (calls === 1) {
                    expect(changes.adds.length).toBe(1);
                    expect(changes.adds[0].entity).toBeTruthy();
                    expect(changes.adds[0].tag).toBe(tag);
                }

                if (calls === 2) {
                    expect(changes.adds.length).toBe(1);
                    expect(changes.adds[0].entity).toBeTruthy();
                    expect(changes.adds[0].tag).toBeFalsy();
                }

                if (calls === 2) {
                    done();
                }
            }

        }, dbName);

        context.books.tag(tag).add({
            author: "James"
        }).then(() => {

            context.saveChanges().then(() => {

                context.books.add({
                    author: "Megan"
                }).then(() => {
                    context.saveChanges();
                })
            })
        });
    });
});