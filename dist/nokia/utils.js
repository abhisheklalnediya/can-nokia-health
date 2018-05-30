'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.sortObject = sortObject;
exports.genQueryString = genQueryString;
exports.getBaseString = getBaseString;
exports.getBaseSrtingSignature = getBaseSrtingSignature;
exports.getAuthorizationURL = getAuthorizationURL;
exports.getDefaultParams = getDefaultParams;

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _cryptoJs = require('crypto-js');

var _cryptoJs2 = _interopRequireDefault(_cryptoJs);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var KEY = _config2.default.KEY,
    SECRET = _config2.default.SECRET;

console.log(KEY, SECRET, _config2.default);
var REQUEST_AUTHORIZATION_BASE = 'https://developer.health.nokia.com/account/authorize';

function sortObject(o) {
    var sorted = {};
    var key = null;
    var a = [];
    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key);
        }
    }
    a.sort();
    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = o[a[key]];
    }
    return sorted;
}

function genQueryString(input_params) {
    var params = sortObject(input_params);
    var query_string = [];
    for (var param in params) {
        if (param.indexOf('action') == -1 && param.indexOf('user_id') == -1 && param.indexOf('callbackurl') == -1 && param.indexOf('start') == -1 && param.indexOf('lastupdate') == -1 && param.indexOf('end') == -1 && param.indexOf('offset') == -1) {
            query_string.push('oauth_' + param + '=' + params[param]);
        } else {
            query_string.push(param + '=' + params[param]);
        }
    }
    query_string = query_string.sort().join('&');
    return query_string;
}

function getBaseString(arr) {
    var arr1 = arr.map(function (x) {
        return require('querystring').escape(x);
    });
    return arr1.join('&');
}

function getBaseSrtingSignature(baseString, oAuthSecret) {
    var hmac = _cryptoJs2.default.HmacSHA1(baseString, oAuthSecret);
    var oauth_signature = encodeURIComponent(_cryptoJs2.default.HmacSHA1(baseString, oAuthSecret).toString(_cryptoJs2.default.enc.Base64));
    return oauth_signature;
}

function getAuthorizationURL(token) {
    var default_params = getDefaultParams();
    default_params['token'] = token.oauth_token;
    var baseString = getBaseString(['GET', REQUEST_AUTHORIZATION_BASE, genQueryString(default_params)]);
    var oAuthSecret = SECRET + '&' + token.oauth_token_secret;

    default_params['signature'] = getBaseSrtingSignature(baseString, oAuthSecret);

    var request_url = REQUEST_AUTHORIZATION_BASE + '?' + genQueryString(default_params);
    console.log('Go to this URL:');
    console.log(request_url);
    return request_url;
}

function getDefaultParams() {
    return {
        nonce: _crypto2.default.randomBytes(16).toString('hex'),
        timestamp: Math.floor(new Date() / 1000),
        consumer_key: KEY,
        signature_method: 'HMAC-SHA1',
        version: '1.0'
    };
}