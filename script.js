var meshes=[], bodies=[];
var world = new CANNON.World();
world.quatNormalizeSkip = 0;
world.quatNormalizeFast = false;
world.gravity.set(0,-10,0);
world.broadphase = new CANNON.NaiveBroadphase();
var GROUP1 = 1;
var GROUP2 = 2;
var GROUP3 = 4;
var GROUP4 = 4;
var light1, light2, light3;
var cubeMesh;
var secondi = 60000;
var ix = 0;
var iy = 540;
var iz = 50;
var rendering = true;
var an;
var interval;
var speed = 0;
var controller_state = {};
var input;
var dim1;
var dim2;
var wallMaze;
var l = 1;
var myJSON;
var larghezza = window.innerWidth;
var altezza = window.innerHeight;
var score = 0;
var redT = 0;
var timeout;
var world;
var dt = 1 / 60;

var constraintDown = false;
var camera, scene, renderer, gplane=false, clickMarker=false;
var geometry, material, mesh;
var controls,time = Date.now();

var jointBody, constrainedBody, mouseConstraint;

var container, camera, scene, renderer, projector;
var boxBody2;


/*
Algoritmo usato per generare il labirinto, alcune parti sono state
modificate per fare in modo che il labirinto che viene generato venga poi
disegnato con la libreria threejs e non con delle linee.
*/
function DrawMap(scene,level){

  var c = atob(wallMaze);
  var o = 0;
  var d;

  var material = new THREE.MeshLambertMaterial( { color: 0xffffff, overdraw: 0.5 } );

  var geometry = new THREE.BoxGeometry(0,0,0);
  var fullmesh = new THREE.Mesh(geometry, material);

  for (var x=0;x<dim1;x++)
  for (var y=0;y<dim2;y++)
  {
    d = ~c.charCodeAt(x + y*dim1);

    if (d & 1) {paintRightWall(x,y,fullmesh, material); }
    if (d & 2) { paintUpWall(x,y,fullmesh, material);    }
    if (d & 4) { paintLeftWall(x,y,fullmesh, material);  }
    if (d & 8) { paintDownWall(x,y,fullmesh, material);  }
  }

  scene.add(fullmesh);
}

function getHWall(x,y, material)
{
  var geometry = new THREE.BoxGeometry(60,80,10);
  return getCube(x,y,geometry, material);
}

function getVWall(x,y,material)
{
  var geometry = new THREE.BoxGeometry(10,80,60);
  return getCube(x,y,geometry, material);
}

function paintRightWall(x,y,mesh, material)
{
  var VWall = getVWall(x,y,material);
  VWall.position.x += 25;

  addPhysicToCube2(VWall);

  meshes.push(VWall);
  scene.add(VWall);

}

function paintLeftWall(x,y,mesh, material)
{
  var VWall = getVWall(x,y,material);
  VWall.position.x -= 25;
  addPhysicToCube3(VWall);
  meshes.push(VWall);
  scene.add(VWall);

}

function paintUpWall(x,y,mesh, material)
{
  var HWall = getHWall(x,y,material);
  HWall.position.z -= 25;
  addPhysicToCube(HWall)

  meshes.push(HWall);
  scene.add(HWall);
}

function paintDownWall(x,y,mesh, material)
{
  var HWall = getHWall(x,y,material);
  HWall.position.z += 25;
  addPhysicToCube1(HWall)

  meshes.push(HWall);
  scene.add(HWall);
}


// Funzione che crea i muri del labirinto, lo switch interno serve perchè a
// seconda del livello ci sono delle caratteristiche diverse per i muri
// perchè se il livello è più avanti il labirinto è più complicato
function getCube(x,y,geometry,material){
  var cube = new THREE.Mesh(geometry, material);


  switch(l){
    case 1:
    cube.position.x = (x*50 - 350 + 25);
    cube.position.z = (y*50 - 260 + 25);
    cube.position.y = 40;
    break;
    case 2:
    cube.position.x = (x*50 - 480 + 25);
    cube.position.z = (y*50 - 350 + 25);
    cube.position.y = 40;
    break;
    case 3:
    cube.position.x = (x*50 - 550 + 25);
    cube.position.z = (y*50 - 380 + 25);
    cube.position.y = 40;
    break;
  }

  return cube;
}

/*
Funzioni che servono ad aggiungere la "fisica" ai muri ovvero
viene aggiunta la possibilità di far rimbalzare la palla
All'interno delle funzioni mettiamo i muri nel gruppo 1 delle collisioni,
poi diciamo che devono essere gestite solamente le collisioni con gli oggetti del
gruppo3 che sarebbe quello della palla
*/
function addPhysicToCube(HWall){
  var mazeShape = new CANNON.Box(new CANNON.Vec3(37,80,12));
  var mazeBody = new CANNON.Body({ mass: 0 });
  mazeBody.addShape(mazeShape);
  mazeBody.position.set(HWall.position.x ,HWall.position.y,HWall.position.z );
  mazeBody.collisionFilterGroup = GROUP1;
  mazeBody.collisionFilterMask = GROUP3;
  world.addBody(mazeBody);
  bodies.push(mazeBody);
}

function addPhysicToCube1(HWall){
  var mazeShape = new CANNON.Box(new CANNON.Vec3(37,80,12));
  var mazeBody = new CANNON.Body({ mass: 0 });
  mazeBody.addShape(mazeShape);
  mazeBody.position.set(HWall.position.x,HWall.position.y,HWall.position.z );
  // sta nel gruppo 1 però sotto gli dico con chi collide.
  mazeBody.collisionFilterGroup = GROUP1;
  mazeBody.collisionFilterMask = GROUP3;
  world.addBody(mazeBody);
  bodies.push(mazeBody);
}

function addPhysicToCube2(VWall){
  var mazeShape = new CANNON.Box(new CANNON.Vec3(13,80,37));
  var mazeBody = new CANNON.Body({ mass: 0 });
  mazeBody.addShape(mazeShape);
  mazeBody.position.set(VWall.position.x ,VWall.position.y,VWall.position.z);
  mazeBody.collisionFilterGroup = GROUP1;
  mazeBody.collisionFilterMask = GROUP3;
  world.addBody(mazeBody);
  bodies.push(mazeBody);
}

function addPhysicToCube3(VWall){
  var mazeShape = new CANNON.Box(new CANNON.Vec3(13,80,37));
  var mazeBody = new CANNON.Body({ mass: 0 });
  mazeBody.addShape(mazeShape);
  mazeBody.position.set(VWall.position.x ,VWall.position.y,VWall.position.z);
  mazeBody.collisionFilterGroup = GROUP1;
  mazeBody.collisionFilterMask = GROUP3;
  world.addBody(mazeBody);
  bodies.push(mazeBody);
}


// Funzione per generare le luci, generando le luci vado a colorare
// i vari elementi della scena, quindi per questo i valori numerici sono proprio scelti
// precisamente
function generatelights()
{

  var color1 = 0.17188360186396656;
  var color2 = 0.09762002423166649;
  var color3 = 0.03387711381022307;
  light1 = new THREE.DirectionalLight( color1 * 0xffffff );
  var pos1 = 0.05564653731032887,
  pos2 = 0.8243082874805607,
  pos3 = 0.791083160913272;

  light1.position.x = pos1 + 0.5;
  light1.position.y = pos2 + 0.5;
  light1.position.z = pos3 + 0.5;
  light1.position.normalize();
  scene.add(light1);
  pos1 = 0.5753064656276147;
  pos2 = 0.2527997065223261;
  pos3 = 0.7560471534216227;

  light2 = new THREE.DirectionalLight( color2 * 0xffffff );
  light2.position.x = pos1 - 0.5;
  light2.position.y = pos2 - 0.5;
  light2.position.z = pos3 - 0.5;
  light2.position.normalize();
  scene.add(light2);
  light3 = new THREE.DirectionalLight( color3 * 0xffffff );

  light3.position.x = pos1 - 1;
  light3.position.y = pos2 - 1;
  light3.position.z = pos3 - 1;
  light3.position.normalize();
  scene.add(light3);
}

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();


/*
Funzione che viene chiamata quando devo avviare il gioco, prende come parametro un numero
compreso tra 1 e 3 che mi indica quale livello sto giocando.
*/
function startGame(level){

  secondi = 60000;

  // A seconda del livello scelto prendo le specifiche del labirinto
  // di quel livello che devo andare a disegnare
  switch(level){
    case 1:
    l = 1;
    secondi = 60000;
    dim1 = myJSON.level1.dim1;
    dim2 = myJSON.level1.dim2;
    wallMaze = myJSON.level1.wall;
    break;
    case 2:
    secondi = 80000;
    dim1 = myJSON.level2.dim1;
    dim2 = myJSON.level2.dim2;
    wallMaze = myJSON.level2.wall;
    break;
    case 3:
    secondi = 100000;
    dim1 = myJSON.level3.dim1;
    dim2 = myJSON.level3.dim2;
    wallMaze = myJSON.level3.wall;
    break;

  }


  rendering = true;
  game = document.createElement( 'div' );
  game.id = "cnt";
  game.className = "mazecnt";
  document.body.appendChild(game);
  document.getElementById("chooseMode").style = "visibility:hidden";
  text = document.createElement('div');
  text.id = "text";
  text.className = "textcl";
  game.appendChild(text);

  // Pulsante per uscire dal gioco
  goHome = document.createElement('div');
  goHome.id = "goHome";
  goHome.className = "goHome";
  goHome.innerHTML = "Abbandona la partita"
  goHome.onclick = stopGame;
  game.appendChild(goHome);


  // Chiamo le funzioni per disegnare la scena
  initCannon();
  init(level);
  animate();
  document.getElementById("text").innerHTML = secondi;
  document.getElementById("goHome").style = "visibility:visible";

  document.getElementById("text").style = "visibility:visible";


  // Attivo il timer per fare in modo che venga contato il tempo che passa in modo
  // che se supero un certo tempo perdo la partita.
  timeout = setTimeout(function(){
    fail();
  }, secondi);
  interval = setInterval(function() {
    secondi = secondi-1000;
  }, 1000);

}


function init(level) {

  projector = new THREE.Projector();

  container = document.createElement( 'div' );
  document.getElementById("cnt").appendChild(container);

  // scene
  scene = new THREE.Scene();
  scene.position.x = 0;
  scene.position.y = 400;
  scene.position.z = 0;

  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 2000);


  // Cerco di aggiustare la dimensione del labirinto in base alla dimensione
  // dello schermo
  switch(l){
    case 1:
    var b = 750;

    if(larghezza < 800){
      b += 1200;
    }
    else if(larghezza < 1200){
      b += 600;
    }
    else if(larghezza < 1500){
      b += 300;
    }

    camera.position.y = b;
    camera.position.x = 0;
    camera.position.z = 20;
    break;
    case 2:
    var b = 950;

    if(larghezza < 800){
      b += 900;
    }
    else if(larghezza < 1200){
      b += 700;
    }
    else if(larghezza < 1500){
      b += 300;
    }

    camera.position.y = b;
    camera.position.x = 0;
    camera.position.z = 20;
    break;
    case 3:
    var b = 1000;

    if(larghezza < 800){
      b += 900;
    }
    else if(larghezza < 1200){
      b += 700;
    }
    else if(larghezza < 1500){
      b += 500;
    }

    camera.position.y = b;
    camera.position.x = 0;
    camera.position.z = 20;
    break;
  }

  scene.add(camera);

  // piano rosso ovvero il punto di arrivo
  var planeGeometry = new THREE.PlaneGeometry();
  var planeMaterial = new THREE.MeshBasicMaterial({color: 0xffff00});
  var plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  plane.rotation.x = -0.5 * Math.PI;
  plane.position.y = 0;
  scene.add(plane);

  var planeGeometry2 = new THREE.PlaneGeometry(35, 35 , 100, 100);
  var planeMaterial2 = new THREE.MeshBasicMaterial({color: 0xFF0000});
  var plane2 = new THREE.Mesh(planeGeometry2, planeMaterial2);
  plane2.rotation.x = -0.5 * Math.PI;

  if(l == 1){
    plane2.position.x = 130;
    plane2.position.y = 1;
    plane2.position.z = 120;
  }
  else if(l == 2){
    plane2.position.x = 150;
    plane2.position.y = 1;
    plane2.position.z = 240;
  }
  else{
    plane2.position.x = 180;
    plane2.position.y = 1;
    plane2.position.z = 75;
  }


  scene.add(plane2);


  // palla
  var cubeGeo = new THREE.SphereGeometry(10, 10, 10, 0, Math.PI * 2, 0, Math.PI * 2);
  var cubeMaterial = new THREE.MeshNormalMaterial();

  cubeMesh = new THREE.Mesh(cubeGeo, cubeMaterial);
  cubeMesh.castShadow = true;
  meshes.push(cubeMesh);
  scene.add(cubeMesh);


  DrawMap(scene,level);

  generatelights();
  var c = 0.4205325802135218 ;
  var ambientLight = new THREE.AmbientLight( c * 0x10 );
  scene.add( ambientLight );


  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor( 0x9fa7b7, 0 );
  container.appendChild( renderer.domElement );
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.shadowMapEnabled = true;

}

function animate() {
  an = requestAnimationFrame( animate );
  updatePhysics();
  render();
}

function updatePhysics(){
  world.step(dt);
  for(var i=0; i !== meshes.length; i++){
    meshes[i].position.copy(bodies[i].position);
    meshes[i].quaternion.copy(bodies[i].quaternion);
  }
}


/*
Funzione che controlla se mi trovo nella posizione in cui devo arrivare per vincere
oppure no, se mi ci trovo finisce la partita .

La funzione gestisce anche lo spostamento della pallina andando a modificare la sua posizione
*/
function render() {

  if(rendering){
    if(l == 1 && cubeMesh.position.x >= 113 && cubeMesh.position.x <= 137 && cubeMesh.position.y >= 0 && cubeMesh.position.y <= 5 && cubeMesh.position.z >= 102 && cubeMesh.position.z <= 120){
      win();
    }
    else if(l == 2 && cubeMesh.position.x >= 133 && cubeMesh.position.x <= 155 && cubeMesh.position.y >= 0 && cubeMesh.position.y <= 20 && cubeMesh.position.z >= 212 && cubeMesh.position.z <= 245){
      win();
    }
    else if(l == 3 && cubeMesh.position.x >= 160 && cubeMesh.position.x <= 190 && cubeMesh.position.y >= 0 && cubeMesh.position.y <= 20 && cubeMesh.position.z >= 60 && cubeMesh.position.z <= 80){
      win();
    }
    else{
      camera.lookAt(new THREE.Vector3(0,100,0));
      renderer.render(scene, camera);
      document.getElementById("text").innerHTML = "Tempo Rimanente: <br>" + secondi/1000 + " secondi";
    }


    if (boxBody) {

      var velocita = boxBody.velocity;
      var x = velocita.x;
      var z = velocita.z;
      var y = velocita.y

      // SU E GIU
      if(controller_state.steerZ < 0) {
        z = -100;
        boxBody.velocity.set(x,y,-100);
      }

      if(controller_state.steerZ > 0) {
        z = 100;
        boxBody.velocity.set(x,y,100);
      }


      // DESTRA E SINISTRA
      if (controller_state.steerX < 0) {
        x = -100;
        boxBody.velocity.set(-100,y,z);
      }

      if(controller_state.steerX > 0) {
        x = 100;
        boxBody.velocity.set(100,y,z);
      }

    }

  }

}

/*

Funzione che si occupa di aggiungere la fisica agli elementi della scena

*/
function initCannon(){

  var mass = 5, radius = 1.3;

  boxShape = new CANNON.Sphere(1);

  // PALLA
  boxBody = new CANNON.Body({ mass: 10 });
  boxBody.addShape(boxShape);

  // Il posizionamento della palla dipende dal livello, se sono al livello 3
  // la palla è messa vicino al traguardo per semplificare, poi si cambia
  if(l === 1){
    boxBody.position.set(130,1,-50);
  }
  else if(l === 2){
    boxBody.position.set(150,1,-200);
  }
  else {
    boxBody.position.set(180,1,125);
  }

  // La palla è nel gruppo 3 per le collisioni e collide con il gruppo1
  // e con il 2, in particolare con il gruppo2 ci sta solamente sopra
  // perchè è la base
  boxBody.collisionFilterGroup = GROUP3;
  boxBody.collisionFilterMask = GROUP1 | GROUP2;

  world.addBody(boxBody);
  bodies.push(boxBody);


  var groundShape = new CANNON.Plane();
  var groundBody = new CANNON.Body({ mass: 0 });
  groundBody.addShape(groundShape);
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
  groundBody.collisionFilterGroup = GROUP2;
  groundBody.collisionFilterMask = GROUP3;

  world.addBody(groundBody);

}

// Funzione che controlla i tasti che vengono premuti
document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {

  var keyCode = event.keyCode;

  // su
  if (keyCode == 38) {
    boxBody.velocity.set(0,0,-100);
  }
  // giù
  else if (keyCode == 40) {

    boxBody.velocity.set(0,0,100);

  }
  // destra
  else if (keyCode == 39) {

    boxBody.velocity.set(100,0,0);

  }
  // sinistra
  else if (keyCode == 37) {
    boxBody.velocity.set(-100,0,0);
  }


}

var music = true;

// Funzione che serve per bloccare la musica che si sente mentre gioco
function stopMusic(){
  var sounds = document.getElementsByTagName('audio');
  for(i=0; i<sounds.length; i++){
    if(music){
      sounds[i].pause();
      music = false;
    }
    else{
      sounds[i].play();
      music = true;
    }
  }

}

// Funzione chimata quando clicco su autore
function getAutore(){
  document.getElementById("autore").style = "visibility:visible";
  document.getElementById("mainMenu").style = "visibility:hidden";
}

// Funzione associata al pulsante back
function back(){
  document.getElementById("stats").style = "display:none";
  document.getElementById("autore").style = "visibility:hidden";
  document.getElementById("chooseMode").style = "visibility:hidden";
  document.getElementById("mainMenu").style = "visibility:visible";
}

// Funzione chimata quando clicco su backhome
function backHome(){
  document.getElementById("fail").style = "visibility:hidden";
  document.getElementById("mainMenu").style = "visibility:visible";
}

// funzione che viene chiamata quando vinco il livello
function backHome_win(){
  l = 1;
  document.getElementById("score" + redT).style = "color: black";
  document.getElementById("win").style = "visibility:hidden";
  document.getElementById("win_tot").style = "visibility:hidden";
  document.getElementById("MyForm").style = "display:none";
  document.getElementById("listSc").style = "visibility:hidden";
  document.getElementById("mainMenu").style = "visibility:visible";
  document.getElementById("completo").innerHTML = "HAI COMPLETATO IL GIOCO"

  if(document.getElementById("score5")){
    document.getElementById("score5").remove();
  }

}

/*

  Funzione della vittoria, controllo il livello che ho giocato e poi
  vado a calcolarmi il punteggio relativo al tempo che ho impiegato
  per finire il livello.
  E' importante stoppare il timer.
*/
function win(){
  if(l==1){
    score += 60 - secondi/1000;

  }
  else if(l==2){
    score += 80 - secondi/1000;

  }
  else{
    score += 100 - secondi/1000;

  }


  if(l === 3){
    rendering = false;
    cancelAnimationFrame(an);
    document.getElementById("text").style = "visibility:hidden";
    document.getElementById("win_tot").style = "visibility:visible";
    document.getElementById("MyForm").style = "display:block";
    clearInterval(interval);
    clearTimeout(timeout);
    document.getElementById("cnt").remove();
    meshes = [];
    bodies = [];
    world = new CANNON.World();
  }
  else{
    rendering = false;
    cancelAnimationFrame(an);
    document.getElementById("text").style = "visibility:hidden";
    document.getElementById("win").style = "visibility:visible";
    clearInterval(interval);
    clearTimeout(timeout);
    document.getElementById("cnt").remove();
    meshes = [];
    bodies = [];
    world = new CANNON.World();
  }


}

// Funzione che viene chiamata quando si perde
function fail(){
  document.getElementById("fail").style = "visibility:visible";
  clearInterval(interval);
  clearTimeout(timeout);
  document.getElementById("cnt").remove();
  rendering = false;
  cancelAnimationFrame(an);
}

// Funzione che viene chiamata quando clicco sul pulsante per scegliere la modalità di gioco
function chooseMode(){
  $.getJSON("info.json", function(json){
    myJSON = json;
    dim1 = json.level1.dim1;
    dim2 = json.level1.dim2;
    wallMaze = json.level1.wall;
  });
  document.getElementById("mainMenu").style = "visibility:hidden";
  document.getElementById("chooseMode").style = "visibility:visible";
}


/*
  Funzione che viene chiamata quando decido di giocare con lo smartphone
*/
function smartphone_start(){

  input = io.connect();

  // Caso in cui sto sul dispositivo e clicco su smartphone, devo controllare
  // se nell'url ho anche l'id, se ho l'id emetto un controller_connect.
  if (window.location.href.indexOf('?id=') > 0) {

    input.emit('controller_connect', window.location.href.split('?id=')[1]);

  }
  // In questo caso sono sul browser del ccomputer e aspetto che qualcuno si connetta
  // per connettersi devono scansionare un qr code che faccio apparire qua sotto.
  else {
    input.on('connect', function() {
      input.emit('game_connect');
    });

    input.on('controller_connected', function(connected){
      if (connected) {
        alert("Dispositivo connesso, premi ok per giocare");

        qr.style.display = "none";
        document.getElementById("connectDevice").style = "visibility:hidden";
        startGame();

        // Devo controllare se il client mi manda un segnale di controller_state_change
        // se me lo manda associo alla variabile controller_state il dato che mi manda
        // e lo utilizzo per spostare la pallina
        input.on('controller_state_change', function(state) {
          controller_state = state;

        });



      }
      else{

        qr.style.display = "block";

      }

    });

  }


  var game_connected = function() { 
    var url = "http://192.168.1.107:8089?id=" + input.id;
    input.removeListener('game_connected', game_connected);

    document.getElementById("chooseMode").style = "visibility:hidden";
    document.getElementById("connectDevice").style = "visibility:visible";


    var qr = document.createElement('div');
    qr.id = "qr";
    var div = document.getElementById("qrcode");
    div.appendChild(qr);
    var qr_code = new QRCode("qr");
    qr_code.makeCode(url);

  };

  // quando ho ricevuto una nuova connessione
  input.on('game_connected', game_connected);

  // Quando si muove lo smartphone
  var emit_updates = function(){

    input.emit('controller_state_change', controller_state);
  }
  touchstart = function(e){
    e.preventDefault();
    controller_state.accelerate = true;
    emit_updates();
  },
  touchend = function(e){
    e.preventDefault();
    controller_state.accelerate = false;
    emit_updates();
  },
  devicemotion = function(e){
    controller_state.steer = e.accelerationIncludingGravity.y ;
    controller_state.steerX = e.accelerationIncludingGravity.x ;
    controller_state.steerY = e.accelerationIncludingGravity.y ;
    controller_state.steerZ = e.accelerationIncludingGravity.z ;

    emit_updates();
  }
  document.body.addEventListener('touchstart', touchstart, false); // iOS & Android
  document.body.addEventListener('MSPointerDown', touchstart, false); // Windows Phone
  document.body.addEventListener('touchend', touchend, false); // iOS & Android
  document.body.addEventListener('MSPointerUp', touchend, false); // Windows Phone
  window.addEventListener('devicemotion', devicemotion, false);


}

function level(){
  document.getElementById("level").style = "visibility:visible";
  document.getElementById("mainMenu").style = "visibility:hidden";
}

function nextLevel(){
  l = l+1;
  document.getElementById("win").style = "visibility:hidden";

  startGame(l);
}


window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

  renderer.setSize(window.innerWidth, window.innerHeight);

}


/*

  Funzione di supporto che serve per mostrare la classifica del gioco

*/
function listener(k1, k2, k3, k4, k, num){
  score = 0;
  var array = [];
  var ccou = 0;
  console.log("ricevuto sendScore");
  var ccou = 0;

  if(k1!=null){
    array[1] = k1;
    ccou ++;
  }
  if(k2!=null){
    array[2] = k2;
    ccou ++;
  }
  if(k3!=null){
    array[3] = k3;
    ccou ++;
  }
  if(k4!=null){
    array[4] = k4;
    ccou ++;
  }
  console.log(ccou);
  var myForm = document.getElementById("MyForm");
  myForm.style.display = "none";
  var string = [];

  for(var i=1;i<ccou+1;i++){
    string[i] = i + "  -  " + array[i].nome + "   -   " + array[i].final;
    console.log(string[i]);

    document.getElementById("score" + i).innerHTML = string[i];
    console.log(document.getElementById("score" + i).innerHTML);
  }

  if(num < 4){
    console.log(num);
    document.getElementById("score" + (num+1)).style = "color: red";
    redT = num+1;
    console.log(redT);
  }
  else{
    tu = document.createElement( 'div' );
    tu.id = "score5";
    tu.className = "scoreList";
    tu.style = "color:red";
    var strings = (num+1) + "  -  " + k.nome + "   -   " + k.final;
    tu.innerHTML = strings;
    document.getElementById("listSc").appendChild(tu);
  }

  document.getElementById("completo").innerHTML = "CLASSIFICA:"
  document.getElementById("listSc").style.visibility = "visible";
  input.removeListener("sendScore", listener);


}

// aggiunta di un nuovo utente alla classifica
function addUser(){
  var name = document.getElementById("username").value;

  if(input == null){
    input = io.connect();
  }
  input.emit('addUser', name, score);


  input.on('sendScore', listener);


}


// funzione per prendere la classifica senza giocare
function mainScore(k1, k2, k3, k4){

  var array = [];
  var ccou = 0;

  if(k1!=null){
    array[1] = k1;
    ccou ++;
  }
  if(k2!=null){
    array[2] = k2;
    ccou ++;
  }
  if(k3!=null){
    array[3] = k3;
    ccou ++;
  }
  if(k4!=null){
    array[4] = k4;
    ccou ++;
  }
  if(ccou==0){
    console.log("non ci sono statistiche")
  }

  var string = [];

  for(var i=1;i<ccou+1;i++){
    string[i] = i + "  -  " + array[i].nome + "   -   " + array[i].final;
    console.log(string[i]);

    document.getElementById("mainScore" + i).innerHTML = string[i];

  }
  document.getElementById("listScore").style = "visibility: visible";
  input.removeListener("sendMainStats", mainScore);
  console.log("Mia");

}

function getStats(){
  document.getElementById("stats").style = "display:block";
  document.getElementById("mainMenu").style = "visibility:hidden";
  if(input == null){
    input = io.connect();
  }
  input.emit('getStats');

  input.on('sendMainStats', mainScore);
}


function stopGame(){
  clearInterval(interval);
  clearTimeout(timeout);
  document.getElementById("cnt").remove();
  rendering = false;
  cancelAnimationFrame(an);

  document.getElementById("mainMenu").style = "visibility:visible";

}
