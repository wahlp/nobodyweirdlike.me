var socket = io();

socket.on('connect', function(data) {
    console.log('connected to server');
});

var globalLeft = document.getElementById('global-left');
var globalRight = document.getElementById('global-right');
var globalTotal = document.getElementById('global-votes');

socket.on('update_global', function(data) {
    updateGlobalStats(data);
    updateUserContribution();
});

function updateGlobalStats(data){
    if (globalLeft.textContent != data.left){
        globalLeft.textContent = data.left;
        fade(globalLeft.parentNode);
    }
    if (globalRight.textContent != data.right){
        globalRight.textContent = data.right;
        fade(globalRight.parentNode);
    }
    globalTotal.textContent = data.left + data.right;
}

var personalLeft = document.getElementById('personal-left');
var personalRight = document.getElementById('personal-right');
var personalTotal = document.getElementById('personal-votes');

socket.on('update_personal', function(data) {
    updatePersonalStats(data);
    updateUserContribution();
});

function updatePersonalStats(data){
    if (personalLeft.textContent != data.left){
        personalLeft.textContent = data.left;
        fade(personalLeft.parentNode);
    }
    if (personalRight.textContent != data.right){
        personalRight.textContent = data.right;
        fade(personalRight.parentNode);
    }
    personalTotal.textContent = data.left + data.right;
}

function fade(obj){
    obj.classList.remove("fading");
    setTimeout(function(){
        obj.classList.add("fading");
    }, 1);
}

function fadeText(obj){
    obj.classList.remove("fading-text");
    setTimeout(function(){
        obj.classList.add("fading-text");
    }, 1);
}

var contributionTotal = document.getElementById('contribution-total');
var contributionLeft = document.getElementById('contribution-left');
var contributionRight = document.getElementById('contribution-right');
function updateUserContribution(fade){
    if(typeof fade === 'undefined'){fade = true;}
    var total = round(personalTotal.textContent / globalTotal.textContent * 100, 3);
    if(total != contributionTotal.textContent || total == 0){
        contributionTotal.textContent = total;
        if(fade){ fadeText(contributionTotal); }
    }
    var left = round(personalLeft.textContent / globalLeft.textContent * 100, 3);
    if(left != contributionLeft.textContent || left == 0){
        contributionLeft.textContent = left;
        if(fade){ fadeText(contributionLeft); }
    }
    var right = round(personalRight.textContent / globalRight.textContent * 100, 3);
    if(right != contributionRight.textContent || right == 0){
        contributionRight.textContent = right;
        if(fade){ fadeText(contributionRight); }
    }
}

var userCount = document.getElementById('user-count');
socket.on('update_user_count', function(data) {
    userCount.textContent = data.count;
});

function toTitleCase(str){
    return str.replace(/(^([a-zA-Z\p{M}]))|([ -][a-zA-Z\p{M}])/g,
    function(firstLetter){
        return firstLetter.toUpperCase();
    });
}

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

var table = document.getElementsByTagName("tbody")[0];

function buildTable(albumStats){
    var i = 0;
    for (item in albumStats){
        var row = table.insertRow();
        row.style.backgroundImage = 'url("images/'+albumStats[item].album+'.jpg")';
        i++;
        row.insertCell(0).textContent = i;
        row.insertCell(1).textContent = toTitleCase(albumStats[item].album);
        row.insertCell(2).textContent = round(albumStats[item].rating, 2);
        row.insertCell(3).textContent = albumStats[item].wins;
        row.insertCell(4).textContent = albumStats[item].losses;
    }
}

const chrono = ["B-Sides", "Self Titled", "Freaky Styley", "The Uplift Mofo Party Plan", "Mother's Milk", "Blood Sugar Sex Magik", "One Hot Minute", "Californication", "By The Way", "Stadium Arcadium", "I'm With You", "I'm Beside You", "The Getaway"]

function orderAlbumsByDate(reverse){
    var tb = table, // use `<tbody>` to ignore `<thead>` and `<tfoot>` rows
        tr = Array.prototype.slice.call(tb.rows, 0), // put rows into array
        i;
    reverse = -((+reverse) || -1);
    tr = tr.sort(function (a, b) { // sort rows
        return reverse
            * (chrono.indexOf(a.cells[1].textContent.trim()) < chrono.indexOf(b.cells[1].textContent.trim()) ? -1 : 1);
    });
    for(i = 0; i < tr.length; ++i) tb.appendChild(tr[i]);
    setRankNumbers();
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
    var j = 0, prevDecider = 0.1;
    if (typeof rankDecider === 'undefined') {
        for (var i = 0; i < table.rows.length; i++){
            j++;
            table.rows[i].cells[0].innerHTML = j;
        }
    }
    else
        for (var i = 0; i < table.rows.length; i++){
            if(canBeEqual){
                if(prevDecider != table.rows[i].cells[rankDecider].innerHTML){j++;}//rows with same rating get same ranking
            }
            else {j++;}
            table.rows[i].cells[0].innerHTML = j;
            prevDecider = table.rows[i].cells[rankDecider].innerHTML;
        }
}

var tableHeaders = document.getElementById('tableHead').children;

var lastSort = 1;
for (var i = 1; i < tableHeaders.length; i++){ //start at 1 since sorting by rank is not a thing
    tableHeaders[i].addEventListener("click", (function(i){
        return function(){
            if(i != lastSort){
                resetDirection();
            }
            lastSort = i;
            switchSorting(i)
        }
    })(i))
}

function resetDirection(){
    for (var i = 1; i < tableHeaders.length; i++){
        tableHeaders[i].style.backgroundColor = '';
    }
    dir = [true, true, true, true];
}

var dir = [true, true, true, true];
function switchSorting(col){
    switch(col){
        case 1: orderAlbumsByDate(dir[0]);
                toggleDirection(1);
                break;
        case 2: sortTable(2, dir[1]);
                toggleDirection(2);
                break;
        case 3: sortTable(3, dir[2]);
                toggleDirection(3);
                break;
        case 4: sortTable(4, dir[3]);
                toggleDirection(4);
                break;
    }
}

function toggleDirection(col){
    dir[col-1] = !dir[col-1];
    if(!dir[col-1]){
        tableHeaders[col].style.backgroundColor = 'rgba(180, 0, 0, 0.5)';
    }
    else {
        tableHeaders[col].style.backgroundColor = 'rgba(0, 0, 180, 0.4)';
    }
}

function getAlbumStats(){
    return new Promise(function(resolve,reject){
        var xhr = new XMLHttpRequest();
        xhr.open('POST',"/stats", true);
        xhr.send();
        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4 && xhr.status == 200) {
                resolve(JSON.parse(xhr.responseText));
            }
        }
    });
}

updateUserContribution(false);
getAlbumStats().then(function(albumStats){
    buildTable(albumStats);
    switchSorting(1);
});

//adjustments for mobile and smaller resolutions
if (window.matchMedia('(max-device-width: 1080px)').matches) {
    var tableHead = document.getElementById("tableHead");
    tableHead.children[0].textContent = "#";
}
