var Elo = (function() {
  function getRatingDelta(myRating, opponentRating, myGameResult) {
    if ([0, 0.5, 1].indexOf(myGameResult) === -1) {
      return null;
    }
    var myChanceToWin = 1 / ( 1 + Math.pow(10, (opponentRating - myRating) / 400));
    return Math.round(32 * (myGameResult - myChanceToWin));
  }
  function getNewRating(myRating, opponentRating, myGameResult) {
    return myRating + getRatingDelta(myRating, opponentRating, myGameResult);
  }
  return {
    getRatingDelta: getRatingDelta,
    getNewRating: getNewRating
  };
})();

function setSelectionChance(){
    var i = 1;
    albumChance = new Array(); albumChance[0] = 0;
    var totalSongs = 0;
    var incrementalChance = 0;

    for (var album in albums){
        albumChance[i] = Object.keys(albums[album]).length; //fill number of songs in each album
        i++;
        totalSongs += Object.keys(albums[album]).length //total number of songs
    }
    for (var i = 1; i < albumChance.length; i++){
        albumChance[i] = albumChance[i]/totalSongs + incrementalChance; //division to get percentage range, addition to get the max/min values for range
        incrementalChance = albumChance[i];
    }
}

function toTitleCase(str){
    return str.replace(/(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g,
    function(firstLetter){
        return firstLetter.toUpperCase();
    });
}

function randomAlbum() {
    var keys = Object.keys(albums)
    var chance = Math.random()
    for(var i = 0;  i < keys.length; i++){
        if(chance > albumChance[i] && chance < albumChance[i+1]){ //adds weight to longer arrays ie. stadium arcadium
            return keys[i];
        }
    }
};

function randomObjectKeyName(obj){ //selects song
    var keys = Object.keys(obj);
    return keys[keys.length * Math.random() << 0]
}

function randomArrayValue(array){
    return array[array.length * Math.random() << 0]
}
/*
function getAllRatings(){
    var allRatings = new Array();
    for (var album in albums){
    	for (var song in albums[album]){
            allRatings.push(albums[album][song].rating);
        }
    }
    return allRatings;
}
function getRatingPosition(rating){
    var allRatings = getAllRatings().sort(function(a,b){return b-a});
    return (allRatings.indexOf(rating)+1)/allRatings.length;
}
*/
var bSidesEnabled = 0;
function generateSongs(bias){
    function repick(album){
        if(album == 1 || album == undefined)
            album1 = randomAlbum();
            song1 = randomObjectKeyName(albums[album1]); //repick
        if(album == 2 || album == undefined)
            album2 = randomAlbum();
            song2 = randomObjectKeyName(albums[album2]);
    }
    /*
    function repickIfBias(){
        if(bias == 1){ //show higher ranked choices
            while(getRatingPosition(albums[album1][song1].rating) < 0.8){
                repick(1);
            }
            while(getRatingPosition(albums[album2][song2].rating) < 0.8 || song1 == song2){
                repick(2);
            }
        }
    }
    */
    var album1 = randomAlbum();
    var album2 = randomAlbum();
    var song1 = randomObjectKeyName(albums[album1]);
    var song2 = randomObjectKeyName(albums[album2]);
    while(song1 == song2){
        song2 = randomObjectKeyName(albums[album2])
    }

    if(!bSidesEnabled){
        while(album1 == 'b-sides' || album2 == 'b-sides' || song1 == song2){
            repick();
        }
    }
    /*
    if(bSidesEnabled){ //include b-sides / normal pick
        repickIfBias();
    }
    else{ //exclude b-sides
        while(album1 == 'b-sides' || album2 == 'b-sides' || song1 == song2){
            repick();
            repickIfBias();
        }
    }
    */
    return [album1, song1, album2, song2];
}

function checkChoicesForTop20(){
    var top20instances = 0;
    for (var i=0; i < top20.length; i++){
        if(song1 == top20[i].name || song2 == top20[i].name){
            top20instances++;
        }
    }
    return top20instances;
}

function standardDeviation(values){
  var avg = average(values);
  var squareDiffs = values.map(function(value){
    var diff = value - avg;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });
  var avgSquareDiff = average(squareDiffs);
  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev;
}

function average(data){
  var sum = data.reduce(function(sum, value){
    return sum + value;
  }, 0);
  var avg = sum / data.length;
  return avg;
}

function POST(data){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/vote", true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.send(data);
}

function getPublicVotes(){
    var xhr = new XMLHttpRequest();
    xhr.open('GET',"/ranks.json", true);
    xhr.send();
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4 && xhr.status == 200) {
            albums = JSON.parse(xhr.responseText);

            setSelectionChance();
            init();
        }
    }
}

function getPersonalVotes(){
    var xhr = new XMLHttpRequest();
    xhr.open('POST',"/ranking", true);
    xhr.send();
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4 && xhr.status == 200) {
            albums = JSON.parse(xhr.responseText);

            setSelectionChance();
            init();
        }
    }
}

var top20enabled = false;
function getTop20(){
    var xhr = new XMLHttpRequest();
    xhr.open('POST',"/top20", true);
    xhr.send();
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4 && xhr.status == 200) {
            top20 = JSON.parse(xhr.responseText);
            top20enabled = true;
        }
    }
}

var lastMessage = '';
function postChoice(winner){
    var message = JSON.stringify([album1, song1, album2, song2]);
    if(message != lastMessage){ //avoid double posting
        POST(JSON.stringify([album1, song1, album2, song2, winner]));
        lastMessage = message;
    }
}

function setActiveSelection(list, num){
    for (var i = 0; i < list.length; i++){
        list[i].classList.remove("active");
    }
    list[num].classList.add("active")
}

var album1, album2, song1, song2;
var lastLoadTime = 0;

function init(){
    var leftImage = document.getElementById("leftImage");
    var rightImage = document.getElementById("rightImage");
    var skipButton = document.getElementById("skipButton");
    var bsideSelection = document.getElementById("b-side-selection").children;

    document.getElementsByClassName('leftChoice')[0].addEventListener("click", leftWin);
    document.getElementsByClassName('rightChoice')[0].addEventListener("click", rightWin);
    skipButton.addEventListener("click", skipChoice);

    for (var i = 0; i < bsideSelection.length; i++){
        bsideSelection[i].addEventListener("click", (function(i){
            return function(){
                bSidesEnabled = i;
                setActiveSelection(bsideSelection, i);
            }
        })(i))
    }

    loadNextSongs();

    function loadNextSongs(){
        var bias = 0;
        //if(standardDeviation(getAllRatings()) > 30){ //triggers after enough variation in personal ratings
        /*
            var chance = Math.random(); //chances: 0.8 - normal, 0.2 - top
            if(chance > 0.8){
                console.log('chance to bias triggered');
                bias = 1;
                skipButton.classList.add('disabled');
            }
            else
                skipButton.classList.remove('disabled');
            */
        //}
        var songsToDisplay = generateSongs(bias);
        album1 = songsToDisplay[0];
        album2 = songsToDisplay[2];
        song1 = songsToDisplay[1];
        song2 = songsToDisplay[3];

        if(top20enabled){
            if(checkChoicesForTop20() == 2){ //both choices are in the top 10
                console.log('both choices are in the global top 10');
                skipButton.classList.add('disabled'); //disable skip
            }
            else { skipButton.classList.remove('disabled'); }
        }

        leftImage.style.backgroundImage = 'url("images/'+album1+'.jpg")';
        rightImage.style.backgroundImage = 'url("images/'+album2+'.jpg")';

        leftAlbum.textContent = toTitleCase(album1);
        rightAlbum.textContent = toTitleCase(album2);

        if(leftAlbum.textContent == "Self Titled"){
            leftAlbum.textContent = "The Red Hot Chili Peppers";
        }
        if(rightAlbum.textContent == "Self Titled"){
            rightAlbum.textContent = "The Red Hot Chili Peppers";
        }

        leftSong.textContent = song1;
        rightSong.textContent = song2;
    }

    function leftWin(){
        if(checkSpamInterval()==false){return}
        /*
        albums[album1][song1].rating = Elo.getNewRating(albums[album1][song1].rating, albums[album2][song2].rating, 1);
        albums[album1][song1].wins++;
        albums[album2][song2].rating = Elo.getNewRating(albums[album2][song2].rating, albums[album1][song1].rating, 0);
        albums[album2][song2].losses++;
        */
        postChoice(0);
        loadNextSongs();
        fadeOutline(leftImage);
    }
    function rightWin(){
        if(checkSpamInterval()==false){return}
        /*
        albums[album2][song2].rating = Elo.getNewRating(albums[album2][song2].rating, albums[album1][song1].rating, 1);
        albums[album2][song2].wins++;
        albums[album1][song1].rating = Elo.getNewRating(albums[album1][song1].rating, albums[album2][song2].rating, 0);
        albums[album1][song1].losses++;
        */
        postChoice(1);
        loadNextSongs();
        fadeOutline(rightImage);
    }
    function skipChoice(){
        if(skipButton.classList[0] != 'disabled'){
            if(checkSpamInterval()==false){return}
            loadNextSongs();
            fadeOutline(skipButton);
        }
    }
    checkSpamInterval = function(){
        //prevents accidental spam selection
        var currentTime = new Date().getTime();
        if(currentTime < lastLoadTime + 100){
            return false;
        }
        lastLoadTime = currentTime;
        return true;
    }

    fadeOutline = function(obj){
        obj.classList.remove("fadeOutline");
        setTimeout(function(){
            obj.classList.add("fadeOutline");
        }, 1);
    }

    secretKeycode =[87,69,84,32,83,65,78,68];
    keyHistory = new Array(8);
    window.addEventListener("keydown", whatKey);
    function whatKey (evt) {
      var eventReference = (typeof evt !== "undefined")? evt : event;
      var keyCode = eventReference.keyCode;

      if (keyCode == 37) {
          //left arrow
          leftWin();
      }
      else if (keyCode == 39) {
          //right arrow
          rightWin();
      }
      else if (keyCode == 40 ||keyCode == 32) {
          //up arrow / bottom arrow / space
          skipChoice();
      }

      keyHistory.shift();
      keyHistory.push(keyCode);
      if(keyHistory.toString() == secretKeycode.toString()){
          document.body.style.backgroundImage = 'url("images/wet sand.jpg")';
          document.body.style.color = "black";
      }
    }

}

getPublicVotes();
getTop20();
