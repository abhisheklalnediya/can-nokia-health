const crypto = require('crypto');
const CryptoJS = require("crypto-js");
const btoa = require('btoa');
const axios = require('axios');
const config = require('./config');
const queryString = require('query-string')

let base = config.REQUEST_TOKEN_BASE;

let key = config.KEY;
let secret = config.SECRET;

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

crypto.randomBytes(16, function(err, buffer) {      
    const nonce = buffer.toString('hex');
    const timestamp = (Math.floor(new Date() / 1000));
    
    var default_params = {};
    default_params["consumer_key"] = key;
    default_params["nonce"] = nonce;
    default_params["signature_method"] = "HMAC-SHA1";
    default_params["timestamp"] = timestamp;
    default_params["version"] = "1.0";
    default_params["callback"] = "";

    var additional_params = {};
    var baseString = "GET&" + require("querystring").escape(base) + "&" + require("querystring").escape(genQueryString(Object.assign(default_params, additional_params)));
    var oAuthSecret = secret + "&"
    var hmac = CryptoJS.HmacSHA1(baseString, oAuthSecret);
    oauth_signature = encodeURIComponent(CryptoJS.HmacSHA1(baseString, oAuthSecret).toString(CryptoJS.enc.Base64));
    default_params["signature"] = oauth_signature;
    var request_url = base + "?" + genQueryString(default_params);

    axios.get(request_url).then(function({ status, data }){
        const token = queryString.parse(data)
        console.log(token, data)
    })
    .catch(function (error) {
        console.log(error);
    });
});