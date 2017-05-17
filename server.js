var express = require('express'),
    http = require('http');

var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);
var jQuery = require('jquery');
var wordList = require('word-list-json');

app.use(express.static(__dirname + '/public'));

server.listen(3000, function(){
    console.log('listening on *:3000');
});

io.on('connection', function (socket) {
    var player = socket.id;
    var playerName = "";

    socket.emit('start', {"player": player});
    socket.on('newWord', function () {
        var word = getRandomWord();
        io.emit('currentWord', word);
        console.log('Selected word: %s', word);
    });

    socket.on('winner', function (data) {
        if (data.player != "") {
            console.log('Winner is: %s', data.player);
            io.emit('displayRoundWinner', {'word': data.word, 'winner': data.player});
        }
    });

    socket.on('updatePlayerList', function () {
        io.emit('addPlayer', {'id': player, 'name': playerName});
    });

    socket.on('setPlayerName', function (data) {
        playerName = data.playerName;

        var numberOfConnections = Object.keys(io.sockets.sockets).length;
        if (numberOfConnections != 1 && playerName != "") {
            io.emit('startGame');
        }
    });

    socket.on('disconnect', function () {
        console.log("Player disconnected");
        io.emit('disconnectedPlayer');
    });
});

(function(e) {
    e.rand = function(arg) {
        if (Array.isArray(arg)) {
            return arg[e.rand(arg.length)];
        } else if (typeof arg === "number") {
            return Math.floor(Math.random() * arg);
        } else {
            return 4;
        }
    };
})(jQuery);

var getRandomWord = function() {
    var shortWordList = wordList.filter(function (e) {
        return e.length > 5 && e.length < 16;
    });
    return jQuery.rand(shortWordList);
};