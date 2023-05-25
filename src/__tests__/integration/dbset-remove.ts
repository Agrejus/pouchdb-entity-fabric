import { faker } from "@faker-js/faker";
import { DbContextFactory, PouchDbDataContext } from "./shared/context";
import { IContact } from "./shared/types";

describe('DbSet Remove Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should remove one entity by reference', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
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
        const context = contextFactory.createContext(PouchDbDataContext);
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
        const context = contextFactory.createContext(PouchDbDataContext);
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

        const context = contextFactory.createContext(PouchDbDataContext);
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
        const context = contextFactory.createContext(PouchDbDataContext);
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
});