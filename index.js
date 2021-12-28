var express = require("express");
var app = express();
const cors = require("cors");
const dotenv = require('dotenv');
require('dotenv').config();
const routes = require('./routes')
var bodyParser = require("body-parser");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
// parse application/json
app.use(bodyParser.json());
app.use(express.static('./compressed'));
app.use(express.static('./uploads'));

const connection = require('./connection');
connection();
app.use("/api", routes);

app.get("/url", (req, res, next) => {
   res.json(["Tony", "Lisa", "Michael", "Ginger", "Food"]);
});

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

//----------------------------------------------------------------------------------------
app.listen(3000, () => {
   console.log("Server running on port 3000");
});