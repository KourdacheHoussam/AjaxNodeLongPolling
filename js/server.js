/**
 * Created by Housssam on 05/12/2014.
 * Tout d'abord on va inclure les librairies que l'on souhaite utiliser à l'aide de la
 * méthode require()*/

 //Variables globales stockés sur le serveur js utilisables par tous les clients
var port=1337;
var md5 = require('md5');
var io, app, http_server, path, express, util, url, date, queryString ;
express=require('express');
path=require('path');
app=require('express')();
util=require('util');
url=require('url');
queryString=require('querystring');
var list_users={}; //user list container
var list_messages=[]; //cache message
var history_limit=30; //limit taille list_messages
var date;
/** Dans ce qui suit , on va créer un serveur, qui prends une fonction en paramètre
 * recevant la requête envoyée et la réponse à renvoyer à l'utilisateur*/
http_server=require('http').Server(app);

var clients_en_attente=[];
/*-----------------------------------------------------------------------------*/


// Réception d'un nouveau message à enregistrer
app.get('/addmessage', function(req, rep){
	console.log("Je suis dans addmessage")
	var msg=req.query.message;
	 /** save message*/
   	if(req.query.message != null){
   		saveMessageDB(msg);
   	}

   	//now, on envoit le nouveau message à tous les clients
   	while(clients_en_attente.length>0){
   		var client=clients_en_attente.pop(); // on enleve de la liste
   		client.writeHead(200, {'Content-Type': 'application/json', "Access-Control-Allow-Origin":"*" });
   		client.end(JSON.stringify({			 // on lui envoie le message
   			count:list_messages.length,
   			append:req.query.message
   		}));
   	}
 	rep.writeHead(200, {'Content-Type': 'application/json', "Access-Control-Allow-Origin":"*" });	
	rep.write(JSON.stringify(msg)); //faut absolument le garder pour que ça marche
	rep.end();	
});



// L'utilisateur demande de changer de mode de communication
app.get('/choosemode', function(req, rep){		
	console.log("Je suis dans choosemode");
	if(req.query.modecommunication != null){
		console.log(" mode :  "+ req.query.modecommunication);
		switch(req.query.modecommunication ){
			case "polling":
				console.log("Mode polling choisi");
				//prevenir le client que le mode est polling
				//confirmMode("polling");
				break;
			case "long-polling":
				console.log("Mode long-polling choisi");
				//prevenir le client que le mode est long polling
				//confirmMode("long-polling");
				break;
			case "push":
				console.log("Mode push choisi");
				//prvenir le client que le mode est push
				//confirmMode("push");
				break;
		}
	}
	//confirmer à l'utilisateur le mode choisi
	function confirmMode(mode){
		console.log(mode);
		rep.writeHead(200, {'Content-Type': 'application/json', "Access-Control-Allow-Origin":"*" });	
		rep.write(JSON.stringify(mode)); //faut absolument le garder pour que ça marche
		rep.end();
	}
});

/** ------------------------------------------ LONG POLLING ---------------------------------------------*/

app.get('/longpolling', function(req, rep){
	//code long polling 	
    
	//on récupere la date d'arrivee dans le chat
	var objet= JSON.stringify(req.query);
	var json=JSON.parse(objet);
	var heure=json.heure;
	var minutes=json.minutes;
	var secondes=json.secondes;
	console.log("Heure : "+heure+" min: "+minutes + " sec: "+secondes);
	//nouveau messages à envoyer
	var new_messages=[];
	//si le nombre de message que j'ai dans mon tableau list_message est sup à l'heure, j'envoie la data à l'user
	if(list_messages.length>0){
		for(var i=0; i<list_messages.length;i++){
			console.log("le message -> : " +list_messages[i]["message"]);
			//list_messages[i]["seconds"] > secondes || 
			if(  list_messages[i]["hour"] > heure && list_messages[i]["minutes"] > minutes  ){
				new_messages.push(list_messages[i]);	
			}
		}
	}
	console.log("la liste des nouveau messages "+new_messages.length);
	
	if(new_messages.length>0){
		rep.writeHead(200, {'Content-Type': 'application/json', "Access-Control-Allow-Origin":"*" });	
		rep.write(JSON.stringify(new_messages)); //faut absolument le garder pour que ça marche
		rep.end();
	}else{
		clients_en_attente.push(rep);	//S'il n'y a pas de nouveau messages à envoyer au client, on l'enregistre juqu'a ce qu'il y en est de nouveaux
		console.log("Client connecté à H: "+heure +" m: "+ minutes + "  est en attente");
	}
	
});


/** ------------------------------------------ POLLING ---------------------------------------------*/

app.get('/polling', function(req, rep){
	console.log("je suis dans le polling a la seconde : ");
	//on récupere la date d'arrivee dans le chat
	var objet= JSON.stringify(req.query);
	var json= JSON.parse(objet);
	var heure= json.heure;
	var minutes= json.minutes;
	var secondes= json.secondes;
	console.log("Heure : "+heure+" min: "+minutes + " sec: "+secondes);
	// on crée un tableau pour enregistrer les nouveau messages par rapport à 
	// l'utilisateur connecté
	var new_messages = [];

	//console.log(obj.heure+' '+obj.minutes+' '+obj.secondes);
	console.log("La liste des messages avant le IF :"+ list_messages.length);
	
	if(list_messages.length > 0){	
		for(var i=0; i<list_messages.length;i++){
			console.log("le message -> : " +list_messages[i]["message"]);
			if( list_messages[i]["seconds"] > secondes ||  list_messages[i]["hour"] > heure || list_messages[i]["minutes"] > minutes  ){
				new_messages.push(list_messages[i]);	
			}
		}
	}

	rep.writeHead(200, {'Content-Type': 'application/json', "Access-Control-Allow-Origin":"*" });	
	rep.write(JSON.stringify(new_messages)); //faut absolument le garder pour que ça marche
	rep.end();
});

// methode appelle avec l'url : localhost:1337/
app.get('/', function(req, rep){      		
	console.log("Je suis dans /") 
    var path = url.parse(req.url).pathname;  
    var mode_communication=req.query.modecommunication;
	
	/**----------------- IF IS POLLING MODE -------------------

	if(mode_communication=='polling'){
		rep.writeHead(200, {'Content-Type': 'application/json', "Access-Control-Allow-Origin":"*" });	
		rep.write(JSON.stringify(list_messages)); //faut absolument le garder pour que ça marche
		rep.end();
	}*/

	/**----------------- IF IS LONG-POLLING MODE -------------------*/
	/**
	if(req.query.message != null || mode_communication=='long-polling'){

		//attente de messages
		function attente(delai) {
			
			// on met le compteur à zéro
			clearInterval( delai );
			delai = setTimeout( function(){
				if (list_messages == null) {
					attente(delai);
				}
				else {
					sendMessages();
				}
			}, delai); //on attend 1 scd			
		}

		if (list_messages == null) {
			attente(1000);
		}
		else {
			sendMessages();
		}	
	}*/
});


// enregistrer un message dans la liste de message
function saveMessageDB(message){
	date=new Date();
    var currentmessage=new Object();
	currentmessage['message']=message;
	currentmessage['hour']=date.getHours();
	currentmessage['minutes']=date.getMinutes();
	currentmessage['seconds']=date.getSeconds();
	//enregistrer dans le tableau
	list_messages.push(currentmessage);		
	console.log(" *** Message saved : "+currentmessage.message);

};


/** ecoute des sockets sur le port 3000 du serveur */

http_server.listen(1337, function(){
    console.log("Listening on : 1337");
});
