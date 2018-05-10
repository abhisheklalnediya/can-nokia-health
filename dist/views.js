'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getTemperature = exports.getDataToken = exports.getAuthUrl = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _nokia = require('./nokia');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _db = require('./db');

var _db2 = _interopRequireDefault(_db);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DB_AUTHS = null;
setTimeout(function () {
    DB_AUTHS = _db2.default.getCollection('search');
}, 3000);

var getAuthUrl = exports.getAuthUrl = function getAuthUrl(req, res) {
    var cankado_user = _config2.default.CANKADO_USER;
    var token = (0, _nokia.getToken)(cankado_user, function (_ref) {
        var url = _ref.url,
            token = _ref.token;

        res.send('Got to ' + url);

        var user = DB_AUTHS.findOne({ cankado_user: cankado_user });
        if (!user) {
            user = DB_AUTHS.insert({ cankado_user: cankado_user });
        }
        DB_AUTHS.update(_extends({}, user, token, { cankado_user: cankado_user }));
        var results = DB_AUTHS.find();
        console.log(results);
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

    (0, _nokia.getAccessToken)(oauth_token, user.oauth_token_secret, function (_ref2) {
        var oauth_token = _ref2.oauth_token,
            oauth_token_secret = _ref2.oauth_token_secret;

        //    DB_AUTHS.update({...results, })
        DB_AUTHS.update(_extends({}, user, {
            access_token: oauth_token,
            access_token_secret: oauth_token_secret
        }));
    });
    res.send('OK');
};

var getTemperature = exports.getTemperature = function getTemperature(req, res, cankado_user) {
    var user = DB_AUTHS.findOne({ cankado_user: cankado_user });
    console.log(user);
    // var results = DB_AUTHS.find();
    // console.log(results);
    var access_token = user.access_token,
        access_token_secret = user.access_token_secret,
        nokia_user = user.nokia_user;

    (0, _nokia.getMeasure)({ access_token: access_token, access_token_secret: access_token_secret, userid: nokia_user });
    res.send('OK');
};