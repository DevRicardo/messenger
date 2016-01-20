/* Librerias necesarias para la aplicación */
var bodyParser = require('body-parser');
var express     = require('express');
var app         = express();
var http        = require('http').Server(app);
var io          = require('socket.io')(http);
var MongoClient = require('mongodb').MongoClient;
var userDao     = require('./dao/UserDao').UserDao;
var messageDao  = require('./dao/MessageDao').MessageDao;

// Para acceder a los parametros de las peticiones POST
app.use(bodyParser.urlencoded({
  extended: true
}));


// ====================================================== //
// == MONGODB DATOS DE CONEXIÓN  OPENSHIF
// ====================================================== //
var mdbconf = {
  host: process.env.MONGODB_PORT_27017_TCP_ADDR || '172.17.0.3',
  port: '27017',
  db: 'messenger'
};


/* Mongodb config 
var mdbconf = {
  host: 'localhost',
  port: '27017',
  db: 'chatSS'
};*/

// ====================================================== //
// == INICIALIZA LA CONEXIÓN A MONGODB Y EL SERVIDOR
// =====================================================  //
var mongodbURL = 'mongodb://' + mdbconf.host + ':' + mdbconf.port + '/' + mdbconf.db;
if (process.env.OPENSHIFT_MONGODB_DB_URL) {
  mongodbURL = process.env.OPENSHIFT_MONGODB_DB_URL
}


/* Get a mongodb connection and start application */
MongoClient.connect(mongodbURL, function (err, db) {
  
  if (err) return new Error('Connection to mongodb unsuccessful');
  
  var usersDao = new userDao(db); // Initialize userDAO
  var messagesDao = new messageDao(db); // Initialize messageDao
  var onlineUsers = [];
  
  
/** *** *** ***
 *  Configuramos el sistema de ruteo para las peticiones web:
 */

 app.get('/', function (req, res) {
    res.sendFile( __dirname + '/views/cliente.html');
  });
  
  app.get('/signup', function (req, res) {
    res.sendFile( __dirname + '/views/signup.html');
  });
  
  app.post('/signup', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var email    = req.body.email;
    

    usersDao.addUser(username, password, email, function (err, user) {
      if (err) {
        res.send({ 'error': true, 'err': err});
      }
      else {
        //user.password = null;
        res.send({ 'error': false, 'user': user });
      }
    });
  });

  app.post('/login', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    
    usersDao.validateLogin(username, password, function (err, user) {
      if (err) {
        res.send({'error': true, 'err': err});
      }
      else {
        user.password = null;
        res.send({ 'error': false, 'user': user});
      }
    });
  });
  
app.get('/js/jquery-1.11.1.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/jquery-1.11.1.js');
  });
  
  /** css and js request */
  app.get('/css/foundation.min.css', function (req, res) {
    res.sendFile(__dirname + '/views/css/foundation.min.css');
  });

  app.get('/css/normalize.css', function (req, res) {
    res.sendFile(__dirname + '/views/css/normalize.css');
  });

   app.get('/css/chat.css', function (req, res) {
    res.sendFile(__dirname + '/views/css/chat.css');
  });
  
  app.get('/js/foundation.min.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/foundation.min.js');
  });

  app.get('/js/foundation.offcanvas.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/foundation.offcanvas.js');
  });


  app.get('/js/chat.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/chat.js');
  });

  /** *** ***
  
  app.get('*', function(req, res) {
    res.sendFile( __dirname + '/views/chat.html');
  });

 */
  /** *** *** ***
   *  Configuramos Socket.IO para estar a la escucha de
   *  nuevas conexiones. 
   */
  io.on('connection', function(socket) {
    
    console.log('New user connected');
    
    /**
     * Cada nuevo cliente solicita con este evento la lista
     * de usuarios conectados en el momento.
     */
    socket.on('all online users', function () {
      console.log("Solicitando lista de usuarios = "+onlineUsers[0].email);
      io.emit('all online users', onlineUsers);
    });
    
    /**
     * Cada nuevo socket debera estar a la escucha
     * del evento 'chat message', el cual se activa
     * cada vez que un usuario envia un mensaje.
     * 
     * @param  msg : Los datos enviados desde el cliente a 
     *               través del socket.
     */
    socket.on('chat message', function(msg) {      
      messagesDao.addMessage(msg.username, Date.now(),msg.message,function(err, nmsg){
          io.emit('chat message', msg);    
      }); 

    });
    
    /**
     * Mostramos en consola cada vez que un usuario
     * se desconecte del sistema.
     */
    socket.on('disconnect', function() {
      onlineUsers.splice(onlineUsers.indexOf(socket.user), 1);
      io.emit('remove user', socket.user);
      console.log('User disconnected');
    });
    
    /**
     * Cuando un cliente se conecta, emite este evento
     * para informar al resto de usuarios que se ha conectado.
     * @param  {[type]} nuser El nuevo usuarios
     */
    socket.on('new user', function (nuser) {
      socket.user = nuser;
      onlineUsers.push(nuser);
      io.emit('new user', nuser, onlineUsers);

    });
    
    socket.on('latest messages', function () {
      messagesDao.lastMessage(50, function (err, messages) {
      if (err) console.log('Error getting messages from history');
        socket.emit('latest messages', messages);
      });
    });
  });
 



  /**
   * Iniciamos la aplicación en el puerto 3000
   
  http.listen(3000, function() {
    console.log('listening on *:3000');
  });*/


  // ====================================================== //
  // == APP STARTUP OPENSHIFT
  // ====================================================== //
  if (process.env.OPENSHIFT_NODEJS_IP && process.env.OPENSHIFT_NODEJS_PORT) {
    http.listen(process.env.OPENSHIFT_NODEJS_PORT, process.env.OPENSHIFT_NODEJS_IP, function() {
      console.log('Listening at openshift on port: ' + process.env.OPENSHIFT_NODEJS_PORT);
    });
  }
  else {
    http.listen(80, function () {
      console.log('Listing on port: 80')
    })
  }
  
});