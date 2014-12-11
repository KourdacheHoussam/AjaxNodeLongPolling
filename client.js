/**
* Created by Housssam on 06/12/2014.
* Ici, on va se connecter au site depuis SOCKET.IO
* Remarque : ici on utilise JQUERY
*/

/**( function($){

    /** io utilisé ci-dessous est chargé automatiquement via le JS intégré dans index.html
     * on appelle la méthode connect du composant io(chargé de socket) pour nous connecter au serveur.
    var socket=io('http://localhost:3000/');
})();*/

jQuery( function(){
	
	var mode_communication;
	var list_messages=[];
	var mode_actuel='';
	var date_connection=new Date();
	var date_hour=date_connection.getHours();
	var date_minutes=date_connection.getMinutes();
	var date_seconds=date_connection.getSeconds();

	// fonction pour prévenir le serveur du choix de mode de COM
	function chooseModeCommunication(mode){
		$.ajax({
			url:'http://localhost:1337/choosemode/',
			type:'GET',
			data: 'modecommunication=' + mode,
			dataType:'json',
			complete: function(data, status, xhr){ //recevoir une confirmation du serveur
				//si c bon, on coche la case du mode choisi sur l'IHM				
				// on démarre le long polling()
				alert("La communication avec ce mode est établie");
				mode_actuel=JSON.stringify(data);

				alert("Mode actuel =" +mode_actuel);
			},
			fail: function(xhr, status){
				alert("La communication avec ce mode n'est pas établie");
			}
		});
		
	};


	//fonction pour envoyer un nouveau message
	function sendNewMessage(message){
		$.ajax({		// la méthode ajax() est utilisé pour effectuer une requête réseau asynchrone.
			url: 'http://localhost:1337/addmessage/',	// l'url vers laquelle j'envoie ma requete
			type: 'GET',				// specifie le type de requete GET ou POST
			data: 'message=' + message, //specifie les données à envoyer au serveur
			dataType: 'json',			//le type de données attendue par le serveur, ici c du json			
        	//success est la méthode à faire tourner quand la requete aboutit
			complete: function(data, status, xhr){
				if(status="success"){
					var msg='';
					//var obj=$.parse(data);
					list_messages=JSON.stringify(data);
				}				    
			},
			fail:function(xhr, status){
				alert("il y a une error");
			}
			// la méthode à appeler quand la requete est finie: quand on a reçu le callback success ou error.
			//complete:
		});
		return false; //empecher le rafraichissement
	};

	//Quand on choisit un mode
	$('#choix-mode').submit( function(){
		// on récupère le contenu de l'input
		var mode = $('#choix-mode input[name=mode]').val();
		chooseModeCommunication(mode);
		return false;//empecher le rafraichissement
	});

	// quand le formulaire est envoyé
	$('#send-message').submit( function(){
		// on récupère le contenu de l'input
		var message = $('#send-message input[name=message]').val();
		// Si le contenu du message du formulaire est null
		if( jQuery.trim( message ) == '' ){
			window.alert('Enter a message!');
			return false;
		}
		sendNewMessage(message);//send it	
		return false;//empecher le rafraichissement	
	});


	/** ----------------------------------------------------------------------------------------------------------------
	------------------------------------------------------  POLLING ----------------------------------------------------
	--------------------------------------------------------------------------------------------------------------------*/

	function polling(){
		var time;	
		$.ajax({	
			url:'http://localhost:1337/polling/',
			type:'GET',
			data: { heure: date_hour, minutes:date_minutes, secondes:date_seconds },
			dataType:'json',
			success: function(data, status, xhr){
				clearInterval(time);
				if(status="success"){
					var msg='';					
					list_messages=JSON.stringify(data);					
					$('#message-sent').append("<p>Votre message est reçu: contenu  " + list_messages.toString()+"</p>");					
					time=setTimeout( function(){
						polling();
					}, 2000 );  // redemarre le polling au bout de 2 sec
				}else{
					alert(':( Please refresh the page!');
				}			    
			},
			error:function(){
				clearInterval( time );
				time = setTimeout( function(){					
					polling( );
				}, 19000 );//on attend 15 scd
			} 			
		});
		return false;
	};
	// Appel à la fonction polling 
	//polling();

	/** ----------------------------------------------------------------------------------------------------------------
	-------------------------------------------------------- LONG POLLING ----------------------------------------------
	--------------------------------------------------------------------------------------------------------------------*/

	// Start Long-polling for messages
	// on crée une novuelle fonction javascript
	function longPolling(  ){
		var time;		
		//on envoie la requete vers le serveur dont le port est 1337:
		//on lui passe en parametre un timestamp et un lastid		
		jQuery.ajax({
			url: 'http://localhost:1337/longpolling/',
			type: 'GET',
			data: { heure: date_hour, minutes:date_minutes, secondes:date_seconds },
			dataType: 'json', 
			//SUCESS et ERROR sont deux call back renvoyées par le serveur
			success: function( data, status, xhr ){  //Au cas du succes on verifie si on a des resultats				
				clearInterval( time );
				if( status == 'success' ){					
					
					// quand on reçoit des données, on refait une nouvelle requete 
					// aprés une seconde, en appelant
					// la fonction longpolling
					time=setTimeout( function(){
						longPolling( );
					}, 1000 );
					var msg='';
					list_messages=JSON.stringify(data);
					$('#message-sent').append("<p>Votre message est reçu: contenu  " + list_messages.toString()+"</p>");					
				} 
				else if( data.status == 'error' ){
					alert('We got confused, Please refresh the page!');
				}
			},
			// Si la requete envoye renvoie une errer: exemple d'un serveur en panne
			// ou pas de connexion internet.
			// nous allons renvoyer une requete au bout de 15 seconde afin de laisse le temps au serveur de redemarrer
			error: function(){
				clearInterval( time );
				time = setTimeout( function(){
					longPolling( );
				}, 15000); //15 secondes
			}
			// quand la requete est complete
			//complete:longPolling
		});
		return false;
	}
	longPolling();
}); 