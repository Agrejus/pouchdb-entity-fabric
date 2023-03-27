import { faker } from "@faker-js/faker";
import { DbContextFactory, PouchDbDataContext } from "../../../test-helpers/context";

describe('DbSet Unlink Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should detach entities from context reference after adding', async () => {

        const context = contextFactory.createContext(PouchDbDataContext);
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

        const context = contextFactory.createContext(PouchDbDataContext);
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

        const context = contextFactory.createContext(PouchDbDataContext);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const contact = await context.contacts.first();

        context.contacts.unlink(contact!);

        contact!.firstName = "Test";

        expect(context.hasPendingChanges()).toBe(false);
        await context.saveChanges();

        const updated = await context.contacts.find(w => w.firstName === "James");

        expect(updated?.firstName).toBe("James");
    });

    it('should detach entities from context reference after adding and getting from filter', async () => {

        const context = contextFactory.createContext(PouchDbDataContext);
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

        const context = contextFactory.createContext(PouchDbDataContext);

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
});