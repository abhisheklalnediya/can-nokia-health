'use strict';

var _views = require('./views');

var express = require('express');
var app = express();


app.get('/', function (req, res) {
  return res.send('Hello, Nokia Microservice for Cankado Here!!');
});
app.get('/1/:canuser/', function (req, res) {
  return (0, _views.getAuthUrl)(req, res, req.params.canuser);
});
app.get('/2/:canuser/', function (req, res) {
  return (0, _views.getDataToken)(req, res, req.params.canuser);
});
app.get('/3/:canuser/', function (req, res) {
  return (0, _views.getTemperature)(req, res, req.params.canuser);
});
app.listen(3000, function () {
  return console.log('Example app listening on port 3000!');
});