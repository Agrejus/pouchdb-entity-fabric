import { DataContext } from "../DataContext";
import { IDbRecord } from "../typings";
import PouchDB from 'pouchdb';
import memoryAdapter from 'pouchdb-adapter-memory';
import { faker } from '@faker-js/faker';

describe('getting started - data context', () => {

    PouchDB.plugin(memoryAdapter);

    enum DocumentTypes {
        Notes = "Notes",
        Contacts = "Contacts",
        Books = "Books",
        Cars = "Cars",
        Preference = "Preference"
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
        publishDate?:  Date;
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


    class PouchDbDataContext extends DataContext<DocumentTypes> {

        constructor() {
            super('test-db', { adapter: 'memory' });
        }

        async empty() {
            for (let dbset of this) {
                await dbset.empty();
            }

            await this.saveChanges();
        }

        notes = this.createDbSet<INote>(DocumentTypes.Notes);
        contacts = this.createDbSet<IContact>(DocumentTypes.Contacts, "firstName", "lastName");
        books = this.createDbSet<IBook, "status" | "rejectedCount">(DocumentTypes.Books);
        cars = this.createDbSet<ICar>(DocumentTypes.Cars, w => w.manufactureDate.toISOString(), w => w.make, "model");
        preference = this.createDbSet<IPreference>(DocumentTypes.Preference, _ => "static")
    }

    class DefaultPropertiesDataContext extends PouchDbDataContext {
        constructor() {
            super();
            this.books.on("add", entity => {
                entity.status = "pending";
            })
        }
    }

    beforeEach(async () => {
        const context = new PouchDbDataContext();
        await context.empty();
    });

    test('should add entity and return reference', async () => {
        const context = new PouchDbDataContext();
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

    test('should only allow one single entity per dbset', async () => {
        const context = new PouchDbDataContext();
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

    test('should only allow one single entity per dbset and update one entity', async () => {
        const context = new PouchDbDataContext();
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

    test('should update an entity with previous rev', async () => {

        const context = new DefaultPropertiesDataContext();
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

        const secondaryContext = new DefaultPropertiesDataContext();
        await secondaryContext.books.link(book);

        book.author = "James DeMeuse";
        await secondaryContext.saveChanges();

        expect(book._rev.startsWith("3")).toBe(true)
    });

    test('should add entity, save, and set _rev', async () => {
        const context = new PouchDbDataContext();
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

    test('should add entity, save, and generate an id', async () => {
        const context = new PouchDbDataContext();
        const [note] = await context.notes.add({
            contents: "Some Note",
            createdDate: new Date(),
            userId: "jdemeuse"
        });

        await context.saveChanges();

        expect(note.DocumentType).toBe(DocumentTypes.Notes);
        expect(note._id).toBeDefined();
        expect(note._rev).toBeDefined();

        expect(note.contents).toBe("Some Note");
        expect(note.createdDate).toBeDefined();
        expect(note.userId).toBe("jdemeuse");
    });

    test('should add entity and create id from selector', async () => {
        const now = new Date();
        const context = new PouchDbDataContext();
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

    test('should add entity, exlude a property and set the default on the add event', async () => {
        const context = new DefaultPropertiesDataContext();
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

    test('should remove one entity by reference', async () => {
        const context = new PouchDbDataContext();
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

    test('should remove one entity by id', async () => {
        const context = new PouchDbDataContext();
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

    test('should remove many entities by reference', async () => {
        const context = new PouchDbDataContext();
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

    test('should remove many entities by id', async () => {

        const context = new PouchDbDataContext();
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

    test('should remove correct entity', async () => {
        const context = new PouchDbDataContext();
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

    test('should get first entity', async () => {
        const context = new PouchDbDataContext();
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

    test('should match entity', async () => {
        const context = new PouchDbDataContext();
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

    test('should not match entity', async () => {
        const context = new PouchDbDataContext();
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

    test('should empty entities from dbset', async () => {
        const context = new PouchDbDataContext();
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

    test('should filter entities', async () => {
        const context = new PouchDbDataContext();
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

    test('should match correct entities from base documents', async () => {
        const context = new PouchDbDataContext();


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

    test('should find correct entity', async () => {
        const context = new PouchDbDataContext();
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

    test('should find no entity', async () => {
        const context = new PouchDbDataContext();
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

        const context = new PouchDbDataContext();
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

        const context = new PouchDbDataContext();
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

        const context = new PouchDbDataContext();
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

        const context = new PouchDbDataContext();
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

        const context = new PouchDbDataContext();

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

        const context = new PouchDbDataContext();
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

        const secondContext = new PouchDbDataContext();

        // attaching re-enables entity tracking for properties changed
        await secondContext.contacts.link(contact);

        contact.firstName = "Test";

        expect(secondContext.hasPendingChanges()).toBe(true);
        await secondContext.saveChanges();

        const afterAttach = await secondContext.contacts.find(w => w.firstName === "Test");

        expect(afterAttach).toBeDefined();
    });

    it('should attach many entities', async () => {

        const context = new PouchDbDataContext();
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

        const otherContext = new PouchDbDataContext();
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

        const secondContext = new PouchDbDataContext();

        // attaching re-enables entity tracking for properties changed
        await secondContext.contacts.link(one, two);

        one.firstName = "Test";
        two.firstName = "Test";

        expect(secondContext.hasPendingChanges()).toBe(true);
        await secondContext.saveChanges();

        const afterAttach = await secondContext.contacts.filter(w => w.firstName === "Test");

        expect(afterAttach.length).toBe(2);
    });

    // test new get method
});