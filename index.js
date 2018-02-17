const crypto = require('crypto');
const CryptoJS = require("crypto-js");
const btoa = require('btoa');
const axios = require('axios');
const config = require('./config');
const queryString = require('query-string')
const uuid = require('uuid/v5');

let REQUEST_TOKEN_BASE = config.REQUEST_TOKEN_BASE;
let REQUEST_AUTHORIZATION_BASE = config.REQUEST_AUTHORIZATION_BASE;

let KEY = config.KEY;
let SECRET = config.SECRET;

function sortObject(o) {        
    var sorted = {}, key, a = [];
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
    var query_string = "";
    for ( var param in params ) {
        if ( param.indexOf("action") == -1 && param.indexOf("user_id") == -1 && param.indexOf("callbackurl") == -1 && param.indexOf("comment") == -1 && param.indexOf("appli") == -1 && param.indexOf("start") == -1 && param.indexOf("end") == -1 && param.indexOf("type") == -1 ) { 
            query_string += "oauth_" + param + "=" + params[param] + "&"; 
        } else {
            query_string += param + "=" + params[param] + "&";
        } 
    }
    return query_string.substring(0, query_string.length - 1);
}

function getDefaultParams() {
    return {
        nonce: crypto.randomBytes(16).toString('hex'),
        timestamp: Math.floor(new Date() / 1000),
        consumer_key: KEY,
        signature_method: "HMAC-SHA1",
        version: "1.0",
        callback: "",
    }
}

function getBaseString(arr) {
    const arr1 = arr.map(x => require("querystring").escape(x))
    return arr1.join('&');
}

function getBaseSrtingSignature(baseString, oAuthSecret) {
    var hmac = CryptoJS.HmacSHA1(baseString, oAuthSecret);
    var oauth_signature = encodeURIComponent(CryptoJS.HmacSHA1(baseString, oAuthSecret).toString(CryptoJS.enc.Base64));
    return oauth_signature;
}


function getAuthorizationURL(token) {
    var default_params = getDefaultParams();
    default_params["oauth_token"] = token.oauth_token
    var baseString = getBaseString(['GET', REQUEST_AUTHORIZATION_BASE, genQueryString(default_params)])
    var oAuthSecret = SECRET + "&" + token.oauth_token_secret;
    
    default_params["signature"] = getBaseSrtingSignature(baseString, oAuthSecret);

    var request_url = REQUEST_AUTHORIZATION_BASE + "?" + genQueryString(default_params);
    console.log(request_url)
    // axios.get(request_url).then(function({ status, data }){
    //     const token = queryString.parse(data)
    //     console.log(token, data)
    // }).catch(function (error) {
    //     console.log(error);
    // });
}

function getToken() {
    var default_params = getDefaultParams();
    var additional_params = {};

    // var baseString = "GET&" + require("querystring").escape(base) + "&" + require("querystring").escape(genQueryString(Object.assign(default_params, additional_params)));

    var baseString = getBaseString(["GET", REQUEST_TOKEN_BASE, genQueryString(Object.assign(default_params, additional_params))]);
    var oAuthSecret = SECRET + "&"
    
    default_params["signature"] = getBaseSrtingSignature(baseString, oAuthSecret);

    var request_url = REQUEST_TOKEN_BASE + "?" + genQueryString(default_params);

    axios.get(request_url).then(function({ status, data }){
        const token = queryString.parse(data)
        console.log(token, data)
        console.log('Fetching Auth url')
        getAuthorizationURL(token)
    }).catch(function (error) {
        console.log(error);
    });
};



getToken();