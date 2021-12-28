//---required modules------------------------
const Promise = require("promise");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;
const serverKey = process.env.FCM_SERVER_KEY;
const FCM = require('fcm-node');

//----Api exports------------------------------------------------
exports.transferEventToTribeMember = transferEventToTribeMember;
exports.requestJoinTribe = requestJoinTribe;
exports.tribeRequestAction = tribeRequestAction;
exports.getAllJoinTribeRequest = getAllJoinTribeRequest;

//---Api codes here----------------------------------------------
//------------------transfer event to other tribe member--------------

function transferEventToTribeMember(req, res) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);
  let { userId, eventId } = req.body;

  let response = {
    status: 0,
    data: {},
    message: ""
  };

  new Promise((resolve, reject) => {
    conn.query(`SELECT userId FROM events WHERE eventId = ?`, [eventId],
      (err, result) => {
        if (err) reject(err);
        else {
          if (result[0].userId === token.userId) {
            conn.query(`UPDATE events SET userId = ? WHERE userId = ? AND eventId = ?`, [userId, token.userId, eventId],
              (err, result) => {
                if (err) reject(err);
                else {
                  conn.query(`SELECT userFcmToken,
                  (SELECT userName FROM users WHERE userId = ?) AS userName
                  FROM users WHERE userId = ?`, [token.userId, userId],
                    (err, fcmOfUsers) => {
                      if (err) reject(err);
                      else {
                        var fcm = new FCM(serverKey);
                        let notificationText = `Important !!. ${fcmOfUsers[0].userName} transfered all the rights of their event to you.`
                        var message = {
                          to: fcmOfUsers[0].userFcmToken,
                          priority: 'normal',

                          notification: {
                            title: 'Alive',
                            body: notificationText,
                            sound: "default",
                            badge: 1,
                          },
                          data: {
                          }
                        };
                        fcm.send(message, function (err, response) {
                          if (err) {
                            console.log(err);
                            console.log("Something has gone wrong!");
                          } else {
                            console.log("Successfully sent with response: ", response);
                          }
                        });
                        resolve(result);
                      }
                    })
                }
              });
          } else {
            res.send({
              status: 201,
              data: {},
              message: "Not your event.",
            });
          }
        }
      });
  })
    .then((data) => {
      response.status = 200;
      response.data = {};
      response.message = "Event rights transferred.";
      res.json(response);
    })
    .catch((err) => {
      console.log(err);
      response.status = 400;
      response.message = "Error";
      res.json(response);
    });
}

//------------request to join tribe---------------------------

function requestJoinTribe(req, res) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);
  let { eventId } = req.body;

  let response = {
    status: 0,
    data: {},
    message: ""
  };

  new Promise((resolve, reject) => {
    conn.query(`SELECT *, count(requestId) AS reqCount FROM tribe_requests WHERE eventId = ? AND userId = ?`,
      [eventId, token.userId],
      (err, result) => {
        if (err) reject(err);
        else {
          if (result[0].reqCount > 0 && result[0].status === "pending") {
            res.send({
              status: 200,
              data: {},
              message: "Already requested.",
            });
          } else if (result[0].reqCount > 0 && result[0].status === "approved") {
            res.send({
              status: 200,
              data: {},
              message: "Already joined.",
            });
          } else if (result[0].reqCount > 0 && result[0].status === "rejected") {
            conn.query(`UPDATE tribe_requests SET status = "pending" WHERE eventId = ? AND userId = ?`,
              [eventId, token.userId],
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
          } else {
            conn.query(`INSERT INTO tribe_requests (eventId, userId) VALUES (?,?)`,
              [eventId, token.userId],
              (err, result) => {
                if (err) reject(err);
                else {
                  conn.query(`SELECT userId FROM events WHERE eventId = ?`, [eventId],
                    (err, userIds) => {
                      if (err) reject(err);
                      else {
                        conn.query(`SELECT userFcmToken FROM users WHERE userId = ?`, [userIds[0].userId],
                          (err, fcmOfUsers) => {
                            if (err) reject(err);
                            else {
                              var fcm = new FCM(serverKey);
                              let notificationText = `You have a new tribe join request.`
                              var message = {
                                to: fcmOfUsers[0].userFcmToken,
                                priority: 'normal',

                                notification: {
                                  title: 'Alive',
                                  body: notificationText,
                                  sound: "default",
                                  badge: 1,
                                },
                                data: {
                                }
                              };

                              fcm.send(message, function (err, response) {
                                if (err) {
                                  console.log(err);
                                  console.log("Something has gone wrong!");
                                } else {
                                  console.log("Successfully sent with response: ", response);
                                }
                              });
                              conn.query(`INSERT INTO notifications (userId, notification) VALUES (?,?)`, [userIds[0].userId, notificationText],
                                (err, result) => {
                                  if (err) reject(err);
                                  else resolve(result);
                                });
                            }
                          });
                      }
                    });
                }
              });
          }
        }
      });
  })
    .then((data) => {
      response.status = 200;
      response.data = {};
      response.message = "Requested successfully.";
      res.json(response);
    })
    .catch((err) => {
      console.log(err);
      response.status = 400;
      response.message = "Error";
      res.json(response);
    });
}

//-----------tribe request action--------------------------

function tribeRequestAction(req, res) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);
  let { requestId, userId, eventId, status } = req.body;

  let response = {
    status: 0,
    data: {},
    message: ""
  };

  new Promise((resolve, reject) => {
    conn.query(`SELECT count(tribeId) FROM tribe WHERE eventId = ? AND userId = ?`, [eventId, token.userId],
      (err, checkResult) => {
        if (err) reject(err);
        else {
          if (token.userId === userId || checkResult[0].ifAdded > 0) {
            res.send({
              status: 201,
              data: {},
              message: "You are not authorized to join.",
            });
          } else {
            if (status === 'approved') {
              conn.query(`INSERT INTO tribe (eventId, userId) VALUES (?,?)`, [eventId, userId],
                (err, result) => {
                  if (err) reject(err);
                  else {
                    conn.query(`UPDATE tribe_requests SET status = "approved" WHERE requestId = ? AND userId = ? AND eventId = ?`,
                      [requestId, userId, eventId],
                      (err, result) => {
                        if (err) reject(err);
                        else {
                          conn.query(`SELECT userFcmToken,
                          (SELECT eventTitle FROM events WHERE eventId = ?) AS eventTitle
                          FROM users WHERE userId = ?`, [eventId, userId],
                            (err, fcmOfUsers) => {
                              if (err) reject(err);
                              else {
                                var fcm = new FCM(serverKey);
                                let notificationText = `Yupee! You are now a tribe member of Event: ${fcmOfUsers[0].eventTitle}.`
                                var message = {
                                  to: fcmOfUsers[0].userFcmToken,
                                  priority: 'normal',

                                  notification: {
                                    title: 'Alive',
                                    body: notificationText,
                                    sound: "default",
                                    badge: 1,
                                  },
                                  data: {
                                  }
                                };
                                fcm.send(message, function (err, response) {
                                  if (err) {
                                    console.log(err);
                                    console.log("Something has gone wrong!");
                                  } else {
                                    console.log("Successfully sent with response: ", response);
                                  }
                                });
                                conn.query(`INSERT INTO notifications (userId, notification) VALUES (?,?)`, [userId, notificationText],
                                (err, result) => {
                                  if (err) reject(err);
                                  else resolve(result);
                                });
                              }
                            })
                        }
                      });
                  }
                });
            } else if (status === 'rejected') {
              conn.query(`UPDATE tribe_requests SET status = "rejected" WHERE requestId = ? AND userId = ? AND eventId = ?`,
                [requestId, userId, eventId],
                (err, result) => {
                  if (err) reject(err);
                  else {
                    conn.query(`SELECT userFcmToken,
                    (SELECT eventTitle FROM events WHERE eventId = ?) AS eventTitle
                    FROM users WHERE userId = ?`, [eventId, userId],
                      (err, fcmOfUsers) => {
                        if (err) reject(err);
                        else {
                          var fcm = new FCM(serverKey);
                          let notificationText = `Oops!! Your request to join Event: ${fcmOfUsers[0].eventTitle} has been rejected.`
                          var message = {
                            to: fcmOfUsers[0].userFcmToken,
                            priority: 'normal',
                            notification: {
                              title: 'Alive',
                              body: notificationText,
                              sound: "default",
                              badge: 1,
                            },
                            data: {
                            }
                          };
                          fcm.send(message, function (err, response) {
                            if (err) {
                              console.log(err);
                              console.log("Something has gone wrong!");
                            } else {
                              console.log("Successfully sent with response: ", response);
                            }
                          });
                          conn.query(`INSERT INTO notifications (userId, notification) VALUES (?,?)`, [userId, notificationText],
                          (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                          });
                        }
                      })
                  }
                });
            } else {
              res.send({
                status: 200,
                data: {},
                message: "Incorrect parameters.",
              });
            }
          }
        }
      });
  })
    .then((data) => {
      response.status = 200;
      response.data = {};
      response.message = `${status} successfully.`;
      res.json(response);
    })
    .catch((err) => {
      console.log(err);
      response.status = 400;
      response.message = "Error";
      res.json(response);
    });
}

//--------------get all tribe join requests-----------------------------

function getAllJoinTribeRequest(req, res) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);
  let { eventId } = req.query;

  let response = {
    status: 0,
    data: {},
    message: ""
  };

  new Promise((resolve, reject) => {
    conn.query(`SELECT t.requestId, u.userId, u.userName, u.userImage, t.status FROM users u JOIN tribe_requests t ON
      t.userId = u.userId WHERE t.eventId = ?`, [eventId],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
  })
    .then((data) => {
      response.status = 200;
      response.data = data;
      response.message = "Requests fetched successfully.";
      res.json(response);
    })
    .catch((err) => {
      console.log(err);
      response.status = 400;
      response.message = "Error";
      res.json(response);
    });
}