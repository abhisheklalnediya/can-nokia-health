'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getTemperature = exports.getDataToken = exports.getAuthUrl = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _pg = require('pg');

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _nokia = require('./nokia');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _db = require('./db');

var _db2 = _interopRequireDefault(_db);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DB_AUTHS = null;

setTimeout(function () {
    DB_AUTHS = _db2.default.getCollection('search');
}, 3000);

var client = new _pg.Client({
    user: 'postgres',
    host: 'iapi.kraftvoll.co',
    database: 'cankadoREST',
    password: '123456',
    port: 5432
});
client.connect();

var getAuthUrl = exports.getAuthUrl = function getAuthUrl(req, res, cankado_user) {
    // var cankado_user = config.CANKADO_USER;
    (0, _nokia.getToken)(cankado_user, function (_ref) {
        var url = _ref.url,
            token = _ref.token;

        var user = DB_AUTHS.findOne({ cankado_user: cankado_user });
        if (!user) {
            user = DB_AUTHS.insert({ cankado_user: cankado_user });
        }
        console.log(user);
        DB_AUTHS.update(_extends({}, user, token, { cankado_user: cankado_user }));
        console.log('KKKKKKK', _extends({}, user, token, { cankado_user: cankado_user }));
        var results = DB_AUTHS.find();
        res.redirect(url);
    }, function () {
        res.status(400);
        res.send('Error');
    });
};

var getDataToken = exports.getDataToken = function getDataToken(req, res, cankado_user) {
    var user = DB_AUTHS.findOne({ cankado_user: cankado_user });
    var _req$query = req.query,
        oauth_token = _req$query.oauth_token,
        oauth_verifier = _req$query.oauth_verifier,
        userid = _req$query.userid;

    user = DB_AUTHS.update(_extends({}, user, {
        user_token: oauth_token,
        user_token_verifier: oauth_verifier,
        nokia_user: userid
    }));
    console.log('UUU', user);
    (0, _nokia.getAccessToken)(oauth_token, user.oauth_token_secret, function (_ref2) {
        var oauth_token = _ref2.oauth_token,
            oauth_token_secret = _ref2.oauth_token_secret;

        DB_AUTHS.update(_extends({}, user, {
            access_token: oauth_token,
            access_token_secret: oauth_token_secret

        }));
        console.log('PPPP', oauth_token, oauth_token_secret);
        _axios2.default.get('' + _config2.default.CANKADO_AUTH + user.cankado_user + '/?userid=' + userid).then(function (d) {
            var _user = user,
                nokia_user = _user.nokia_user,
                cankado_user = _user.cankado_user;

            (0, _nokia.setNotification)({ access_token: oauth_token, access_token_secret: oauth_token_secret, userid: nokia_user, cankado_user: cankado_user });
            res.redirect('http://npat.kraftvoll.co/patient/#/patient/devices/nokia');
        }).catch(function (e) {
            console.log(e);
            res.send('NOT OK');
        });
    });
};

function updateDB(cankado_user, _ref3) {
    var timezone = _ref3.timezone,
        results = _ref3.results;

    if (results.length) {
        var inserts = [];
        results.map(function (r) {
            console.log(r.dateTime);
            var dateTime = (0, _moment2.default)(r.dateTime * 1000).format('YYYY-MM-DD HH:mm:ss') + ' ' + timezone;
            var value = r.value;

            inserts.push(' (TIMESTAMP \'' + dateTime + '\', ' + value + ', \'' + cankado_user + '\', \'' + String((0, _v2.default)()) + '\', \'t\')');
        });
        var q = 'delete from nokia_nokiareading; insert into nokia_nokiareading ("dateTime", value, patient_id, uuid, active) values ' + inserts.join(',') + ';';
        console.log(q);
        client.query(q, [], function (err, res) {
            console.log(err ? err.stack : 'Inserted');
        });
    }
}

var getTemperature = exports.getTemperature = function getTemperature(req, res, cankado_user) {
    var user = DB_AUTHS.findOne({ cankado_user: cankado_user });
    console.log(user);
    var access_token = user.access_token,
        access_token_secret = user.access_token_secret,
        nokia_user = user.nokia_user,
        lastupdate = user.lastupdate;

    (0, _nokia.getMeasure)({ access_token: access_token, access_token_secret: access_token_secret, userid: nokia_user, lastupdate: lastupdate }, function (v) {
        updateDB(cankado_user, v);
        DB_AUTHS.update(_extends({}, user, {
            lastupdate: _lodash2.default.maxBy(v.results, 'dateTime').dateTime
        }));
    });
    res.send('UPDATING DB ' + new Date().getTime());
};