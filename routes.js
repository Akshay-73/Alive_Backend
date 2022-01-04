const express = require('express');
const router = express.Router();
const authentication = require('./apis/authentication');
const events = require('./apis/events');
const main = require('./apis/main');
const tags = require('./apis/tags');
const tribe = require('./apis/tribe');
const users = require('./apis/users');
const chats = require('./apis/chats')
const utils = require("./auth");
const multer = require("multer");
const path = require("path");

//---authentication routes-----------------------------------
router.post("/signup", authentication.signup);
router.post("/verifyOtp", authentication.verifyOtp);
router.post("/resendOTP", authentication.resendOTP);
router.post("/logout", utils.verifyToken, authentication.logout);

//---events--------------------------------------------------
router.post("/createEvent", utils.verifyToken, events.createEvent);
router.get("/getEventById", utils.verifyToken, events.getEventById);
router.get("/getEventListByStatus", utils.verifyToken, events.getEventListByStatus);
router.post("/editEvent", utils.verifyToken, events.editEvent);
router.post("/deleteEvent", utils.verifyToken, events.deleteEvent);
router.post("/liveEvent", utils.verifyToken, events.liveEvent);
router.get("/getEventCategories", utils.verifyToken, events.getEventCategories);
router.post("/addExperience", utils.verifyToken, events.addExperience);
router.get("/getEventImages", utils.verifyToken, events.getEventImages);
router.get("/getEventByIdForWeb", events.getEventByIdForWeb);


//---main----------------------------------------------------
router.get("/getAllNotifications", utils.verifyToken, main.getAllNotifications);
router.get("/getRandomQuotes", main.getRandomQuotes);

//---chats---------------------------------------------------
router.get("/getChatRooms", utils.verifyToken, chats.getChatRooms);
router.get("/getAllChats", utils.verifyToken, chats.getAllChats);
router.post("/deleteMyMessage", utils.verifyToken, chats.deleteMyMessage);

//---tags----------------------------------------------------
router.get("/getAllTags", utils.verifyToken, tags.getAllTags);
router.post("/addTag", utils.verifyToken, tags.addTag);
router.get("/searchTag", utils.verifyToken, tags.searchTag);

//---tribe---------------------------------------------------
router.post("/transferEventToTribeMember", utils.verifyToken, tribe.transferEventToTribeMember);
router.post("/requestJoinTribe", utils.verifyToken, tribe.requestJoinTribe);
router.post("/tribeRequestAction", utils.verifyToken, tribe.tribeRequestAction);
router.get("/getAllJoinTribeRequest", utils.verifyToken, tribe.getAllJoinTribeRequest);

//---users---------------------------------------------------
router.get("/getUserProfileById", users.getUserProfileById);
router.get("/getUserProfileByToken", utils.verifyToken, users.getUserProfileByToken);
router.post("/updateUserProfile", utils.verifyToken, users.updateUserProfile);
router.post("/updateFCM", utils.verifyToken, users.updateFCM);
router.post("/updateUserProfile", utils.verifyToken, users.updateUserProfile);
router.post("/deleteAccount", utils.verifyToken, users.deleteAccount);

//-----multer------------------------------------------------
const DIR = './uploads';

let storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, DIR);
   },
   filename: (req, file, cb) => {
      req.fileType = file.mimetype
      cb(null, file.fieldname + '-' + Math.floor(Math.random() * 9999) * Date.now() + path.extname(file.originalname));
   }, 
});

let upload = multer({ storage: storage });

//upload api route ------------------------------------------
router.post("/upload", upload.any('photo'), main.upload);
//-----------------------------------------------------------

module.exports = router;