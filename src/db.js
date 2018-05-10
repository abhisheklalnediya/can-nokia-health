import loki from 'lokijs';
//const DB = new loki('loki.json');
var db = new loki('db.json', {
    autoload: true,
    autosave: true,
    // verbose: true,
    autoloadCallback: loadHandler,
});
var collection;

function loadHandler() {
    console.log('Herrr')
  // if database did not exist it will be empty so I will intitialize here
  collection = db.getCollection('search');
//   console.log(collection);
  if (collection === null) {
    collection = db.addCollection('search', {
        unique: ['cankado_user']
    });
  }
}
//loadHandler()
export default db;
