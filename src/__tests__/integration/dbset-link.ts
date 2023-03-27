import { DbContextFactory, PouchDbDataContext } from "../../../test-helpers/context";

describe('DbSet Link Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should attach one entity', async () => {

        const dbname = contextFactory.getRandomDbName()
        const context = contextFactory.createContext(PouchDbDataContext, dbname);
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

        contact.firstName = "James Changed";

        const secondContext = contextFactory.createContext(PouchDbDataContext, dbname);

        // attaching re-enables entity tracking for properties changed
        const [linkedContact] = await secondContext.contacts.link(contact);

        linkedContact.firstName = "Test";

        expect(secondContext.hasPendingChanges()).toBe(true);

        await secondContext.saveChanges();

        const afterAttach = await secondContext.contacts.find(w => w.firstName === "Test");

        expect(afterAttach).toBeDefined();
    });

    it('should attach one entity and have no changes', async () => {

        const dbname = contextFactory.getRandomDbName()
        const context = contextFactory.createContext(PouchDbDataContext, dbname);
        await context.contacts.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const [contact] = await context.contacts.filter(w => w.firstName === "James");

        context.contacts.unlink(contact);

        expect(context.hasPendingChanges()).toBe(false);
        await context.saveChanges();

        const secondContext = contextFactory.createContext(PouchDbDataContext, dbname);

        await secondContext.contacts.link(contact);

        expect(secondContext.hasPendingChanges()).toBe(false);
    });


    it('should attach one entity and mark as changed even if we change the entity before attaching', async () => {

        const dbname = contextFactory.getRandomDbName()
        const context = contextFactory.createContext(PouchDbDataContext, dbname);
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

        contact.firstName = "James Changed";

        const secondContext = contextFactory.createContext(PouchDbDataContext, dbname);

        // attaching re-enables entity tracking for properties changed
        await secondContext.contacts.link(contact);

        expect(secondContext.hasPendingChanges()).toBe(true);

        await secondContext.saveChanges();

        const afterAttach = await secondContext.contacts.find(w => w.firstName === "James Changed");

        expect(afterAttach).toBeDefined();
    });

    it('should attach many entities', async () => {

        const dbname = contextFactory.getRandomDbName()
        const context = contextFactory.createContext(PouchDbDataContext, dbname);
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

        const otherContext = contextFactory.createContext(PouchDbDataContext, dbname);
        const [one, two] = await otherContext.contacts.all();

        otherContext.contacts.unlink(one, two);

        one.firstName = "Test";
        two.firstName = "Test";

        expect(otherContext.hasPendingChanges()).toBe(false);
        await otherContext.saveChanges();

        const [updatedOne, updatedTwo] = await otherContext.contacts.all();

        expect(updatedOne.firstName).toBe("James");
        expect(updatedTwo.firstName).toBe("John");

        one.firstName = "James Changed";
        two.firstName = "John Changed";

        const secondContext = contextFactory.createContext(PouchDbDataContext, dbname);

        // attaching re-enables entity tracking for properties changed
        const [linkedOne, linkedTwo] = await secondContext.contacts.link(one, two);

        linkedOne.firstName = "Test";
        linkedTwo.firstName = "Test";

        expect(secondContext.hasPendingChanges()).toBe(true);
        await secondContext.saveChanges();

        const afterAttach = await secondContext.contacts.filter(w => w.firstName === "Test");

        expect(afterAttach.length).toBe(2);
    });

    it('should set _rev on linked entity', async () => {

        const dbname = contextFactory.getRandomDbName()
        const context = contextFactory.createContext(PouchDbDataContext, dbname);
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

        const secondContext = contextFactory.createContext(PouchDbDataContext, dbname);

        expect(contact._rev).not.toBe(updated._rev);

        const [linkedContact] = await secondContext.contacts.link(contact);

        expect(linkedContact._rev).toBe(updated._rev);
    });
});