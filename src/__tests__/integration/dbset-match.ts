import { faker } from "@faker-js/faker";
import { DbContextFactory, PouchDbDataContext } from "../../../test-helpers/context";

describe('DbSet Match Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should match entity', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
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
        const context = contextFactory.createContext(PouchDbDataContext);
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

    it('should match correct entities from base documents', async () => {
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

        const allDocs = await context.getAllDocs();

        const contacts = context.contacts.match(...allDocs);

        expect(contacts.length).toBe(20);
    });

});