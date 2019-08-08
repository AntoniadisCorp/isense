import { Schema, model, Document, Model } from 'mongoose';

export declare interface IDevice extends Document {
    _id: string;
    name: string;
    imei: string;
    date_added: Date;
}

export interface DeviceModel extends Model<IDevice> {};

export class Device {

    private _model: Model<IDevice>;

    constructor(dbCollectionName: string) {
        const schema =  new Schema({
            _id: { type: Schema.Types.ObjectId },
            name: { type: String, required: true },
            imei: { type: String, required: true},
            date_added: { type: Date, default: Date.now() }
        });

        this._model = model<IDevice>(dbCollectionName, schema, dbCollectionName);
    }

    public get model(): Model<IDevice> {
        return this._model
    }
}
