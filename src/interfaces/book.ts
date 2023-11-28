import { ObjectId } from 'mongodb';
import { ImageDef } from './imageFile';

interface Dimension {

    x: number
    y: number
}

interface BCase {
    _id: ObjectId | string,
    whatnot: string,
    bookshelf: string,
    bookshelfNo?: number
}

export interface BookCase {
    _id?: string;
    skuid: string;
    name: string;
    type: number;
    whatnot: string;
    bookshelf: string;
    categories?: Array<{ _id: string | ObjectId, name: string }>
    books?: {
        count: number,
        arrIndex: Array<{ _id: string | ObjectId, bookshelfNo: number }>
    }
    desc: string,
    date_added?: Date;
    date_modified?: Date;
    imageUrl?: string;
    disabled: boolean;
    recyclebin?: boolean;
}



export interface Book {

    _id?: ObjectId | string
    SKU: number
    name: string
    libraryId: ObjectId | string
    categoryId?: ObjectId | string
    bookcase: BCase
    author?: string
    publisher?: string
    year?: number
    pages?: number
    volume?: number
    version?: number
    dimensions: Dimension
    isbn10: string
    isbn13: string
    status: string
    notes: string
    avatar: ImageDef
    date_added: Date
    date_modified: Date | null
    recyclebin: boolean
}