import { Schema, model, Document, Model } from 'mongoose';

export declare interface ICategory extends Document {
    _id: string;
    name: string;
    desc: number;
    icon: string;
    parent_id: string;
    children: Array<ICategory>;
    date_added: Date;
    date_modified: Date;
    status: boolean;
    top: boolean;
}

export interface CategoryModel extends Model<ICategory> {};

export class Category {

    private _model: Model<ICategory>;


    constructor(dbCollectionName: string) {
        const schema =  new Schema({
            _id: { type: Schema.Types.ObjectId, required: true },
            name: { type: String, required: true },
            desc: { type: Number, required: true },
            icon: { type: String, required: true },
            parent_id: { type: String, ref: 'Category' },
            children: { type: Array, ref: 'Category' },
            date_added: { type: Date, default: Date.now() },
            date_modified: { type: Date },
            status: { type: String, default: 'active' },
            recyclebin: { type: Boolean, default: false },
        });

        this._model = model<ICategory>(dbCollectionName, schema, dbCollectionName);
    }

    public get model(): Model<ICategory> {
        return this._model
    }
}
