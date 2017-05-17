'use strict';

var app = angular.module('typonaut', []);

app.factory('socket', ['$rootScope', function ($rootScope) {
    var socket = io.connect();
    return {
        on: function (eventName, callback) {
            function wrapper() {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            }
            socket.on(eventName, wrapper);
            return function () {
                socket.removeListener(eventName, wrapper);
            };
        },

        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if(callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
}]);

app.controller('AppController', function($scope, $timeout, socket) {
    $scope.player = "";
    var players = {};
    var mytimeout;
    $scope.scoreBoard = [];
    $scope.randomWord = "";
    $scope.lastWord = "";
    $scope.wordBeingTyped = "";
    $scope.playerName = "";
    $scope.otherPlayerName = "";
    $scope.currentView = 1;
    $scope.counter = 5;

    socket.on('start', function(data){
        $scope.player = data.player;
        socket.emit('newWord');
    });

    socket.on('currentWord', function (word) {
        $scope.randomWord = word;
        $scope.wordBeingTyped = "";
    });

    socket.on('addPlayer', function (data) {
        var wait = false;
        if (data.name == "") {
            wait = true;
        } else {
            players[data.id] = data.name;
            if(Object.keys(players).length < 2) {
                wait = true;
            }
        }
        if(!wait) startGame();
    });

    socket.on('startGame', function () {
        socket.emit('updatePlayerList');
    });

    socket.on('displayRoundWinner', function (data) {
        if (data.word != "") {
            if (data.winner === $scope.player) displaySnackBar(true);
            else displaySnackBar(false);
            $scope.scoreBoard.push({'word': data.word, 'winnerName': players[data.winner], 'winnerId': data.winner});
        }
    });

    socket.on('disconnectedPlayer', function () {
        $scope.currentView = 5;
    });

    $scope.$watch('wordBeingTyped', function () {
        if($scope.wordBeingTyped.toUpperCase() === $scope.randomWord.toUpperCase()){
            socket.emit('winner', {'player': $scope.player, 'word': $scope.randomWord});
            socket.emit('newWord');
        }
    });

    $scope.setPlayerName = function () {
      $scope.currentView = 2;
      socket.emit('setPlayerName', {"playerId": $scope.player, "playerName": $scope.playerName});
    };

    $scope.isCurrentView = function(view) {
        if(view === $scope.currentView) {
            return true;
        }
    };

    $scope.scoreBoardEmpty = function () {
        return $scope.scoreBoard.length == 0;
    };

    $scope.getRowClass = function (id) {
        if (id == $scope.player) {
            return 'success';
        } else return 'danger';
    };

    $scope.onTimeout = function () {
        if ($scope.counter > 0) {
            $scope.counter--;
            mytimeout = $timeout($scope.onTimeout, 1000);
        } else {
            $scope.counter = 5;
            $scope.currentView = 4;
        }
    };

    var startGame = function () {
        Object.keys(players).forEach(function (key) {
            if(key != $scope.player) {
                $scope.otherPlayerName = players[key];
            }
        });
        $scope.currentView = 3;
        mytimeout = $timeout($scope.onTimeout, 1000);
        $scope.scoreBoard = [];
    };
});

app.filter('highlight', function($sce) {
    return function(text, phrase) {
        if (phrase) text = text.replace(new RegExp('^('+phrase+')', 'gi'),
            '<span class="highlighted">$1</span>');
        return $sce.trustAsHtml(text);
    }
});