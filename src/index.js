const express = require('express')
const app = express()
import { getAuthUrl, getDataToken, getTemperature } from './views';

app.get('/', (req, res) => res.send('Hello, Nokia Microservice for Cankado Here!!'))
app.get('/1/:canuser/', (req, res) => getAuthUrl(req, res, req.params.canuser))
app.get('/2/:canuser/', (req, res) => getDataToken(req, res, req.params.canuser));
app.get('/3/:canuser/', (req, res) => getTemperature(req, res, req.params.canuser));
app.listen(3000, () => console.log('Example app listening on port 3000!'))
