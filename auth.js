const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
require('dotenv').config();
const secretKey = process.env.SECRET_KEY;
exports.verifyToken = verifyToken;

function verifyToken(req, res, next) {
  const bearToken = req.headers["authorization"];
  let obj = {
    status: 0,
    body: {},
    message: ""
  };

  if (typeof bearToken !== "undefined") {
    req.token = bearToken.replace("Bearer ", "");
    try {

      let token = jwt.verify(req.token, secretKey);
      conn.query(`SELECT count(*) from users where userId = ?`,
        [token.userId],
        (error, getres) => {
          if (error) {
            console.log(error);
            obj.message = "Unable to verify";
            res.send(obj);
          } else {
            getres == 0 ? ((obj.message = "Bad token"), re.json(obj)) : next();
          }
        }
      );
    } catch (err) {
      console.log(err);
      obj.message = err.message;
      res.json(obj);
    }
  } else {
    res.sendStatus(403);
  }
}
