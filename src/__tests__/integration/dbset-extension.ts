import { faker } from "@faker-js/faker";
import { DbContextFactory, PouchDbDataContext } from "../../../test-helpers/context";
import { IContact } from "../../../test-helpers/types";

describe('DbSet Extension Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('extended dbset should call base methods with no issues - v2', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
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

    it('should extend dbset more than once and methods should work', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
        await context.overrideContactsV3.add({
            firstName: "James",
            lastName: "DeMeuse",
            phone: "111-111-1111",
            address: "1234 Test St"
        });

        await context.saveChanges();

        const otherFirst = await context.overrideContactsV3.otherFirst();
        const otherOtherFirst = await context.overrideContactsV3.otherOtherFirst();

        expect(otherFirst).toBeDefined();
        expect(otherOtherFirst).toBeDefined();
    });

    it('should extend more than once when calling common method', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);
        const [book] = await context.booksV4.add({
            author: "me",
            rejectedCount: 1,
            publishDate: new Date()
        });

        expect(book.SyncRetryCount).toBe(0);
        expect(book.SyncStatus).toBe("Pending");

        await context.saveChanges();

        const status = await context.booksV4.toStatus();
        const first = await context.booksV4.otherFirst();

        expect(status).toBeDefined();
        expect(first).toBeDefined();
    });
});