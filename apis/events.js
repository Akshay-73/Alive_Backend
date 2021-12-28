//---required modules------------------------
const Promise = require("promise");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;
const serverKey = process.env.FCM_SERVER_KEY;
const async = require("async");
const FCM = require('fcm-node');

//----Api exports------------------------------------------------
exports.createEvent = createEvent;
exports.getEventById = getEventById;
exports.getEventListByStatus = getEventListByStatus;
exports.editEvent = editEvent;
exports.deleteEvent = deleteEvent;
exports.liveEvent = liveEvent;
exports.getEventCategories = getEventCategories;
exports.addExperience = addExperience;
exports.getEventImages = getEventImages;
exports.getEventByIdForWeb = getEventByIdForWeb;

//---Api codes here-----------------------------------------------
//-------------create event---------------------------------------

function createEvent(req, res) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);
  let { eventTitle, eventDescription, eventCategoryId, eventImages, eventTags, eventLocation, eventDateType,
    eventDate, selectedWeekDay, eventOthers, eventWhatsStoping } = req.body;
  let response = {
    status: 0,
    data: {},
    message: ""
  };

  let createdEventId = 0
  new Promise((resolve, reject) => {
    conn.query(`INSERT INTO events (userId, eventTitle, eventDescription, eventCategoryId, eventTags, eventImages,
        eventLocation, eventDateType, eventDate, selectedWeekDay, eventOthers, eventWhatsStoping)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [token.userId, eventTitle, eventDescription, eventCategoryId, JSON.stringify(eventTags), JSON.stringify(eventImages),
        eventLocation, eventDateType, eventDate, JSON.stringify(selectedWeekDay), eventOthers, eventWhatsStoping],
      (err, eventResult) => {
        if (err) reject(err);
        else {
          createdEventId = eventResult.insertId;
          conn.query(`INSERT INTO chat_rooms (eventId) VALUES (?)`, [eventResult.insertId],
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
        }
      });
  })
    .then((data) => {
      conn.query(`SELECT userFcmToken FROM users WHERE userId = ?`, [token.userId],
        (err, fcmOfUsers) => {
          if (err) reject(err);
          else {
            var fcm = new FCM(serverKey);
            let notificationText = `We wish you all the very best for your new Event.`
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
          }
        })
      response.status = 200;
      response.data = { eventId: createdEventId };
      response.message = "Event created successfully.";
      res.json(response);
    })
    .catch((err) => {
      console.log(err);
      response.status = 400;
      response.message = "Error";
      res.json(response);
    });
}

//------------edit event-----------------------------------------------

function editEvent(req, res, cb) {

  let { eventId, eventTitle, eventDescription, eventCategoryId, eventLocation, eventDateType, eventDate,
    eventOthers, eventWhatsStoping } = req.body;

  let eTags = req.body.eventTags;
  let eImages = req.body.eventImages;
  let sdWeekDay = req.body.selectedWeekDay;
  let eventTags = JSON.stringify(eTags);
  let eventImages = JSON.stringify(eImages);
  let selectedWeekDay = JSON.stringify(sdWeekDay);

  let response = {
    status: 0,
    data: {},
    message: ""
  }

  new Promise((resolve, reject) => {
    async.waterfall([
      check,
      edit
    ], (error, result) => {
      if (error) reject(error)
      else resolve(result)
    })
  })
    .then((resp) => {
      res.json(resp)
    })
    .catch((error) => {
      console.log("====>", error)
      response.message = "Error fetching profile";
      res.json(response)
    })

  function check(cb) {
    conn.query(` SELECT * FROM events WHERE eventId = ? `, [eventId], (error, result) => {
      if (error) {
        cb(error)
      } else {
        cb(null, result)
      }
    })
  }

  function edit(result, cb) {
    if (!!eventTitle) {
      eventTitle = eventTitle;
    }
    else {
      eventTitle = result[0].eventTitle;
    }
    if (!!eventDescription) {
      eventDescription = eventDescription;
    }
    else {
      eventDescription = result[0].eventDescription;
    }

    if (!!eventCategoryId) {
      eventCategoryId = eventCategoryId;
    }
    else {
      eventCategoryId = result[0].eventCategoryId
    }
    if (!!eventTags) {
      eventTags = eventTags;
    }
    else {
      eventTags = result[0].eventTags;
    }
    if (!!eventImages) {
      eventImages = eventImages;
    }
    else {
      eventImages = result[0].eventImages;
    }
    if (!!eventLocation) {
      eventLocation = eventLocation;
    }
    else {
      eventLocation = result[0].eventLocation;
    }
    if (!!eventDateType) {
      eventDateType = eventDateType;
    }
    else {
      eventDateType = result[0].eventDateType;
    }
    if (!!eventDate) {
      eventDate = eventDate;
    }
    else {
      eventDate = result[0].eventDate;
    }
    if (!!selectedWeekDay) {
      selectedWeekDay = selectedWeekDay;
    }
    else {
      selectedWeekDay = result[0].selectedWeekDay;
    }
    if (!!eventOthers) {
      eventOthers = eventOthers;
    }
    else {
      eventOthers = result[0].eventOthers;
    }
    if (!!eventWhatsStoping) {
      eventWhatsStoping = eventWhatsStoping;
    }
    else {
      eventWhatsStoping = result[0].eventWhatsStoping;
    }

    conn.query(`UPDATE events SET eventTitle = ?, eventDescription = ?, eventCategoryId = ?, eventTags = ?,
      eventImages = ?, eventLocation = ?, eventDateType = ?, eventDate = ?, selectedWeekDay = ?, eventOthers = ?,
      eventWhatsStoping = ?, WHERE eventId = ?`,
      [eventTitle, eventDescription, eventCategoryId, eventTags, eventImages, eventLocation, eventDateType,
        eventDate, selectedWeekDay, eventOthers, eventWhatsStoping, eventId], (error, result) => {
          if (error) reject(error)
          else {
            response.status = 200;
            response.data = {}
            response.message = "Event updated successfully.";
            cb(null, response)
          }
        })
  }
}

//------------------delete event---------------------------------------
function deleteEvent(req, res) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);
  let { eventId } = req.body;

  let response = {
    status: 0,
    data: {},
    message: ""
  };
  let arrayOfUserId = [token.userId];

  new Promise((resolve, reject) => {
    conn.query(`SELECT * FROM events WHERE eventId = ?`, [eventId],
      (err, result) => {
        if (err) reject(err);
        else {
          if (result.length === 0) {
            res.send({
              status: 200,
              data: {},
              message: "No events found."
            });
          }
          else if (result[0].userId === token.userId) {
            conn.query(`DELETE FROM events WHERE eventId = ?`, [eventId],
              (err, result) => {
                if (err) reject(err);
                else {
                  conn.query(`DELETE FROM tribe WHERE eventId = ?`, [eventId],
                    (err, result) => {
                      if (err) reject(err);
                      else {
                        conn.query(`DELETE FROM tribe_requests WHERE eventId = ?`, [eventId],
                          (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                          });
                      }
                    });
                }
              });
          } else {
            conn.query(`DELETE FROM tribe WHERE eventId = ? AND userId = ?`, [eventId, token.userId],
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
          }
        }
      });
  })
    .then((data) => {
      conn.query(`SELECT userId FROM tribe WHERE eventId = ?`, [eventId],
        (err, result) => {
          if (err) reject(err);
          else {
            _.forEach(result, (value, key) => {
              arrayOfUserId.push(value.userId);
            });
            conn.query(`SELECT userFcmToken, userId FROM users WHERE userId IN (?)`, [arrayOfUserId],
              (err, fcmOfUsers) => {
                if (err) reject(err);
                else {
                  _.forEach(fcmOfUsers, (value, key) => {
                    var fcm = new FCM(serverKey);
                    let notificationText = `Important!! One of an event you were a part of has been deleted.`
                    var message = {
                      to: value.userFcmToken,
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
                  });
                }
              });
          }
        });
      response.status = 200;
      response.data = {};
      response.message = "Event deleted successfully.";
      res.json(response);
    })
    .catch((err) => {
      console.log(err);
      response.status = 400;
      response.message = "Error";
      res.json(response);
    });
}

//------------------live an event-------------------------------------

function liveEvent(req, res) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);
  let { eventId } = req.body;

  let response = {
    status: 0,
    data: {},
    message: ""
  };
  let arrayOfUserId = [token.userId];
  new Promise((resolve, reject) => {
    conn.query(`UPDATE events SET eventStatus = "lived", eventLivedOn = ${Date.now()} WHERE userId = ? AND eventId = ?`, [token.userId, eventId],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    conn.query(`SELECT userId FROM tribe WHERE eventId = ?`, [eventId],
      (err, result) => {
        if (err) reject(err);
        else {
          _.forEach(result, (value, key) => {
            arrayOfUserId.push(value.userId);
          });
          conn.query(`SELECT userFcmToken, userId,
          (SELECT eventTitle FROM events WHERE eventId = ?) AS eventTitle
          FROM users WHERE userId IN (?)`, [eventId, arrayOfUserId],
            (err, fcmOfUsers) => {
              if (err) reject(err);
              else {
                _.forEach(fcmOfUsers, (value, key) => {
                  var fcm = new FCM(serverKey);
                  let notificationText = `Congratulations. Event: ${value.eventTitle} has been lived. Please add your experience.`
                  var message = {
                    to: value.userFcmToken,
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
                  conn.query(`INSERT INTO notifications (userId, notification) VALUES (?,?)`, [value.userId, notificationText],
                    (err, result) => {
                      if (err) reject(err);
                      else resolve(result);
                    });
                });
              }
            });
        }
      });
  })
    .then((data) => {
      response.status = 200;
      response.data = {};
      response.message = "Event lived.";
      res.json(response);
    })
    .catch((err) => {
      console.log(err);
      response.status = 400;
      response.message = "Error";
      res.json(response);
    });
}

//----------------get all event categories-------------------------------

function getEventCategories(req, res) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);

  let response = {
    status: 0,
    data: {},
    message: ""
  };

  new Promise((resolve, reject) => {
    conn.query(`SELECT categoryId, categoryName, categoryImage, categoryColor FROM categories`,
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

//----------get event list by status--------------------------------------

function getEventListByStatus(req, res, cb) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);
  let { status, limit, offset } = req.query;

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
      getEvents,
      getTribes,
      manageData
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
  let theEventData = [];
  let allEventIds = [];
  function getEvents(result, cb) {
    if (result.eventIds.length === 0) {
      res.send({
        status: 200,
        data: [],
        message: "No events found."
      });
    }
    conn.query(`SELECT e.*, c.*,
      (SELECT count(experienceId) FROM experience WHERE eventId = e.eventId) AS ifExperienceExists
      FROM events e JOIN categories c ON e.eventCategoryId = c.categoryId
      WHERE e.eventStatus = ? AND e.eventId IN (?) ORDER BY e.eventId DESC LIMIT ?,?`,
      [status, result.eventIds, offset, limit], (err, result) => {
        if (err) cb(err);
        else {
          if (_.isEmpty(result) == false) {
            _.forEach(result, function (value, key) {
              let eventData = {
                "eventId": value.eventId,
                "eventTitle": value.eventTitle,
                "categoryName": value.categoryName,
                "categoryColor": value.categoryColor,
                "categoryNameColor": value.categoryNameColor,
                "eventImages": JSON.parse(value.eventImages)[0] || value.categoryImage,
                "eventDateType": value.eventDateType,
                "eventDate": value.eventDate,
                "eventOthers": value.eventOthers,
                "eventStatus": value.eventStatus,
                "ifExperienceExists": value.ifExperienceExists
              };
              theEventData.push(eventData);
              allEventIds.push(value.eventId);
            });

            let getEventsResult = { theEventData, allEventIds };
            cb(null, getEventsResult);
          }
          else {
            response.status = 200;
            response.data = [];
            response.message = "No events found.";
            res.json(response)
          }
        }
      })
  }
  function getTribes(result, cb) {
    if (result) {
      conn.query(`SELECT t.eventId, u.userId, u.userImage FROM users u JOIN tribe t ON u.userId = t.userId WHERE
          t.eventId IN (?)`, [result.allEventIds],
        (err, postResult) => {
          if (err) cb(err);
          else {
            if (postResult.length > 0) {
              let postObject2 = [];
              _.forEach(postResult, (value, key) => {
                postDataObject2 = {
                  "eventId": value.eventId,
                  "userId": value.userId,
                  "userImage": value.userImage
                };
                postObject2.push(postDataObject2);
              });
              result.tribe = postObject2;

              cb(null, result, postObject2);
            }
            else {
              result.postData = [];
              cb(null, result, [], [])
            }
          }
        });
    }
    else {
      cb(null, "Not Found")
    }
  }

  function manageData(result, cb) {
    const event = result.theEventData;
    const tribe = result.tribe;
    let finalResult = [];
    _.forEach(event, (event, index) => {
      const Object = {
        "eventId": event.eventId,
        "eventTitle": event.eventTitle,
        "categoryName": event.categoryName,
        "categoryColor": event.categoryColor,
        "categoryNameColor": event.categoryNameColor,
        "eventImages": event.eventImages,
        "eventDateType": event.eventDateType,
        "eventDate": event.eventDate,
        "eventOthers": event.eventOthers,
        "eventStatus": event.eventStatus,
        "ifExperienceExists": event.ifExperienceExists,
        "tribe": _.filter(tribe, { 'eventId': event.eventId })
      }
      finalResult.push(Object)
    });
    res.send({
      status: 200,
      data: finalResult,
      message: "Fetched successfully."
    });
  };
}


//----------get events by status------------------------------------------

function getEventById(req, res, cb) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);
  let { eventId } = req.query;

  let response = {
    status: 0,
    data: [],
    message: "Data feteched successfully."
  }

  new Promise((resolve, reject) => {
    async.waterfall([
      geteventChecks,
      getevent,
      gettribe,
      manageData
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
      response.message = "Error To Get order . " + error;
      response.error = error;
      res.json(response)
    });

  let userName = "";
  let isMeCreator;
  let ifExperience;
  let experienceImages;
  let finalImages;
  function geteventChecks(cb) {
    conn.query(`SELECT * FROM experience WHERE eventId = ?`, [eventId],
      (err, result) => {
        if (err) cb(err)
        else {
          if (result.length > 0 && JSON.parse(result[0].experienceImages).length > 0) {
            ifExperience = true;
            experienceImages = JSON.parse(result[0].experienceImages);
          } else {
            ifExperience = false;
          }
        }
        cb(null, result);
      })
  }

  function getevent(result, cb) {

    conn.query(`SELECT e.*, c.*,
      (SELECT userName FROM users WHERE userId = e.userId) userName,
      (SELECT count(experienceId) FROM experience WHERE eventId = ?) AS ifExperienceExists
      FROM events e JOIN categories c ON e.eventCategoryId = c.categoryId WHERE e.eventId = ?`,
      [eventId, eventId], (err, result) => {
        if (err) cb(err)
        else {
          if (result.length > 0) {
            if (ifExperience === true) {
              finalImages = experienceImages;
            } else if (ifExperience === false && JSON.parse(result[0].eventImages).length > 0) {
              finalImages = JSON.parse(result[0].eventImages) || result[0].categoryImage;
            } else {
              finalImages = [result[0].categoryImage];
            }
            if (result[0].userId === token.userId) {
              userName = "You"
              isMeCreator = true;
            } else {
              userName = result[0].userName;
              isMeCreator = false;
            }
            let eventData = {
              "eventId": result[0].eventId,
              "isMeCreator": isMeCreator,
              "CreatedBy": userName,
              "eventTitle": result[0].eventTitle,
              "eventDescription": result[0].eventDescription,
              "eventCategoryId": result[0].eventCategoryId,
              "categoryName": result[0].categoryName,
              "categoryImage": result[0].categoryImage,
              "categoryColor": result[0].categoryColor,
              "eventTags": JSON.parse(result[0].eventTags),
              "eventImages": finalImages,
              "eventLocation": result[0].eventLocation,
              "eventDateType": result[0].eventDateType,
              "eventDate": result[0].eventDate,
              "selectedWeekDay": JSON.parse(result[0].selectedWeekDay),
              "eventOthers": result[0].eventOthers,
              "eventWhatsStoping": result[0].eventWhatsStoping,
              "eventStatus": result[0].eventStatus,
              "eventLivedOn": result[0].eventLivedOn,
              "ifExperienceExists": result[0].ifExperienceExists
            };
            cb(null, eventData);
          }
          else {
            response.status = 200;
            response.data = {}
            response.message = "Event not found.";
            res.json(response)
          }
        }
      })
  }
  function gettribe(result, cb) {
    if (result) {
      conn.query(`SELECT u.userId, u.userName, u.userImage FROM users u JOIN tribe t ON t.userId = u.userId WHERE t.eventId = ?`,
        [eventId],
        (err, tribeResult) => {
          if (err) cb(err);
          else {
            if (tribeResult.length > 0) {
              let postObject2 = [];
              _.forEach(tribeResult, (value, key) => {
                tribeData = {
                  "userId": value.userId,
                  "userName": value.userName,
                  "userImage": value.userImage
                };
                postObject2.push(tribeData);
              });
              result.tribe = postObject2;
              cb(null, result, postObject2);
            }
            else {
              result.tribe = [];
              cb(null, result, {}, []);
            }
          }
        });
    }
    else {
      cb(null, "Not Found")
    }
  }

  function manageData(result, cb) {
    response.status = 200;
    response.data = result;
    response.message = "Success.";
    res.json(response);
  };
}

//----add experience---------------------------------

function addExperience(req, res) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);
  let { eventId, experience, experienceImages } = req.body;

  let response = {
    status: 0,
    data: {},
    message: ""
  };

  new Promise((resolve, reject) => {
    conn.query(`SELECT eventStatus, count(eventId) AS ifEventExists,
                  (SELECT count(experienceId) FROM experience WHERE eventId = ? AND userId = ?) AS ifExperienceExists
                  FROM events WHERE eventId = ? AND userId = ?`, [eventId, token.userId, eventId, token.userId],
      (err, result) => {
        if (err) reject(err);
        else {
          if (result[0].ifEventExists === 0) {
            res.send({
              status: 201,
              data: {},
              message: "Event doesn't exists.",
            });
          } else if (result[0].eventStatus != "lived") {
            res.send({
              status: 201,
              data: {},
              message: "Event is not lived yet.",
            });
          }
          else if (result[0].ifExperienceExists > 0) {
            res.send({
              status: 201,
              data: {},
              message: "Experience already added.",
            });
          }
          else if (result[0].ifEventExists > 0 && result[0].ifExperienceExists === 0) {
            conn.query(`INSERT INTO experience (eventId, userId, experience, experienceImages) VALUES (?,?,?,?)`,
              [eventId, token.userId, experience, JSON.stringify(experienceImages)],
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
          } else {
            res.send({
              status: 400,
              data: {},
              message: "Error",
            });
          }
        }
      });
  })
    .then((data) => {
      response.status = 200;
      response.data = {};
      response.message = "Experience added.";
      res.json(response);
    })
    .catch((err) => {
      console.log(err);
      response.status = 400;
      response.message = "Error";
      res.json(response);
    });
}

//-------get event images-------------------------------

function getEventImages(req, res) {
  const bearerHeader = req.headers['authorization'];
  let token = jwt.verify(bearerHeader, secretKey);
  let { eventId } = req.query;
  const empty = [];

  let response = {
    status: 0,
    data: {},
    message: ""
  };

  new Promise((resolve, reject) => {
    conn.query(`SELECT eventImages FROM events WHERE userId = ? AND eventId = ?`, [token.userId, eventId],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
  })
    .then((data) => {
      if (data.length === 0) {
        res.send({
          status: 200,
          data: { eventImages: [] },
          message: "Success.",
        });
      } else
        response.status = 200;
      response.data.eventImages = JSON.parse(data[0].eventImages) || empty;
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

//----get event for wordpress website----------------------------

function getEventByIdForWeb(req, res, cb) {
  let { eventId } = req.query;

  let response = {
    status: 0,
    data: [],
    message: "Data feteched successfully."
  }

  new Promise((resolve, reject) => {
    async.waterfall([
      getevent,
      gettribe,
      manageData
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
      response.message = "Error To Get order . " + error;
      response.error = error;
      res.json(response)
    });

  function getevent(cb) {
    conn.query(`SELECT e.*, c.*,
      (SELECT userName FROM users WHERE userId = e.userId) userName
      FROM events e JOIN categories c ON e.eventCategoryId = c.categoryId WHERE e.eventId = ?`,
      [eventId, eventId], (err, result) => {
        if (err) cb(err)
        else {
          if (result.length > 0) {
            let eventData = {
              "eventId": result[0].eventId,
              "CreatedBy": result[0].userName,
              "eventTitle": result[0].eventTitle,
              "eventDescription": result[0].eventDescription,
              "categoryName": result[0].categoryName,
              "categoryColor": result[0].categoryColor,
              "categoryNameColor": result[0].categoryNameColor,
              "eventTags": JSON.parse(result[0].eventTags),
              "eventImages": JSON.parse(result[0].eventImages),
              "eventLocation": result[0].eventLocation,
              "eventDate": result[0].eventDate,
              "eventWhatsStoping": result[0].eventWhatsStoping
            };
            cb(null, eventData);
          }
          else {
            response.status = 200;
            response.data = {}
            response.message = "Event not found.";
            res.json(response)
          }
        }
      })
  }
  function gettribe(result, cb) {
    if (result) {
      conn.query(`SELECT u.userId, u.userName, u.userImage FROM users u JOIN tribe t ON t.userId = u.userId WHERE t.eventId = ?`,
        [eventId],
        (err, tribeResult) => {
          if (err) cb(err);
          else {
            if (tribeResult.length > 0) {
              let postObject2 = [];
              _.forEach(tribeResult, (value, key) => {
                tribeData = {
                  "userImage": value.userImage
                };
                postObject2.push(tribeData);
              });
              result.tribe = postObject2;
              cb(null, result, postObject2);
            }
            else {
              result.tribe = [];
              cb(null, result, {}, []);
            }
          }
        });
    }
    else {
      cb(null, "Not Found")
    }
  }

  function manageData(result, cb) {
    conn.query(`SELECT userId FROM events WHERE eventId = ?`, [eventId],
      (err, userIds) => {
        if (err) reject(err);
        else {
          conn.query(`SELECT userFcmToken,
           (SELECT eventTitle FROM events WHERE eventId = ?) AS eventTitle
           FROM users WHERE userId = ?`, [eventId, userIds[0].userId],
            (err, fcmOfUsers) => {
              if (err) reject(err);
              else {
                var fcm = new FCM(serverKey);
                let notificationText = `Someone viewed the invitation you sent to join your Event: ${fcmOfUsers[0].eventTitle}.`
                var message = {
                  to: fcmOfUsers[0].userFcmToken,
                  priority: 'normal',

                  notification: {
                    title: 'Alive',
                    body: notificationText,
                    sound: "default",
                    badge: 1,
                  },
                };
                fcm.send(message, function (err, response) {
                  if (err) {
                    console.log(err);
                    console.log("Something has gone wrong!");
                  } else {
                    console.log("Successfully sent with response: ", response);
                  }
                });
              }
            });
        }
      });
    response.status = 200;
    response.data = result;
    response.message = "Success.";
    res.json(response);
  };
}