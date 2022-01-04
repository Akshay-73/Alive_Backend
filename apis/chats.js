//---required modules------------------------
const Promise = require("promise");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
const async = require("async");
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;
const moment = require('moment');

//----Api exports------------------------------------------------
exports.getChatRooms = getChatRooms;
exports.getAllChats = getAllChats;
exports.deleteMyMessage = deleteMyMessage;

function getChatRooms(req, res, cb) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);
  let { limit, offset, search } = req.query;

  let response = {
    status: 0,
    data: [],
    message: "Success."
  }

  limit = parseInt(limit)
  offset = parseInt(offset)

  new Promise((resolve, reject) => {
    async.waterfall([
      collectEventIds,
      collectTribeAddedEventIds,
      getRooms
    ], (error, result) => {
      console.log(`here is the error  ${error}`);
      if (error) reject(error)
      else resolve(result)
    })
  })
    .then((data) => {

      response.status = typeof data == 'object' ? 200 : 400;
      if (typeof data == 'object') {
        response.body = data
      }
      if (typeof data == 'string') {
        response.status = 200
        response.message = data;
      }
      res.json(response)
    })
    .catch((error) => {
      console.log(`here is the error ${error}`);
      response.message = "Error To Get order." + error;
      response.error = error;
      res.json(response)
    })
  let EventIds1 = [];
  function collectEventIds(cb) {
    conn.query(`SELECT eventId FROM events WHERE userId = ?`, [token.userId],
      (err, result1) => {
        if (err) cb(err);
        else {
          _.forEach(result1, function (value, key) {
            EventIds1.push(value.eventId);
          });
          let getEventsResult = { EventIds1 };
          cb(null, getEventsResult);
        }
      })
  }
  let EventIds2 = [];
  function collectTribeAddedEventIds(result, cb) {
    conn.query(`SELECT eventId FROM tribe WHERE userId = ?`, [token.userId],
      (err, result1) => {
        if (err) cb(err);
        else {
          _.forEach(result1, function (value, key) {
            EventIds1.push(value.eventId);
          });
          const eventIds = EventIds1.concat(EventIds2);
          let resultArray = { eventIds };
          cb(null, resultArray);
        }
      })
  }
  let final = [];
  function getRooms(result, cb) {
    if (result.eventIds.length === 0) {
      res.send({
        status: 200,
        data: [],
        message: "No events found."
      });
    }
    if (search?.length == 0 || search == "" || !search){
      conn.query(`SELECT e.eventTitle, e.eventImages, e.eventId, r.roomId, r.createdAt,
      (SELECT messageTime FROM messages WHERE messageId = (SELECT MAX(messageId) FROM messages WHERE roomId = r.roomId)) AS lastMessageSentAt,
      (SELECT MAX(messageId) FROM messages WHERE roomId = r.roomId) AS messageId
      FROM events e JOIN chat_rooms r ON
      e.eventId = r.eventId WHERE r.eventId IN(?) ORDER BY messageId DESC LIMIT ?,?`,
        [result.eventIds, offset, limit], (err, result) => {
          if (err) cb(err);
          else {
            _.forEach(result, (value, key) => {
              let image = value.eventImages;
              let oneImage = JSON.parse(image);
              let array = [];
              array = {
                "eventTitle": value.eventTitle,
                "eventImages": oneImage[0] || "https://alive-bucket.s3.amazonaws.com/file-8195232787820955.png",
                "eventId": value.eventId,
                "roomId": value.roomId,
                "lastMessageSentAt": value.lastMessageSentAt
              },
                final.push(array);
            });
            res.send({
              status: 200,
              data: final,
              message: "Success"
            });
          }
        })
    } else {
      conn.query(`SELECT e.eventTitle, e.eventImages, e.eventId, r.roomId, r.createdAt,
      (SELECT messageTime FROM messages WHERE messageId = (SELECT MAX(messageId) FROM messages WHERE roomId = r.roomId)) AS lastMessageSentAt,
      (SELECT MAX(messageId) FROM messages WHERE roomId = r.roomId) AS messageId
      FROM events e JOIN chat_rooms r ON
      e.eventId = r.eventId WHERE r.eventId IN(?) AND e.eventTitle LIKE "%${search}%"`,
        [result.eventIds], (err, result) => {
          if (err) cb(err);
          else {
            _.forEach(result, (value, key) => {
              let image = value.eventImages;
              let oneImage = JSON.parse(image);
              let array = [];
              array = {
                "eventTitle": value.eventTitle,
                "eventImages": oneImage[0] || "https://alive-bucket.s3.amazonaws.com/file-8195232787820955.png",
                "eventId": value.eventId,
                "roomId": value.roomId,
                "lastMessageSentAt": value.lastMessageSentAt
              },
                final.push(array);
            });
            res.send({
              status: 200,
              data: final,
              message: "Success"
            });
          }
        })
    }
  }
}

//-----get all chats in room-----------------------------

function getAllChats(req, res) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);
  let { roomId, limit, offset } = req.query;

  limit = parseInt(limit);
  offset = parseInt(offset);

  let response = {
    status: 0,
    data: [],
    message: ""
  };
  new Promise((resolve, reject) => {
    conn.query(`SELECT * FROM messages WHERE roomId = ? ORDER BY messageId DESC LIMIT ?,?`, [roomId, offset, limit],
      (err, result) => {
        if (err) reject(err);
        else resolve(result); 
      });
  })
    .then((data) => {
      response.status = 200;
      response.data = data;
      response.message = "Chats fetched successfully.";
      res.json(response);
    })
    .catch((err) => {
      console.log(err);
      response.status = 400;
      response.message = "Error";
      res.json(response);
    });
}

//---delete chat message--------------------------------------

function deleteMyMessage(req, res) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);
  let { messageId } = req.body;

  let response = {
    status: 0,
    data: [],
    message: ""
  };
  new Promise((resolve, reject) => {
    conn.query(`UPDATE messages SET message = "This message has been deleted.", type = "deleted" WHERE messageId IN (?)`, [messageId],
      (err, result) => {
        if (err) reject(err);
        else resolve(result); 
      });
  })
    .then((data) => {
      response.status = 200;
      response.data = {};
      response.message = "Deleted.";
      res.json(response);
    })
    .catch((err) => {
      console.log(err);
      response.status = 400;
      response.message = "Error";
      res.json(response);
    });
}