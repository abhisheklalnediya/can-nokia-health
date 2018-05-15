'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getToken = getToken;
exports.getAccessToken = getAccessToken;
exports.getMeasure = getMeasure;
exports.setNotification = setNotification;
exports.listNotification = listNotification;

var _fs = require('fs');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var crypto = require('crypto');
var CryptoJS = require("crypto-js");
var btoa = require('btoa');
var axios = require('axios');
var config = require('./config');
var queryString = require('query-string');
var uuid = require('uuid/v5');
var moment = require('moment');
var loki = require('lokijs');

var REQUEST_TOKEN_BASE = config.REQUEST_TOKEN_BASE;
var REQUEST_AUTHORIZATION_BASE = config.REQUEST_AUTHORIZATION_BASE;

var KEY = config.KEY;
var SECRET = config.SECRET;

function sortObject(o) {
    var sorted = {},
        key,
        a = [];
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
        if (param.indexOf("action") == -1 && param.indexOf("user_id") == -1 && param.indexOf("callbackurl") == -1 &&
        //param.indexOf("comment") == -1 && 
        //param.indexOf("appli") == -1 && 
        param.indexOf("start") == -1 && param.indexOf("lastupdate") == -1 && param.indexOf("end") == -1 //&& 
        //param.indexOf("type") == -1 //&&
        //param.indexOf("meastype") == -1 
        ) {
                query_string.push("oauth_" + param + "=" + params[param]);
            } else {
            query_string.push(param + "=" + params[param]);
        }
    }
    query_string = query_string.join('&');
    console.log(query_string);
    return query_string;
}

function getDefaultParams() {
    return {
        nonce: crypto.randomBytes(16).toString('hex'),
        timestamp: Math.floor(new Date() / 1000),
        consumer_key: KEY,
        signature_method: "HMAC-SHA1",
        version: "1.0"
    };
}

function getBaseString(arr) {
    var arr1 = arr.map(function (x) {
        return require("querystring").escape(x);
    });
    return arr1.join('&');
}

function getBaseSrtingSignature(baseString, oAuthSecret) {
    var hmac = CryptoJS.HmacSHA1(baseString, oAuthSecret);
    var oauth_signature = encodeURIComponent(CryptoJS.HmacSHA1(baseString, oAuthSecret).toString(CryptoJS.enc.Base64));
    return oauth_signature;
}

function getAuthorizationURL(token) {
    var default_params = getDefaultParams();
    default_params["token"] = token.oauth_token;
    var baseString = getBaseString(['GET', REQUEST_AUTHORIZATION_BASE, genQueryString(default_params)]);
    var oAuthSecret = SECRET + "&" + token.oauth_token_secret;

    default_params["signature"] = getBaseSrtingSignature(baseString, oAuthSecret);

    var request_url = REQUEST_AUTHORIZATION_BASE + "?" + genQueryString(default_params);
    console.log("Go to this URL:");
    console.log(request_url);
    return request_url;
}

function getToken(cankado_user, successCallback, errorCallback) {
    var default_params = getDefaultParams();
    var additional_params = {
        callback: encodeURIComponent(config.CAN_NOKIA_DOMAIN + '/2/' + cankado_user + '/')
    };
    var baseString = getBaseString(["GET", REQUEST_TOKEN_BASE, genQueryString(Object.assign(default_params, additional_params))]);
    var oAuthSecret = SECRET + "&";
    default_params["signature"] = getBaseSrtingSignature(baseString, oAuthSecret);

    var request_url = REQUEST_TOKEN_BASE + "?" + genQueryString(default_params);
    var authUrl = '';
    axios.get(request_url).then(function (_ref) {
        var status = _ref.status,
            data = _ref.data;

        var token = queryString.parse(data);
        authUrl = getAuthorizationURL(token);
        successCallback({
            url: authUrl,
            token: token
        });
    }).catch(function (error) {
        console.log(error);
        errorCallback(error);
    });
    return authUrl;
};

function getAccessToken(token, token_secret, successCallback) {
    var default_params = getDefaultParams();
    var additional_params = {
        token: token,
        userid: 15354048
    };

    var baseString = getBaseString(["GET", config.REQUEST_ACCESS_TOKEN_BASE, genQueryString(Object.assign(default_params, additional_params))]);

    var oAuthSecret = SECRET + "&" + token_secret;
    default_params["signature"] = getBaseSrtingSignature(baseString, oAuthSecret);
    var request_url = config.REQUEST_ACCESS_TOKEN_BASE + "?" + genQueryString(Object.assign(default_params, additional_params));
    axios.get(request_url).then(function (_ref2) {
        var status = _ref2.status,
            data = _ref2.data;

        var token = queryString.parse(data);
        successCallback(token);
        //console.log(token, data)
        // getmeasure(token)
        //notification(token)
    }).catch(function (error) {
        console.log(error);
    });
}

function getMeasure(token, successCallback) {
    var default_params = getDefaultParams();
    var additional_params = {
        token: token.access_token,
        userid: token.userid,
        action: 'getmeas',
        meastype: '71'
    };
    // if(token.lastupdate){
    //     additional_params.lastupdate = token.lastupdate
    // }
    var baseString = getBaseString(["GET", config.REQUEST_TEMP_TOKEN_BASE, genQueryString(Object.assign(default_params, additional_params))]);

    var oAuthSecret = SECRET + "&" + token.access_token_secret;
    default_params["signature"] = getBaseSrtingSignature(baseString, oAuthSecret);
    var request_url = config.REQUEST_TEMP_TOKEN_BASE + "?" + genQueryString(Object.assign(default_params, additional_params));
    console.log(request_url);
    axios.get(request_url).then(function (_ref3) {
        var status = _ref3.status,
            data = _ref3.data;

        var results = [];
        console.log(data);
        data.body.measuregrps.map(function (x) {
            var v = null;
            //console.log(x.grpid)
            x.measures.map(function (y) {
                if (y.type === 71) {
                    console.log(x.date, y);
                    v = y.value * Math.pow(10, y.unit);
                }
            });
            if (v) {
                results.push({ dateTime: x.date, value: v });
            }
        });
        successCallback({
            timezone: data.body.timezone,
            results: results
        });
        //notification(token)
    }).catch(function (error) {
        console.log(error);
    });
}

function setNotification(token) {
    var default_params = getDefaultParams();
    var additional_params = {
        token: token.access_token,
        userid: token.userid,
        action: 'subscribe',
        callbackurl: encodeURIComponent(config.CAN_NOKIA_DOMAIN + '/3/' + token.cankado_user + '/'),
        comment: 'test'
        //appli: 12
    };
    console.log(additional_params);
    console.log(config.CAN_NOKIA_DOMAIN + '/3/' + token.cankado_user + '/');
    var baseString = getBaseString(["GET", config.REQUEST_NOTIFY_BASE, genQueryString(Object.assign(default_params, additional_params))]);
    var oAuthSecret = SECRET + "&" + token.access_token_secret;
    default_params["signature"] = getBaseSrtingSignature(baseString, oAuthSecret);
    var request_url = config.REQUEST_NOTIFY_BASE + "?" + genQueryString(Object.assign(default_params, additional_params));
    console.log(request_url);
    axios.get(request_url).then(function (_ref4) {
        var status = _ref4.status,
            data = _ref4.data;

        console.log('NOTIFYYYYY', data);
    }).catch(function (error) {
        console.log(error);
    });
}

function listNotification(token) {
    console.log(token);
    var default_params = getDefaultParams();
    var additional_params = {
        token: token.access_token,
        userid: token.userid,
        action: 'list'
        //appli: 12
    };
    console.log(additional_params);
    console.log(config.CAN_NOKIA_DOMAIN + '/3/' + token.cankado_user + '/');
    var baseString = getBaseString(["GET", config.REQUEST_NOTIFY_BASE, genQueryString(Object.assign(default_params, additional_params))]);
    var oAuthSecret = SECRET + "&" + token.access_token_secret;
    default_params["signature"] = getBaseSrtingSignature(baseString, oAuthSecret);
    var request_url = config.REQUEST_NOTIFY_BASE + "?" + genQueryString(Object.assign(default_params, additional_params));
    console.log(request_url);
    axios.get(request_url).then(function (_ref5) {
        var status = _ref5.status,
            data = _ref5.data;

        console.log('LISTTTTTTTT', data);
    }).catch(function (error) {
        console.log(error);
    });
}

//getToken();
//console.log(process.argv)
if (process.argv.length === 4) {
    // getoauth(process.argv[2], process.argv[3]);
} else {}
    // getToken();


    // oauth_token=148962e8250837829796cd60680d077d5259fc459d165033c5574b7f8d2e9e&
    // oauth_token_secret=36b2bdb6cec882103bf4bc99e0cc43504c06db70d4d42d224332168372c17&
    // userid=15354048&deviceid=0