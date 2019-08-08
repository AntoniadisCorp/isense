import { Schema, model, Document, Model } from 'mongoose';

export declare interface ICate_prod extends Document {
    product_id: string;
    category_id: string;
}

export interface Cate_prodModel extends Model<ICate_prod> {};

export class Cate_prod {

    private _model: Model<ICate_prod>;

    constructor(dbCollectionName: string) {
        const schema =  new Schema({
            product_id: { type: Schema.Types.ObjectId, required: true, ref:'Product' },
            category_id: { type: Schema.Types.ObjectId, required: true, ref: 'Category' },            
        });

        this._model = model<ICate_prod>(dbCollectionName, schema, dbCollectionName);
    }

    public get model(): Model<ICate_prod> {
        return this._model
    }
}
