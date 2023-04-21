import { faker } from "@faker-js/faker";
import { DbContextFactory, PouchDbDataContext } from "../../../test-helpers/context";
import { IContact } from "../../../test-helpers/types";

describe('DbSet Empty Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('should empty entities from dbset', async () => {
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

        await context.contacts.empty();
        await context.saveChanges();

        all = await context.contacts.all();

        expect(all.length).toBe(0);
    });
});