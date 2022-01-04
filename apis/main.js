//---required modules------------------------
const Promise = require("promise");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;
const async = require("async");
const fs = require('fs')
const AWS = require('aws-sdk');
const path = require('path');

//----Api exports------------------------------------------------
exports.upload = upload;
exports.getAllNotifications = getAllNotifications;
exports.getRandomQuotes = getRandomQuotes;

//---Api codes here----------------------------------------------
//--upload-------------------------------------------------------
AWS.config.update({
  accessKeyId: process.env.AKI,
  secretAccessKey: process.env.SAK
});

var s3 = new AWS.S3();
function upload(req, res, cb) {
  let response = {
    status: 0,
    data: {},
    message: ""
  }
  if (!req.files) {
    response.status = 400;
    response.message = "No file received";
    return res.json(response);
  } else {
    const filePath = './uploads/'+ req.files[0].filename;
      var params = {
        Bucket: 'alive-bucket',
        Body : fs.createReadStream(filePath),
        Key : path.basename(filePath)
        };
        s3.upload(params, function (err, data) {
        if (err) {
          console.log("Error", err);
        }
        if (data) {
          fs.unlink(filePath, (err) => err && console.log(err));
          response.status = 200;
          response.data.image = data.Location;
          response.message = "file received successfully";
          return res.json(response);
        } else {
          res.send({
            status: 400,
            data: {},
            message: "Error.",
          });
        }
        });
  }
}

//---get all notifications---------------------------------------

function getAllNotifications(req, res) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);

  let response = {
    status: 0,
    data: {},
    message: ""
  };

  new Promise((resolve, reject) => {
    conn.query(`SELECT * FROM notifications ORDER BY notificationId DESC`,
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
  })
    .then((data) => {
      response.status = 200;
      response.data = data;
      response.message = "Success.";
      res.json(response);
    })
    .catch((err) => {
      console.log(err);
      response.status = 400;
      response.message = "Error";
      res.json(response);
    });
}

//-------get random quotes-------------------------------

function getRandomQuotes(req, res) {
  let response = {
    status: 0,
    data: {},
    message: ""
  };

  new Promise((resolve, reject) => {
    conn.query(`SELECT * FROM quotes ORDER BY RAND() LIMIT 1`,
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
  })
    .then((data) => {
      response.status = 200;
      response.data = data[0];
      response.message = "Success.";
      res.json(response);
    })
    .catch((err) => {
      console.log(err);
      response.status = 400;
      response.message = "Error";
      res.json(response);
    });
}