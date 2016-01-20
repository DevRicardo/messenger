
/*  MANEJA EL REGISTRO DE MENSAJES Y CONSULTA DE LOS ULTIMOS 
    MENSAJES REGISTRADOS
  */
function MessageDao(db){

    
    // COMPRUEBA QUE SE INSTANCIE LA CLASE CON EL OPERADOR NEW
    if(false == (this instanceof MessageDao)){

    	console.log("WARNING: No onstancio la clase de manera adecuada. Utilice el operador NEW");
    	return new MessageDao(db);
    }

    /*  Coleccion message en la base de datos  */
    var messages = db.collection("messages");
    
    /*    
    * Registrar un nuevo mensaje
    */ 
    this.addMessage = function(username,date,message,callback){

    	//datos del mensaje
    	var message = {'username':username, 'date':date, 'message':message};
    	// insertar datos en la coleccion
    	messages.insert(message, function(err, result){
            if(err){
            	return callback(err, null);
            }
            console.log("Message save");
            return callback(null, result);
    	});

    }

    /*    
    * Listar los ultimos mensaje
    */
    this.lastMessage = function( limit, callback){
        var options = {
        	'sort':[['date','desc']],
        	'limit': limit
        } 
        /* buscar mensajes */
        messages.find({},options).toArray( function(err, rmessages){
           if(err){
              return callback(err, null);
           }
           return callback(null, rmessages);
        });
    }


}

module.exports.MessageDao = MessageDao;