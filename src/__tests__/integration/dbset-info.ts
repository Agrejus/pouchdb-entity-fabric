import { DbContextFactory, PouchDbDataContext } from "./shared/context";

describe('DbSet Info Tests', () => {

    const contextFactory = new DbContextFactory();

    afterAll(async () => {
        await contextFactory.cleanupAllDbs();
    })

    it('supplying no keys should default to auto', async () => {
        const context = contextFactory.createContext(PouchDbDataContext);

        expect(context.books.info().KeyType).toBe("auto")
    });
});