
import { MongoClient } from "mongodb";

const uri = "mongodb+srv://pant:<pant>@safecarcluster-sezgl.azure.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect( (err:any) => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object

  client.close();
})

export { client }