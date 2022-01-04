const server = require('http').createServer();
const io = require('socket.io')(server);
const moment = require('moment');
const connection = require('./connection');
connection();

io.on('connection', client => {

  console.log(`connected with id : ${client.id}`);
  client.on('room_join', function (msg) {

    if (msg.roomId != null && msg.roomId != '') {
      client.join(msg.roomId, () => {
        io.to(msg.roomId).emit('room_join_response', { status: true, roomId: msg.roomId, userId: msg.userId });
      });
      console.log(msg.roomId);
      // console.log(room_id); 
    } else {
      io.emit('room_join_response', { status: false, message: 'room id is missing!' });
    }
  });
  client.on('room_leave', (msg) => {
    try {
      console.log('room leave');
      client.leave();
    } catch (err) {
      console.log(err);
    }
  });

  // client.on("messages", function (data) {
  // conn.query("INSERT INTO `messages` (`roomId`, `senderUserId`, `senderName`, `message`, `type`, `attachment`, `messageTime`)VALUES('" + data.roomId + "','" + data.senderUserId + "','" + data.senderName + "','" + data.message + "','" + data.type + "','" + data.attachment + "','" + data.messageTime + "')");    
  // io.to(data.roomId).emit('message_response', data);
  // });

  client.on("messages", function (data) {
  conn.query("INSERT INTO `messages` (`roomId`, `senderUserId`, `senderName`, `message`, `type`, `attachment`, `messageTime`)VALUES('" + data.roomId + "','" + data.senderUserId + "','" + data.senderName + "','" + data.message + "','" + data.type + "','" + data.attachment + "','" + data.messageTime + "')");    
  conn.query(`SELECT * FROM messages WHERE roomId = ${data.roomId} AND senderUserId = ${data.senderUserId} AND messageId = (SELECT MAX(messageId) FROM messages WHERE roomId = ${data.roomId})`, function (err, result) {
      if (err) throw err; 
      console.log(err, 'Error');
      io.to(data.roomId).emit('message_response', result[0]);
    })
  });

  client.on("delete_messages", function (data) {
    console.log(data, 'data');
   conn.query(`UPDATE messages SET message = "This message has been deleted.", type = "deleted" WHERE messageId IN (${data.userIds})`);
  io.to(data.roomId).emit("delete_response", data);
    });

  // On Typing... 
  client.on('is_typing', function (data) {
    if (data.status === true) {
      io.to(data.roomId).emit('typing', data);
    } else {
      io.to(data.roomId).emit('typing', data);
    }
  });

  client.on('event', data => { /* … */ });
  client.on('disconnect', () => {
    console.log(`disconnected`);
  });
});
server.listen(5000, () => {
  console.log("connected");
});