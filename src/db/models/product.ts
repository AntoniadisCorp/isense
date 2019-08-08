import { Schema, model, Document, Model } from 'mongoose';

export declare interface IProduct extends Document {
    _id: string;
    brandName: string;
    ProductName: string;
    desc: string,
    price: number,
    stock_id: string,
    Rating: number,  
    date_added: Date;
    date_modified: Date;
}

export interface ProductModel extends Model<IProduct> {};

export class Product {

    private _model: Model<IProduct>;

    constructor(dbCollectionName: string) {
        const schema =  new Schema({
            _id: { type: Schema.Types.ObjectId, required: true },
            brandName: { type: String, required: true },
            productName: { type: String, required: true },
            desc: { type: String, required: true },
            price: { type: Number, required: true },
            stock_id: { type: String, required: true },
            Rating:  { type: Number, required: true },
            date_added: { type: Date, default: Date.now() },
            date_modified: { type: Date }
        });

        this._model = model<IProduct>(dbCollectionName, schema, dbCollectionName);
    }

    public get model(): Model<IProduct> {
        return this._model
    }
}
