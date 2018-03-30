var express = require('express');
var port = 8089;
var app = express();
var http = require('http');
var server  = http.createServer(app);

// Quando dichiaro una variabile = {} è una hash table in pratica, ho una struttura dati (chiave, valore)
// che posso anche "esplorare" con game_socket[chiave] che mi restituisce il valore associato
var game_sockets = {};
var io = require('socket.io').listen(server);
var controller_sockets = {};
var address = "CIAOAAA";
var username = [];
// L'idea di Socket.IO è che si possono ricevere e inviare tutti gli eventi che vogliamo
// e ogni evento può contenere tutti i dati che vogliamo.
// Tutti gli oggetti che possono essere inseriti in un JSON possono essere trasferiti con Socket.io

function compare(a, b) {
  const genreA = a.final;
  const genreB = b.final;

  var comparison = 0;
  if (genreA > genreB) {
    comparison = 1;
  } else if (genreA < genreB) {
    comparison = -1;
  }
  return comparison;
}



// Qua io sto dicendo che nel momento in cui da io ricevo una nuova connessione mi prendo il socket
// che viene aperto (che sarebbe il parametro che passo alla funzione socket) e lo utilizzo per andare
// a vedere se su questo socket ricevo degli eventi.
io.sockets.on('connection', function (socket) {

  // Quando un client si connette mi invia l'evento game_connect, non ci sono
  // parametri associati a questo evento di connessione.

  socket.on('game_connect', function(){

    console.log("Game connected with " + socket.id);

    // Quando ricevo questo evento vado a salvare all'interno di game_socket con la chiave
    // corrispondente all'id del socket che sto usando per comunicare con quel client
    // il socket che sto usando, poi lascio un campo destinato al controller_id che al momento
    // è non definito, perchè lo inserirò nel momento in cui oltre ad un client che gioca su desktop
    // avrò anche un controller aperto su smartphone.

    game_sockets[socket.id] = {
      socket: socket,
      controller_id: undefined
    };

    // Emetto l'evento game_connected che viene preso dal client che in questo modo capisce che la richiesta
    // di connessione è andata a buon fine
    socket.emit("game_connected");
  });


  // Controlliamo se nel socket riceviamo un evento controller_connect, questo vuol dire che
  // Il client ha collegato alla pagina già aperta sul browser un controller su smartphone.
  // Per ogni connessione che arriva da un differente client ho un socket differente, in questo caso il game_socket_id
  // è proprio quello del primo client che ho aperto mentre il socket.id è diverso dal primo socket che avevo aperto.
  socket.on('controller_connect', function(game_socket_id){

    // game_socket_id == id del socket del client aperto su pc
    // socket.id == id del socket che ho aperto da smartphone

    console.log(game_socket_id);
    console.log(socket.id);
    console.log(Object.keys(game_sockets).length);
    console.log(Object.keys(game_sockets));

    // Devo controllare se ho già nella hashmap una chiave corrispondente al game_socket_id,
    // ne ho già una perchè il game_socket_id è uguale al socket.id della prima connessione con il client
    // e non ho un controller id associato.
    if (game_sockets[game_socket_id] && !game_sockets[game_socket_id].controller_id) {

      console.log("Controller connected");

      // qua con questo aggiungo nella hash map dei controller un nuovo elemento
      // che identifico con il socket id del nuovo socket che ho creato per la comunicazione
      // è il secondo socket, non il primo, salvo anche un game id che è invece l'id del primo socket.
      controller_sockets[socket.id] = {
        socket: socket,
        game_id: game_socket_id
      };

      // associo il controller id al client che avevo creato in precedenza
      game_sockets[game_socket_id].controller_id = socket.id;

      // Emetto un controller_connected in modo che il client capisce che ho
      game_sockets[game_socket_id].socket.emit("controller_connected", true);

      socket.emit("controller_connected", true);
      console.log("Emesso controller_connected");

      // Controllo se arriva il controller state change con i dati associati al movimento che mi sono stati
      // spediti dallo smartphone.
      // Se sono arrivati questi dati allora vado a vedere nell'array dei client game aperti e mando una segnalazione
      // al client aperto in modo che venga spostata la pallina.
      socket.on('controller_state_change', function(data){
        if(game_sockets[game_socket_id]){

          game_sockets[game_socket_id].socket.emit("controller_state_change", data);
        }
      });

    } else {

      console.log("Controller attempted to connect but failed");

      socket.emit("controller_connected", false);
    }

  });

  socket.on("getStats", function(){
    console.log("getStatsd");
    socket.emit('sendMainStats', username[0], username[1], username[2], username[3]);

  });

  socket.on('addUser', function(name, score){
      var k = {
        nome: name,
        //livello1: 0,
        //livello2: 0,
        //livello3: 0,
        final: score
      }
      username.push(k);
      username.sort(compare);
      console.log(username);
      var num = 0;
      for(var i=0;i<username.length;i++){
        if(k == username[i]){
          num = i;
        }
      }

      if(num < 4){
        socket.emit('sendScore', username[0], username[1], username[2], username[3], null, num);
      }
      else{
        socket.emit('sendScore', username[0], username[1], username[2], username[3], k, num);
      }



  });

});

// Indichiamo la porta che deve utilizzare il server per ascoltare le richieste
server.listen(port);
// Qui gli diciamo quale pagina html utilizzare
app.use(express.static(__dirname));



console.log("Server attivo");
