/**
 * Created by Housssam on 05/12/2014.
 * Tout d'abord on va inclure les librairies que l'on souhaite utiliser à l'aide de la
 * méthode require()*/

 //Variables globales stockés sur le serveur js utilisables par tous les clients
var port=1337;
var md5 = require('md5');
var io, app, http_server, path, express, util, url, date;
express=require('express');
path=require('path');
app=require('express')();
util=require('util');
url=require('url');
var list_users={}; //user list container
var list_messages=[]; //cache message
var history_limit=30; //limit taille list_messages
var date;

/** Dans ce qui suit , on va créer un serveur, qui prends une fonction en paramètre
 * recevant la requête envoyée et la réponse à renvoyer à l'utilisateur*/
http_server=require('http').Server(app);
io=require('socket.io')(http_server);

/*-----------------------------------------------------------------------------*/

app.get('/', function(req, rep){    
    console.log("RequestReceived");	   
    var path = url.parse(req.url).pathname;

    console.log(req.query.message);
    console.log("url original" +req.originalUrl);


    /** ---------------- save messages -----------------------*/
    date=new Date();
    if(req.query.message != null){
	    var currentmessage=new Object();
	    currentmessage['message']=req.query.message;
	    currentmessage['hour']=date.getHours();
	    currentmessage['minutes']=date.getMinutes();
	    //enregistrer dans le tableau
	    list_messages.push(currentmessage);
	}
    var mode_communication=req.query.modecommunication;
	
	/**----------------- IF IS POLLING MODE -------------------*/

	if(mode_communication=='polling'){
		rep.writeHead(200, {'Content-Type': 'application/json', "Access-Control-Allow-Origin":"*" });	
		rep.write(JSON.stringify(list_messages)); //faut absolument le garder pour que ça marche
		rep.end();
	}

	/**----------------- IF IS LONG-POLLING MODE -------------------*/

	if(mode_communication=='long-polling'){

		//attente de meassges
		function attente() {
			var time;
			clearInterval( time );
			time = setTimeout( function(){
				if (list_messages == null) {
					attente();
				}
				else {
					rep.writeHead(200, {'Content-Type': 'application/json', "Access-Control-Allow-Origin":"*" });	
					rep.write(JSON.stringify(list_messages)); //faut absolument le garder pour que ça marche
					rep.end();
				}
			}, 1000 //on attend 1 scd
			);
		}
		attente();
	}

	

    
    
});


/** -----------------------------------------------------------------------------*/

/** ecoute des sockets sur le port 3000 du serveur */

http_server.listen(1337, function(){
    console.log("Listening on : 1337");
});
