//---required modules------------------------
const Promise = require("promise");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;

//----Api exports------------------------------------------------
exports.getAllTags = getAllTags;
exports.addTag = addTag;
exports.searchTag = searchTag;


//---Api codes here----------------------------------------------
//----------------get tags---------------------------------------

function getAllTags(req, res) {
    const bearerHeader = req.headers['authorization'];
    let token = jwt.verify(bearerHeader, secretKey);
    let {limit, offset} = req.query;
  
    limit = parseInt(limit);
    offset = parseInt(offset);
  
    let response = {
      status: 0,
      data: {},
      message: ""
    };
  
    new Promise((resolve, reject) => {
      conn.query(`SELECT tagId, tag FROM tags ORDER BY tag ASC LIMIT ?,?`,[offset, limit],
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
  
  //---------add tag--------------------------------------------
  
  function addTag(req, res) {
    const bearerHeader = req.headers['authorization'];
    let token = jwt.verify(bearerHeader, secretKey);
    let { tag } = req.body;
  
    let response = {
      status: 0,
      data: {},
      message: ""
    };
  
    new Promise((resolve, reject) => {
      conn.query(`SELECT count(tagId) AS isAdded FROM tags WHERE tag = ?`,[tag],
        (err, result) => {
          if (err) reject(err);
          else {
            if (result[0].isAdded > 0) {
              res.send({
                status: 200,
                data: [],
                message: "Tag already exists.",
              });
            } else {
              conn.query(`INSERT INTO tags (tag, addedBy) VALUES (?,?)`,[tag, token.userId],
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
            }
          }
        });
    })
      .then((data) => {
        response.status = 200;
        response.data = [{"tagId": data.insertId , "tag": tag}];
        response.message = "Tag Added.";
        res.json(response);
      })
      .catch((err) => {
        console.log(err);
        response.status = 400;
        response.message = "Error";
        res.json(response);
      });
  }

  //--------search tag--------------------------------------

  function searchTag(req, res) {
    const bearerHeader = req.headers['authorization'];
    let token = jwt.verify(bearerHeader, secretKey);
    let {search} = req.query;
  
    let response = {
      status: 0,
      data: {},
      message: ""
    };
  
    new Promise((resolve, reject) => {
      conn.query(`SELECT tagId, tag FROM tags WHERE tag LIKE '%${search}%'`,
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