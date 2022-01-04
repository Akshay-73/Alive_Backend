//---required modules------------------------
const Promise = require("promise");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const async = require("async");
var axios = require('axios');
const dotenv = require('dotenv');
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;

//----Api exports------------------------------------------------
exports.signup = signup;
exports.verifyOtp = verifyOtp;
exports.resendOTP = resendOTP;
exports.logout = logout;

//---Api codes here----------------------------------------------
const userImageDefault = 'https://alive-bucket.s3.amazonaws.com/file-4510239702021696.png';
//-----signup------------------------------------------------------------

function signup(req, res, cb) {
    let otp = Math.floor(1000 + Math.random() * 9000);
    let { signupType, socialKey, userEmail, userPhone } = req.body;
  
    let response = {
      status: 0,
      data: {},
      message: ""
    };
  
    if (signupType === "google" || signupType === "facebook" || signupType === "apple") {
      conn.query(`SELECT *, count(userId) as countt FROM users WHERE socialKey = ?`, [socialKey],
        (err, result) => {
          if (err) reject(err);
          else
            if (result[0].countt === 0) {
              conn.query(`INSERT INTO users (signupType, socialKey, userEmail, userImage) VALUES (?,?,?,?)`,
              [signupType, socialKey, userEmail, userImageDefault],
                (err, result1) => {
                  if (err) reject(err);
                  else {
                    let token = jwt.sign({ userId: result1.insertId }, secretKey);
                    res.send({
                      status: 200,
                      message: "New user. login successful.",
                      data: { token: token, userId: result1.insertId }
                    });
                  }
                });
            }
            else {
              let token = jwt.sign({ userId: result[0].userId }, secretKey);
              res.send({
                status: 200,
                message: "login successful.",
                data: { token: token, userId: result[0].userId }
              });
            }
        });
    }
    else if (signupType === "phone") {
      conn.query(`SELECT *, count(userId) as countt FROM users WHERE userPhone = ? AND signupType = "phone"`, [userPhone],
        (err, result) => {
          if (err) reject(err);
          else
            if (result[0].countt === 0) {
              conn.query(`INSERT INTO users (signupType, otp, userPhone, userImage) VALUES (?,?,?,?)`,
                [signupType, otp, userPhone, userImageDefault],
                (err, result1) => {
                  if (err) reject(err);
                  else {
                    var data = JSON.stringify({
                      "sender_id": "TXTIND",
                      "route": "v3",
                      "message": `Welcome to alive. Your one time Login OTP is: ${otp}. We believe in no passwords approach. People already have so much to remember`,
                      "numbers": `${userPhone}`
                    });
                    return new Promise((resolve, reject) => {
                      var config = {
                        method: 'post',
                        url: 'https://www.fast2sms.com/dev/bulkV2',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': 'LQwSos6uqGzFtav0fYxHPWMBX89D1ehOCERgrl2jdUTy3ZNAciwB9MlmA6P2H73XWzfSYkJO4aqjvN0n',
                        },
                        data: data
                      };
                
                    axios(config)
                      .then(function ({ data }) {
                        conn.query(`UPDATE users SET otp = ? WHERE userPhone = ?`,[otp, userPhone],
                          (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                            response.status = 200;
                            response.data = {};
                            response.message = "OTP sent successfully.";
                            res.json(response);
                          });
                      })
                      .catch(function (err) {
                        console.log(err.message);
                        response.status = 400;
                        response.message = "Error";
                        res.json(response);
                      })
                  })
                  }
                });
            } else {
              var data = JSON.stringify({
                "sender_id": "TXTIND",
                "route": "v3",
                "message": `Welcome to alive. Your one time Login OTP is: ${otp}. We believe in no passwords approach. People already have so much to remember.`,
                "numbers": `${userPhone}`
              });
              return new Promise((resolve, reject) => {
                var config = {
                  method: 'post',
                  url: 'https://www.fast2sms.com/dev/bulkV2',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'LQwSos6uqGzFtav0fYxHPWMBX89D1ehOCERgrl2jdUTy3ZNAciwB9MlmA6P2H73XWzfSYkJO4aqjvN0n',
                  },
                  data: data
                };
          
              axios(config)
                .then(function ({ data }) {
                  conn.query(`UPDATE users SET otp = ? WHERE userPhone = ?`,[otp, userPhone],
                    (err, result) => {
                      if (err) reject(err);
                      else resolve(result);
                      response.status = 200;
                      response.data = {};
                      response.message = "OTP sent successfully.";
                      res.json(response);
                    });
                })
                .catch(function (err) {
                  console.log(err.message);
                  response.status = 400;
                  response.message = "Error";
                  res.json(response);
                })
            })
            }
        });
    }
    else {
      res.send({
        status: 400,
        message: "incorrect parameters.",
        data: {}
      });
    }
  }
  
  //------------verify Otp-------------------------------------------
  
  function verifyOtp(req, res) {
    let {userPhone, otp} = req.body;
    let randomKey = Math.floor(103210985 + Math.random() * 9054825790);
    let response = {
      status: 0,
      data: {},
      message: ""
    };
  
    new Promise((resolve, reject) => {
        conn.query(`SELECT *, count(userId) AS countt FROM users WHERE userPhone = ?`,[userPhone],
        (err, result) => {
          if (err) reject(err);
          else {
            if (result[0].countt === 0) {
              res.send({
                status: 404,
                message: "Number doesn't exists.",
                data: {}
              }); 
            } else {
              if (result[0].otp == otp && result[0].otp.length != 10){
                conn.query(`UPDATE users SET otp = ? WHERE userPhone = ?`,[randomKey, userPhone],
                (err, result2) => {
                  if (err) reject(err);
                  else resolve(result2);
                });
                let token = jwt.sign({ userId: result[0].userId }, secretKey);
                res.send({
                  status: 200,
                  message: "Otp verified. Login successful.",
                  data: {token: token, userId: result[0].userId }
                  
                }); 
              } 
              else if(result[0].otp.length === 10){
                res.send({
                  status: 200,
                  message: "Otp expired.",
                  data: {}
                  
                }); 
              }
              else {
                res.send({
                  status: 201,
                  message: "Incorrect Otp.",
                  data: {}
                });    
              }
            }
          }
        });
    })
      .then((data) => {
        response.status = 200;
        response.data = {};
        response.message = "success.";
        // res.json(response);
      })
      .catch((err) => {
        console.log(err);
        response.status = 400;
        response.message = "Error";
        res.json(response);
      });
  }
  
  //-----------resend otp-----------------------------------------------
  function resendOTP(req, res) {
    let otp = Math.floor(1000 + Math.random() * 9000);
  
    let { userPhone } = req.body;
  
    let response = {
      status: 0,
      data: {},
      message: ""
    };
  
    var axios = require('axios');
      var data = JSON.stringify({
        "sender_id": "TXTIND",
        "route": "v3",
        "message": `Welcome to alive. Your one time Login OTP is: ${otp}. We believe in no passwords approach. People already have so much to remember.`,
        "numbers": `${userPhone}`
      });
  
      return new Promise((resolve, reject) => {
        var config = {
          method: 'post',
          url: 'https://www.fast2sms.com/dev/bulkV2',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'LQwSos6uqGzFtav0fYxHPWMBX89D1ehOCERgrl2jdUTy3ZNAciwB9MlmA6P2H73XWzfSYkJO4aqjvN0n',
          },
          data: data
        };
  
      axios(config)
        .then(function ({ data }) {
          response.status = 200;
          response.data = {};
          response.message = "OTP sent successfully.";
          res.json(response);
        })
        .catch(function (err) {
          console.log(err.message);
          response.status = 400;
          response.message = "Error";
          res.json(response);
        })
    })
  }

  //-----logout--------------------------------------------

  function logout(req, res) {
    const bearerHeader = req.headers['authorization'];
    let token = jwt.verify(bearerHeader, secretKey);
  
    let response = {
      status: 0,
      data: {},
      message: ""
    };
  
    new Promise((resolve, reject) => {
      conn.query(`UPDATE users SET userFcmToken = "logout" WHERE userId = ?`,[token.userId],
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