const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const routes = require('./routes/routes');
const cookieParser=require('cookie-parser')
var cors = require('cors');
const app = express();
const corsOptions = {
  origin: "*",
  credentials: true,  // Allow credentials (cookies)
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions))
app.use(bodyParser.json());
app.use(cookieParser());
// Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome API master v1' });
});
app.use('/api', routes);
const PORT = process.env.PORT;
var server = app.listen(PORT, function () {
  //var host = "10.144.250.10"
  var host = process.env.HOST
  var port = server.address().port
  console.log("app listening at http://%s:%s", host, port)
})