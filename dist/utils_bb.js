'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var crypto = require('crypto');
var request = require('request');
var config = require('./config');
var NOKIA_CALLBACK = require("querystring").escape(config.CALLBACK_BASE + "/nokia/connect/callback");
// const Util = require('./util');

var Util = function () {
	function Util() {
		_classCallCheck(this, Util);
	}

	_createClass(Util, null, [{
		key: 'sortObject',
		value: function sortObject(o) {
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
	}, {
		key: 'processKeyValue',
		value: function processKeyValue(input) {
			var key_value = [];
			for (var entry in input.split("&")) {
				key_value[input.split("&")[entry].split("=")[0]] = input.split("&")[entry].split("=")[1];
			}
			return key_value;
		}
	}, {
		key: 'validateDate',
		value: function validateDate(strDate) {
			var t = /^(?=.+([\/.-])..\1)(?=.{10}$)(?:(\d{4}).|)(\d\d).(\d\d)(?:.(\d{4})|)$/;
			strDate.replace(t, function ($, _, y, m, d, y2) {
				$ = new Date(y = y || y2, m, d);
				t = $.getFullYear() != y || $.getMonth() != m || $.getDate() != d;
			});
			return !t;
		}
	}]);

	return Util;
}();

var NokiaUtil = function () {
	function NokiaUtil() {
		_classCallCheck(this, NokiaUtil);
	}

	_createClass(NokiaUtil, null, [{
		key: 'genQueryString',
		value: function genQueryString(input_params) {
			var params = Util.sortObject(input_params);
			var query_string = "";
			for (var param in params) {
				if (param.indexOf("action") == -1 && param.indexOf("user_id") == -1 && param.indexOf("callbackurl") == -1 && param.indexOf("comment") == -1 && param.indexOf("appli") == -1 && param.indexOf("start") == -1 && param.indexOf("end") == -1 && param.indexOf("type") == -1) {
					query_string += "oauth_" + param + "=" + params[param] + "&";
				} else {
					query_string += param + "=" + params[param] + "&";
				}
			}
			return query_string.substring(0, query_string.length - 1);
		}
	}, {
		key: 'generateURL',
		value: function generateURL(base, key, secret, additional_params, callback) {
			crypto.randomBytes(16, function (err, buffer) {
				var nonce = buffer.toString('hex');
				var timestamp = Math.floor(new Date() / 1000);
				var default_params = {};
				default_params["consumer_key"] = key;
				default_params["nonce"] = nonce;
				default_params["signature_method"] = "HMAC-SHA1";
				default_params["timestamp"] = timestamp;
				default_params["version"] = "1.0";

				var base_signature_string = "GET&" + require("querystring").escape(base) + "&" + require("querystring").escape(NokiaUtil.genQueryString(Object.assign(default_params, additional_params)));
				var hash = crypto.createHmac('sha1', secret).update(base_signature_string).digest('base64');
				var oauth_signature = encodeURIComponent(hash);
				default_params["signature"] = oauth_signature;
				var request_url = base + "?" + NokiaUtil.genQueryString(default_params);
				callback(request_url);
			});
		}
	}, {
		key: 'getRequestToken',
		value: function getRequestToken(req, res, callback) {
			if (req.session.oauth_request_token == null && req.session.oauth_request_token_secret == null) {
				var request_token_params = {};
				request_token_params["callback"] = NOKIA_CALLBACK;
				NokiaUtil.generateURL(config.NOKIA_REQUEST_TOKEN_BASE, config.NOKIA_CONSUMER_KEY, config.NOKIA_SECRET + "&", request_token_params, function (request_token_url) {
					request(request_token_url, function (error, response, body) {
						req.session.oauth_request_token = Util.processKeyValue(body)["oauth_token"];
						req.session.oauth_request_token_secret = Util.processKeyValue(body)["oauth_token_secret"];
						req.session.save();
						callback(req.session.oauth_request_token, req.session.oauth_request_token_secret);
					});
				});
			} else {
				callback();
			}
		}
	}, {
		key: 'genURLFromRequestToken',
		value: function genURLFromRequestToken(req, res, base_url, callback) {
			var params = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

			NokiaUtil.getRequestToken(req, res, function () {
				params["token"] = req.session.oauth_request_token;
				NokiaUtil.generateURL(base_url, config.NOKIA_CONSUMER_KEY, config.NOKIA_SECRET + "&" + req.session.oauth_request_token_secret, params, function (url) {
					callback(url);
				});
			});
		}
	}, {
		key: 'notificationSubscribe',
		value: function notificationSubscribe(req, res, params, callback) {
			NokiaUtil.genURLFromRequestToken(req, res, config.SUBSCRIPTION_BASE, function (url) {
				console.log(url);
				request(url, function (error, response, body) {
					console.log(body);
					callback();
				});
			}, params);
		}
	}]);

	return NokiaUtil;
}();

module.exports = NokiaUtil;