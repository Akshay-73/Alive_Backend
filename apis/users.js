//---required modules------------------------
const Promise = require("promise");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;
const async = require("async");

//----Api exports------------------------------------------------
exports.getUserProfileById = getUserProfileById;
exports.getUserProfileByToken = getUserProfileByToken;
exports.updateUserProfile = updateUserProfile;
exports.updateFCM = updateFCM;
exports.deleteAccount = deleteAccount;

//---Api codes here----------------------------------------------
//------------------get user profile by id-----------------------------

function getUserProfileById(req, res) {
    let {userId} = req.query;
  
    let response = {
      status: 0,
      data: {},
      message: ""
    };
  
    new Promise((resolve, reject) => {
      conn.query(`SELECT userId, userPhone, userName, userEmail, userCity, userAge, userImage FROM users WHERE userId = ?`,
        [userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
    })
      .then((data) => {
        response.status = 200;
        response.data = data[0];
        response.message = "Success";
        res.json(response);
      })
      .catch((err) => {
        console.log(err);
        response.status = 400;
        response.message = "Error";
        res.json(response);
      });
  }
  
  //-------get user profile--------------------------------------------
  
  function getUserProfileByToken(req, res) {
    const bearerHeader = req.headers['authorization'];
    let token = jwt.verify(bearerHeader, secretKey);
  
    let response = {
      status: 0,
      data: {},
      message: ""
    };
  
    new Promise((resolve, reject) => {
      conn.query(`SELECT userId, userPhone, userName, userEmail, userCity, userAge, userImage FROM users WHERE userId = ?`,
        [token.userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
    })
      .then((data) => {
        response.status = 200;
        response.data = data[0];
        response.message = "Success";
        res.json(response);
      })
      .catch((err) => {
        console.log(err);
        response.status = 400;
        response.message = "Error";
        res.json(response);
      });
  }
  

  //------------update user profile------------------------------------

  function updateUserProfile(req, res, cb) {
    const bearerHeader = req.headers['authorization'];
    let token = jwt.verify(bearerHeader, secretKey);
  
    let { userName, userCity, userImage, userAge } = req.body;
  
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
      conn.query(` SELECT * FROM users WHERE userId = ? `, [token.userId], (error, result) => {
        if (error) {
          cb(error)
        } else {
          cb(null, result)
        }
      })
    }
  
    function edit(result, cb) {
      if (!!userName) {
        userName = userName;
      }
      else {
        userName = result[0].userName;
      }
  
      if (!!userCity) {
        userCity = userCity;
      }
      else {
        userCity = result[0].userCity;
      }
  
      if (!!userImage) {
        userImage = userImage;
      }
      else {
        userImage = result[0].userImage
      }
      if (!!userAge) {
        userAge = userAge;
      }
      else {
        userAge = result[0].userAge;
      }
      conn.query(`UPDATE users SET userName = ?, userCity = ?, userImage = ?, userAge = ? WHERE userId = ?`,
      [userName, userCity, userImage, userAge, token.userId], (error, result) => {
        if (error) reject(error)
          else {
            conn.query(`SELECT userId, userPhone, userName, userEmail, userCity, userAge, userImage FROM users WHERE userId = ?`,
            [token.userId],
            (err, resultOfUser) => {
              if (err) reject(err);
              else {
                response.status = 200;
                response.data = resultOfUser[0];
                response.message = "Profile updated successfully.";
                cb(null, response)
              }
            });

          }
        })
    }
  }

  //-----update fcm token---------------------------------------

  function updateFCM(req, res) {
    const bearerHeader = req.headers['authorization'];
    let token = jwt.verify(bearerHeader, secretKey);
    let {userFcmToken} = req.body;
  
    let response = {
      status: 0,
      data: {},
      message: ""
    };
  
    new Promise((resolve, reject) => {
      conn.query(`UPDATE users SET userFcmToken = ? WHERE userId = ?`,[userFcmToken, token.userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
    })
      .then((data) => {
        response.status = 200;
        response.data = {};
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

  //------delete account-----------------------------------------------

  function deleteAccount(req, res) {
    const bearerHeader = req.headers['authorization'];
    let token = jwt.verify(bearerHeader, secretKey);
  
    let response = {
      status: 0,
      data: {},
      message: ""
    };
  
    new Promise((resolve, reject) => {
      conn.query(`DELETE FROM experience WHERE userId = ?`,[token.userId],
        (err, result) => {
          if (err) reject(err);
          else {
            conn.query(`DELETE FROM events WHERE userId = ?`,[token.userId],
            (err, result) => {
              if (err) reject(err);
              else {
                conn.query(`DELETE FROM tribe WHERE userId = ?`,[token.userId],
                (err, result) => {
                  if (err) reject(err);
                  else {
                    conn.query(`DELETE FROM tribe_requests WHERE userId = ?`,[token.userId],
                    (err, result) => {
                      if (err) reject(err);
                      else {
                        conn.query(`DELETE FROM notifications WHERE userId = ?`,[token.userId],
                        (err, result) => {
                          if (err) reject(err);
                          else {
                            conn.query(`DELETE FROM users WHERE userId = ?`,[token.userId],
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
            });
          }
        });
    })
      .then((data) => {
        response.status = 200;
        response.data = {};
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