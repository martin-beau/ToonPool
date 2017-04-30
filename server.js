var express = require('express');
var app = express();
var http = require('http').Server(app);
var players = require('./data/players');
var result_file_path = './data/results.json';
var teams = require('./data/teams');
var ejs = require('ejs');
var fs = require('fs');
var port = 8080;

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/views/img'));

var getResults = function() {
    fs.readFile(result_file_path, function(err, data) {
        if (err) throw err;

        results = JSON.parse(data);
    });
};
getResults();

fs.watchFile(result_file_path, function(){
    getResults();
});

app.get('/pool2017', function (req, res) {
    //Setup pool points
    points = { 'rounds': [1, 2, 3, 4] };

    round1Finished = results[2017].rounds[0].wc.length + results[2017].rounds[0].ec.length === 8;
    round2Finished = results[2017].rounds[1].wc.length + results[2017].rounds[1].ec.length === 4;
    round3Finished = results[2017].rounds[2].wc.length + results[2017].rounds[2].ec.length === 2;

    //Determine the current round
    if (!round1Finished) {
        currentRound = 0;
    }
    else if (!round2Finished) {
        currentRound = 1;
    }
    else if (!round3Finished) {
        currentRound = 2;
    }
    else {
        currentRound = 3;
    }
    // console.log('current round is ' + currentRound);
    // console.log('current point for round is ' + points.rounds[currentRound]);

    getPlayerPoints = function (player) {
        currentPoints = 0;
        conferences = ['wc', 'ec'];
        // console.log(player.name);
        var i = 0;  //selection
        var j = 0;  //conference
        var k = 0;  //round
        var winningPicks = [];
        
        for (k = 0; k <= currentRound; k++) {
            // console.log('Round ' + k);
            if (k === 3) {
                //Playoff final
                // console.log('player picked ' + player.winner);
                winningPicks.push({"round": "Winner", "selection":[]});
                if (results[2017].winner === player.winner) {
                    currentPoints += points.rounds[k];
                    winningPicks[k].selection.push({"team": teams[2017][selectedTeam], "point": points.rounds[k]});
                    // console.log('player gets ' + points.rounds[k] + ' point(s)');
                }
                else {
                    winningPicks[k].selection.push({"team": teams[2017][selectedTeam], "point": 0});
                }
            } 
            else {
                winningPicks.push({"round": "Round " + (k+1).toString(), "selection":[]});
                for (j = 0; j < conferences.length; j++) {
                    conference = conferences[j];
                    // console.log('checking points for conference ' + conference);

                    for (i = 0; i < player.rounds[k][conference].length; i++) {
                        selectedTeam = player.rounds[k][conference][i];
                        // console.log('player picked ' + selectedTeam);

                        if (results[2017].rounds[k][conference].indexOf(selectedTeam) > -1) {
                            currentPoints += points.rounds[k];
                            winningPicks[k].selection.push({"team": teams[2017][selectedTeam], "point": points.rounds[k]});
                            // console.log('player gets ' + points.rounds[k] + ' point(s)');
                        }
                        else {          
                            winningPicks[k].selection.push({"team": teams[2017][selectedTeam], "point": 0});
                        }
                    }
                }
            }
        }
        
                
        player.points = currentPoints;
        player.winningPicks = winningPicks;
        //console.log('TOTAL POINTS: ' + player.points);
    };

    players.forEach(getPlayerPoints);

    var compare = function (a, b) {
        if (a.points < b.points) {
            return -1;
        }
        if (a.points > b.points) {
            return 1;
        }
        return 0;
    };
    players.sort(compare);

    res.render('results', {'players': players});
    // res.send(getDisplay());

});

app.get('/', function (req, res) {
    res.send("/pool2017");
    // res.sendFile(__dirname + '/index.html');
});

http.listen(port, function () {
    console.log('listening on *:'+port);
});

