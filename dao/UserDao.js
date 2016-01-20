/*  modulo para encriptar el password de los usuarios  */


var bcrypt = require('bcrypt-nodejs');



/* Objeto conectado a la base de datos */

function UserDao(db){

	/**
   * Si el constructor es llamado sin el operador 'new',
   * muestra una advertencia y lo llama correctamente.
   */
  if (false == (this instanceof UserDao)) {
    console.log('WARNING: UserDAO constructor called without "new" operator');
    return new UserDao(db);
  }

  /* Collection users en la base de datos*/ 
  var users = db.collection('users');


  /*  Añadir un nuevo usuario a la base de datos  */
  this.addUser = function(username, password, email, callback){

      // verificar que el usuario no exista
      users.findOne({'_id':username}, function(err, user){
          
          if(err) throw err;

          if(user){
              var user_yet_exist_error = new Error('Usuario ya existe');
              user_yet_exist_error.msg = "Usuario ya existe";
              return callback(user_yet_exist_error, null);
          }else{

          	// generar password has
          	var salt = bcrypt.genSaltSync();
          	var password_has = bcrypt.hashSync(password, salt);



          	// crear el nuevo usuario con los parametros daos
          	var new_user = {'_id':username, 'password':password_has, 'email':email};

          	// insertar el nuevo usuario en la base de datos
          	users.insert(new_user, function(err, result){

          		if(err) return callback(err, null);
          		console.log("Nuevo usuario creado");
                //console.log("Resultado de la error:"+err);
          		return callback(null, result);

          	});
          }

      });

  }

  // validar login de usuario
  this.validateLogin = function (username, password, callback) {
    
    users.findOne({'_id': username}, function (err, user) {
      if (err) return callback(err, null);
      
      if (user) {
        if (bcrypt.compareSync(password, user.password)) {
          callback(null, user);
        }
        else {
          var invalid_password_error = new Error('Invalid password');
          invalid_password_error.msg = 'Invalid password';
          callback(invalid_password_error, null);
        }
      }
      else {
        var no_such_user_error = new Error('User not found');
        no_such_user_error.msg = 'User not found';
        callback(no_such_user_error, null);
      }
    });
  }

}

module.exports.UserDao = UserDao;