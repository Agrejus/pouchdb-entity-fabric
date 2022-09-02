import { DataContext } from "../../src/DataContext";
import { DbSetBuilder } from "../../src/DbSetBuilder";
import { IDbRecord, IDbSet } from "../../src/typings";

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
    retroFit: string;
    syncStatus: "pending" | "approved" | "rejected";
    syncRetryCount: 0;
}

interface INote extends IDbRecord<DocumentTypes> {
    contents: string;
    createdDate: Date;
    userId: string;
}

interface IBook extends IDbRecord<DocumentTypes> {
    author: string;
    publishDate?: | string;
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

interface IBaseEntity extends IDbRecord<DocumentTypes> {
    syncStatus: "pending" | "approved" | "rejected";
    syncRetryCount: 0;
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

    private _base<T extends IBaseEntity>(documentType: DocumentTypes) {
        const x = this.dbset<T>(documentType);
        x.defaults({ syncRetryCount: 0 })
        return x
    }

    contacts = this.dbset<IContact>(DocumentTypes.Contacts)
        .defaults({ syncStatus: "pending", syncRetryCount: 0, retroFit: "default" })
        .exclude("syncStatus", "syncRetryCount")
        .keys(w =>
            w.add("firstName")
                .add("lastName")
                .add(w => w.phone.toLocaleLowerCase()))
        .create();

    contactsRetro = this.dbset<IContact>(DocumentTypes.Cars)
        .defaults({ add: { syncStatus: "pending", syncRetryCount: 0, retroFit: "default" } })
        .exclude("syncStatus", "syncRetryCount", "retroFit")
        .keys(w =>
            w.add("firstName")
                .add("lastName")
                .add(w => w.phone.toLocaleLowerCase()))
        .create();
}

export const run = async () => {
    try {
        const context = new PouchDbDataContext();

        // create a new contact
        const [first] = await context.contactsRetro.add({
            address: "some address",
            firstName: "first name",
            lastName: "last name",
            phone: "phone"
        });

        const x = await context.$indexes.create(w => w.fields(x => x.add("Test").add('_id')).name)
        debugger;
        first.address = "";

        debugger;

        await context.saveChanges();

        first.retroFit = "some new value";
        first.firstName = "Skyler";

        await context.saveChanges();

        const contact = await context.contacts.first();

        debugger;

    } catch (e) {
        debugger;
        console.log(e)
    }

}

run(); 