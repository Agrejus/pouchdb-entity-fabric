declare interface ISeedOptions {
    notes?: INote[];
    contacts?: IContact[];
    books?:IBook[];
}

declare interface IContact {
    firstName: string;
    lastName: string;
    address: string;
    phone: string;
}

declare interface INote {
    contents: string;
    createdDate: Date;
    userId: string;
}

declare interface IBook {
    author: string;
    publishDate?: Date;
    rejectedCount: number;
}
