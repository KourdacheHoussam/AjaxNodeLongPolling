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
	// Form d'envoi de message
	// quand le formulaire est envoyé
	$('#send-message').submit( function(){
		// on récupère le contenu de l'input
		var message = $('#send-message input[name=message]').val();
		// Si le contenu du message du formulaire est null
		if( jQuery.trim( message ) == '' ){
			window.alert('Enter a message!');
			return false;
		}
		// la méthode ajax() est utilisé pour effectuer une requête réseau asynchrone.
		$.ajax({
			url: 'http://localhost:1337/',	// l'url vers laquelle j'envoie ma requete
			type: 'GET',				// specifie le type de requete GET ou POST
			data: 'message=' + message, //specifie les données à envoyer au serveur
			dataType: 'json',			//le type de données attendue par le serveur, ici c du json			
        	//success est la méthode à faire tourner quand la requete aboutit
			success: function(data, status, xhr){
				if(status="success"){
					var msg='';
					//var obj=$.parse(data);
					list_messages=JSON.stringify(data);
					//alert("msg "+list_messages.toString());
					//$('#message-sent').append("Voutre message est envoyé");
				}				    
			},
			error:function(xhr, status){
				alert("il y a une error");
			}
			// la méthode à appeler quand la requete est finie: quand on a reçu le callback success ou error.
			//complete:
		});
		return false;
	});


	/** -------------------------------------------------------------------------
	----------------------------- LONG POLLING ----------------------------------
	-----------------------------------------------------------------------------*/

	function polling(){
		var time;
		mode_communication="polling";
		$.ajax({	
			url:'http://localhost:1337/',
			type:'GET',
			data:'modecommunication='+mode_communication,
			dataType:'json',
			success: function(data, status, xhr){
				if(status="success"){
					var msg='';
					clearInterval(time);
					time=setTimeout( function(){
						polling();
					}, 5000 );
					
					list_messages=JSON.stringify(data);
					$('#message-sent').append("<p>Votre message est reçu: contenu  " + list_messages.toString()+"</p>");
				}else{
					alert(':( Please refresh the page!');
				}				    
			},
			error:function(error){
				clearInterval( time );
				time = setTimeout( function(){
						polling( );
					}, 
					15000 //on attend 15 scd
				);
			}, 			
		});
	};
	// Appel à la fonction polling 
	//polling();

	/** -------------------------------------------------------------------------
	----------------------------- LONG POLLING ----------------------------------
	-----------------------------------------------------------------------------*/

	// Start Long-polling for messages
	// on crée une novuelle fonction javascript
	function longpolling(  ){
		var time;
		mode_communication = 'long-polling';
			
		//on envoie la requete vers le serveur dont le port est 1337:
		//on lui passe en parametre un timestamp et un lastid		
		jQuery.ajax({

			url: 'http://localhost:1337/',
			type: 'GET',
			data: 'modecommunication='+ mode_communication,
			dataType: 'json', 

			//SUCESS et ERROR sont deux call back renvoyées par le serveur
			success: function( data, status, xhr ){  //Au cas du succes on verifie si on a des resultats
				
				clearInterval( time );

				if( status == 'success' ){
					
					var msg='';
					list_messages=JSON.stringify(data);
					$('#message-sent').append("<p>Votre message est reçu: contenu  " + list_messages.toString()+"</p>");

					// quand on reçoit des données, on refait une nouvelle requete 
					// aprés une seconde, en appelant
					// la fonction longpolling
					time=setTimeout( function(){
						longpolling( );
					}, 1000 );
					
				} 
				else if( data.status == 'error' ){
					alert('We got confused, Please refresh the page!');
				}
			},
			// Si la requete envoye renvoie une errer: exemple d'un serveur en panne
			// ou pas de connexion internet.
			// nous allons renvoyer une requete au bout de 15 seconde afin de laisse le temps au serveur de redemarrer

			error: function(){
				clearInterval( t );
				t = setTimeout( function(){
					    longpolling( );
					}, 
					15000 //15 secondes
				);
			}
		});
	}
	longpolling( );
}); 