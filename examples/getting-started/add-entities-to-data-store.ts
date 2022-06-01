import { IExample } from "..";
import { DocumentTypes, PouchDbDataContext } from "./create-data-context"

const run = async () => {
    const context = new PouchDbDataContext();

    await context.empty();

    const [first, second] = await context.contacts.add({
        email: "james.demeuse@gmail.com",
        firstName: "James",
        lastName: "DeMeuse",
        phoneNumber: "111-111-1111"
    }, {
        email: "jd@mail.com",
        firstName: "Jim",
        lastName: "DeMeuse",
        phoneNumber: "111-111-1111",
        middleName: "D"
    });

    await context.saveChanges();

    const contacts = await context.contacts.all();

    console.assert(contacts.length === 2, 'First should add and persist two entities');
    console.assert(first._id != null, 'First should have an id');
    console.assert(first._rev != null, 'First should have an rev');
    console.assert(first.DocumentType === DocumentTypes.Contacts, 'First should correct document type');

    console.assert(second._id != null, 'Second should have an id');
    console.assert(second._rev != null, 'Second should have an rev');
    console.assert(second.DocumentType === DocumentTypes.Contacts, 'Second should correct document type');
    console.assert(second.middleName === "D", 'Second middle name should be correct');
}

export const example: IExample = {
    run,
    name: "add-entities-to-data-store"
}