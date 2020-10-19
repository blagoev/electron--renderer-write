const { ipcRenderer } = require("electron");
const Realm = require("realm");
const ObjectId = require("bson").ObjectId;

var DogSchema = {
  name: 'Dog',
  properties: {
    _id: 'objectId',
    breed: 'string?',
    name: 'string'
  },
  primaryKey: '_id',
};

var PersonSchema = {
  name: 'Person',
  properties: {
    _id: 'objectId',
    age: 'int',
    dogs: {
      type: 'list',
      objectType: 'Dog'
    },
    firstName: 'string',
    lastName: 'string'
  },
  primaryKey: '_id',
};

async function run() {
  const realmApp = new Realm.App({ id: "YOUR_APP_ID" }); 
  Realm.App.Sync.setLogLevel(realmApp, "all");
  Realm.App.Sync.setLogger(realmApp, (level, message) => {
    console.log(message);
  });

  //let credentials = Realm.Credentials.anonymous();
  let credentials = Realm.Credentials.emailPassword("YOUR_USER", "YOUR_PASSWORD");
  await realmApp.logIn(credentials);

  const config = {
    path: "my.realm",
    schema: [DogSchema, PersonSchema],
    sync: true,
  };

  const realm = new Realm(config);
  const persons = realm.objects("Person");
  console.log(`Renderer: Number of Person objects: ${persons.length}`);

  let counter = 0;
  setInterval(() => {
    // create a new "Person"
    console.log(`Renderer message ${counter++}: Creating new Person object`);

    realm.write(() => {
      john = realm.create("Person", {
        "_id": new ObjectId(),
        firstName: "John2",
        lastName: "Smith",
        age: 25
      });
    });
    console.log(`Renderer: Number of Person objects after write: ${persons.length}`);

    console.log(`renderer: sending sync message`);
    ipcRenderer.send("asynchronous-message", "sync");

  }, 3000)

}

run();
