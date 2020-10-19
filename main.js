const { app, BrowserWindow, ipcMain } = require("electron");
const Realm = require("realm");
const ObjectId = require('bson').ObjectId;

function createWindow() {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile("index.html");
}

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

app.whenReady().then(async () => {
  const realmApp = new Realm.App({ id: "YOUR_APP_ID" });
  let credentials = Realm.Credentials.emailPassword("YOUR_USER", "YOUR_PASSWORD");
  let user = await realmApp.logIn(credentials);

  const config = {
    schema: [DogSchema, PersonSchema],
    path: "my.realm",
    sync: {
      user: user,
      partitionValue: "YOUR_PARTITION"
    }
  };

  // open a synced realm
  const realm = await Realm.open(config);
  
  // await realm.syncSession.downloadAllServerChanges();

  // Get all Persons in the realm
  const persons = realm.objects("Person");
  console.log(`Main: Number of Person objects: ${persons.length}`);


  console.log(`Creating new Person from main`);
  realm.write(() => {
    john = realm.create("Person", {
      "_id": new ObjectId(),
      firstName: "John2",
      lastName: "Smith",
      age: 25
    });
  });
  console.log(`Main: Number of Person objects after creating from main: ${persons.length}`);

  // when receiving an "asynchronous-message" from the renderer process,
  // upload all local changes to the synced realm
  ipcMain.on("asynchronous-message", (event, arg) => {
    console.log("main process: async message received");

    if (arg === "sync") {
      console.log("main process: Syncing all local changes");
      realm.syncSession.uploadAllLocalChanges().then(() => {
        console.log(`Main: Number of Person objects after uploadAllLocalChanges: ${persons.length}`);
      });
    }
  });

  let counter = 0;
  setInterval(() => {
    const persons = realm.objects("Person");
    console.log(`Main message ${counter++}: Number of Person objects: ${persons.length}`);
  }, 3000)

  createWindow();
});
