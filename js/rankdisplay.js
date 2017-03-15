var albums, albumsGlobal, albumsPersonal;

function getGlobalRanks(){
    return new Promise(function(resolve, reject){
        publicFilters[1].classList.add('disabled'); //disable clicks on personal button while requesting from server
        var xhr = new XMLHttpRequest();
        xhr.open('GET',"/ranking", true);
        xhr.send();
        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4 && xhr.status == 200) {
                resolve(JSON.parse(xhr.responseText))
            }
        }
    });
}
function getPersonalRanks(){
    return new Promise(function(resolve, reject){
        publicFilters[0].classList.add('disabled'); //disable clicks on global button while requesting from server
        var xhr = new XMLHttpRequest();
        xhr.open('POST',"/ranking", true);
        xhr.send();
        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4 && xhr.status == 200) {
                if(xhr.responseText != '')
                    resolve(JSON.parse(xhr.responseText))
                else
                    reject()
            }
        }
    });
}
var loadingGif = document.getElementById('loading-gif');
function toggleLoadingGif(){
    if(loadingGif.style.display == 'block')
        loadingGif.style.display = 'none';
    else
        loadingGif.style.display = 'block';
}

function enablePublicFilterButtons(){
    for (var i = 0; i < publicFilters.length; i++){
        publicFilters[i].classList.remove('disabled');
    }
}

function reapplyFilters(){
    clearTable();
    buildTable();
    sortTable(3, true);
    switchOrderFilter(document.getElementsByClassName("active")[1].textContent);
    switchAlbumFilter(document.getElementsByClassName("active")[2].textContent);
}

function toTitleCase(str){
    return str.replace(/(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g,
    function(firstLetter){
        return firstLetter.toUpperCase();
    });
}

var table = document.getElementsByTagName("tbody")[0];

//build table
function buildTable(){
    var i = 0;
    for (album in albums){
        for (song in albums[album]){
            var row = table.insertRow();
            row.style.backgroundImage = 'url("images/'+album+'.jpg")';
            i++;
            row.insertCell(0).textContent = i;
            row.insertCell(1).textContent = song;
            row.insertCell(2).textContent = toTitleCase(album);
            row.insertCell(3).textContent = albums[album][song].rating;
            row.insertCell(4).textContent = albums[album][song].wins;
            row.insertCell(5).textContent = albums[album][song].losses;
        }
    }
}
function sortTable(col, reverse) { //reverse = true or false
    var tb = table, // use `<tbody>` to ignore `<thead>` and `<tfoot>` rows
        tr = Array.prototype.slice.call(tb.rows, 0), // put rows into array
        i;
    reverse = -((+reverse) || -1);
    tr = tr.sort(function (a, b) { // sort rows
        if(localCompareSupport){
            return reverse
                * (a.cells[col].textContent.trim() // using `.textContent.trim()` for test
                    .localeCompare(b.cells[col].textContent.trim(), undefined, {numeric: true})
                   );
        }
        else {
            var result = naturalSorter(a.cells[col].textContent.trim(),b.cells[col].textContent.trim());
            if(result > 0){result=1} else {result=-1}
            return reverse * result;
        }
    });
    for(i = 0; i < tr.length; ++i) tb.appendChild(tr[i]); // append each row in order
    setRankNumbers(col);
}
function checklocaleCompareSupport() {
  try {
    'foo'.localeCompare('bar', 'i');
  } catch (e) {
    return e.name === 'RangeError';
  }
  return false;
}
var localCompareSupport = checklocaleCompareSupport();
function naturalSorter(as, bs){
    var a, b, a1, b1, i= 0, n, L,
    rx=/(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;
    if(as=== bs) return 0;
    a= as.toLowerCase().match(rx);
    b= bs.toLowerCase().match(rx);
    L= a.length;
    while(i<L){
        if(!b[i]) return 1;
        a1= a[i],
        b1= b[i++];
        if(a1!== b1){
            n= a1-b1;
            if(!isNaN(n)) return n;
            return a1>b1? 1:-1;
        }
    }
    return b[i]? -1:0;
}

var canBeEqual = true;
function setRankNumbers(rankDecider){
    if (typeof rankDecider === 'undefined') { rankDecider = 3; }
	var j = 0, prevDecider = 0.1;
    for (var i = 0; i < table.rows.length; i++){
        if(table.rows[i].style.display != "none"){
            if(canBeEqual){
                if(prevDecider != table.rows[i].cells[rankDecider].innerHTML){j++;}//rows with same rating get same ranking
            }
            else {j++;}
            table.rows[i].cells[0].innerHTML = j;
            prevDecider = table.rows[i].cells[rankDecider].innerHTML;
        }
    }
}

var publicFilters = document.getElementById("public-filter").children;
var orderFilters = document.getElementById("order-filter").children;
var albumFilters = document.getElementById("album-filter").children;

//public filter selection events
var personalButton_enabled = true;
for (var i = 0; i < publicFilters.length; i++){
    publicFilters[i].addEventListener("click", (function(i){
        return function(){
            if(document.getElementsByClassName("active")[0] != this){ //change only if user clicks on a different element
                if (!personalButton_enabled && this == publicFilters[1]) {return}
                switchPublicFilter(this.textContent);
                setActive(i, 0);
            }
        }
    })(i))
}
//order filter selection events
for (var i = 0; i < orderFilters.length; i++){
    orderFilters[i].addEventListener("click", (function(i){
        return function(){
            switchOrderFilter(this.textContent);
            setActive(i, 1);
        }
    })(i))
}
//album filter selection events
for (var i = 0; i < albumFilters.length; i++){
    albumFilters[i].addEventListener("click", (function(i){
        return function(){
            if(document.getElementsByClassName("active")[2] != this){
                switchAlbumFilter(this.textContent);
                setActive(i, 2);
            }
        }
    })(i))
}

function setActive(filter, row){
    var type;
    if(row == 0){type = publicFilters;}
    else if(row == 1){type = orderFilters;}
    else {type = albumFilters}
    for (var i = 0; i < type.length; i++){
        type[i].classList.remove("active")
    }
    type[filter].classList.add("active")
}

function displayAllSongs(){
    for (var i = 0; i < table.rows.length; i++){
        table.rows[i].style.display = "table-row";
    }
}


function switchAlbumFilter(filterText){
    displayAllSongs();
    if(filterText == "All (without B-Sides)"){
        for (var i = 0; i < table.rows.length; i++){
            if(table.rows[i].cells[2].textContent == 'B-Sides'){
                table.rows[i].style.display = "none";
            }
        }
    }
    else if(filterText != "All (with B-Sides)"){
        for (var i = 0; i < table.rows.length; i++){
          if(table.rows[i].cells[2].textContent != filterText){
              table.rows[i].style.display = "none";
          }
        }
    }
    setRankNumbers();
}


function clearTable(){
    var newTable = document.createElement('tbody');
    table.parentNode.replaceChild(newTable, table);
    table = newTable;
}

//order filter events
function switchOrderFilter(filterText){
    if(filterText == 'Tracklist'){
        canBeEqual = false;
    }
    else {canBeEqual = true;}

    switch (filterText){
        case "Tracklist":
                        clearTable();
                        buildTable();
                        switchAlbumFilter(document.getElementsByClassName("active")[2].textContent); //reapply album filter
                        break;
        case "Rating":  sortTable(3, true);
                        break;
        case "Wins":    sortTable(4, true);
                        break;
        case "Losses":  sortTable(5, true);
                        break;
    }
}

function switchPublicFilter(filterText){
    switch (filterText){
        case 'Global':      switchDisplayedAlbumsObj(albumsGlobal);
                            break;
        case 'Personal':    if(albumsPersonal == undefined){
                                toggleLoadingGif();
                                getPersonalRanks().then(function(result){
                                    albumsPersonal = result;
                                    switchDisplayedAlbumsObj(albumsPersonal);
                                    toggleLoadingGif();
                                }).catch(function(e){ //throw user back to global if no personal records found
                                    personalButton_enabled = false;
                                    publicFilters[0].classList.remove('disabled');
                                    setActive(0, 0);
                                    publicFilters[1].classList.add('disabled');
                                    toggleLoadingGif();
                                });
                            }
                            else {
                                switchDisplayedAlbumsObj(albumsPersonal);
                            }
                            break;
    }
}

function switchDisplayedAlbumsObj(albumsObj){
    albums = albumsObj;
    reapplyFilters();
    enablePublicFilterButtons();
}

//adjustments for mobile and smaller resolutions
if (window.matchMedia('(max-device-width: 1080px)').matches) {
    var tableHead = document.getElementById("tableHead");
    tableHead.children[0].textContent = "#";
    tableHead.children[4].textContent = "W";
    tableHead.children[5].textContent = "L";
}

//run on start
toggleLoadingGif();
getGlobalRanks().then(function(result){
    albumsGlobal = result;
    switchDisplayedAlbumsObj(albumsGlobal);
    toggleLoadingGif();
});
