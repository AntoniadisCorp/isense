"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_1 = require("mongodb");
var uri = "mongodb+srv://pant:<pant>@safecarcluster-sezgl.azure.mongodb.net/test?retryWrites=true&w=majority";
var client = new mongodb_1.MongoClient(uri, { useNewUrlParser: true });
exports.client = client;
client.connect(function (err) {
    var collection = client.db("test").collection("devices");
    // perform actions on the collection object
    client.close();
});
