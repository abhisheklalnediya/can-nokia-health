'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lokijs = require('lokijs');

var _lokijs2 = _interopRequireDefault(_lokijs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//const DB = new loki('loki.json');
var db = new _lokijs2.default('db.json', {
    autoload: true,
    autosave: true,
    // verbose: true,
    autoloadCallback: loadHandler
});
var collection;

function loadHandler() {
    console.log('Herrr');
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
exports.default = db;