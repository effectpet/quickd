'use strict';

require('dotenv').config();

const Discord = require('discord.js');
const performance = require('perf_hooks').performance;

const PREFIX = '!qd';
const NEWLINE = '\n';
const CHARS = "ABCDEFGHiJKLMNOPQRSTUVWXYZ";
const DEFAULT_SPEED = 4000;
const DEFAULT_LENGTH = 1;
const TIMEOUT_SLEEP = 3000;

const GameModeEnum = {
	SPEED: 'speed',
	LENGTH: 'length'
};

const GameStateEnum = {
	STARTING: 'starting',
	RUNNING: 'running',
	NOTRUNNING: 'notrunning'
};

module.exports = class App {

	constructor() {
		let self = this;
		
		this.client = new Discord.Client();
		this.client.on('ready', function () {
			self.onDiscordReady();
		});
		this.client.on('message', function (message) {
			self.onDiscordMessage(message);
		});
		
		this.gameMode = GameModeEnum.SPEED;
		
		this.reset();
	}

	run() {
		this.client.login(process.env.TOKEN);
	}

	reset() {
		if (this.sleepTimeout !== null) {
			clearTimeout(this.sleepTimeout);
			this.sleepTimeout = null;
		}
		this.gameState = GameStateEnum.NOTRUNNING;
		this.players = {};
		this.resetCurrent();
	}

	resetCurrent() {
		this.currentPlayers = [];
		this.currentPlayer = null;
		this.currentString = null;
		this.currentSpeed = DEFAULT_SPEED;
		this.currentLength = DEFAULT_LENGTH;
		this.currentChannel = null;
		this.currentStartSpeed = null;
	}

	onDiscordReady() {
		// Discord bot is ready
	}

	onDiscordMessage(message) {
		if (message.author.bot) {
			return;
		}

		if (message.content.startsWith(PREFIX) === false) {
			if (this.currentPlayer !== null && message.author.id === this.currentPlayer.id) {
				this.checkSpeedInput(message);
			}
			return;
		}

		let args = message.content.slice(PREFIX.length + 1).split(' ');
		let command = args[0];

		switch (command) {
			case 'add':
				this.onAdd(message);
				break;
			case 'remove':
				this.onRemove(message);
				break;
			case 'start':
				this.onStart(message);
				break;
			case 'stop':
				this.onStop(message);
				break;
			case 'setgm':
				this.onSetGameMode(message, args);
				break;
			default:
				message.channel.send(`Unbekannter Befehl`);
		}
	}

	getPlayersAsString() {
		return (Object.values(this.players).map(function (p) { return `${ p.username }`; })).join(', ');
	}

	checkSpeedInput(message) {
		let currentEndSpeed = performance.now();
		let timeNeeded = currentEndSpeed - this.currentStartSpeed;
		let messageClean = message.content.toLowerCase().replace(/\s+/g, '');

		if (timeNeeded > this.currentSpeed) {
			this.currentChannel.send(`${ this.currentPlayer.username } war zu langsam! (${ timeNeeded.toFixed(2) }ms)`);
			delete this.players[message.author.id];
		} else if (messageClean !== this.currentString.toLowerCase()) {
			this.currentChannel.send(`${ this.currentPlayer.username } machte eine falsche Eingabe!`);
			delete this.players[message.author.id];
		} else {
			this.currentChannel.send(`${ this.currentPlayer.username } hat es geschafft! (${ timeNeeded.toFixed(2) }ms)`);
		}

		this.callNext();
	}

	callNext() {
		let playersAlive = Object.values(this.players);

		// Check if more than one player is alive
		if (playersAlive.length === 1) {
			this.currentChannel.send(`${ playersAlive[0].username } hat gewonnen!`);
			this.reset();
			return;
		} else if (playersAlive.length === 0) {
			this.reset();
			return;
		}

		// Check if all players played a round
		if (this.currentPlayers.length === 0) {
			this.currentPlayers = playersAlive;

			if (this.gameState === GameStateEnum.RUNNING) {
				if (this.gameMode === GameModeEnum.SPEED) {
					if (this.currentSpeed <= 300) {
						this.currentSpeed -= 20;
					} else if (this.currentSpeed <= 1000) {
						this.currentSpeed -= 100;
					} else {
						this.currentSpeed -= 200;
					}
				} else if (this.gameMode === GameModeEnum.LENGTH) {
					this.currentLength += 1;
				}
			}
			this.gameState = GameStateEnum.RUNNING;

			// Send new round info
			this.currentChannel.send(
				`Neue Runde. Geschwindigkeit: ${ this.currentSpeed }ms` + NEWLINE +
				`Folgende Spieler nehmen teil: ${ this.getPlayersAsString() }` + NEWLINE +
				`Aktueller Spielmodus: ${ this.gameMode }`
			);
		}

		let self = this;
		this.sleepTimeout = setTimeout(function () {
			// Create new message
			self.currentString = '';
			for (let i = 0; i < self.currentLength; i++) {
				self.currentString += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
			}

			// Get random player & send new message
			self.currentPlayer = self.currentPlayers.splice(Math.floor(Math.random() * self.currentPlayers.length), 1)[0];
			self.currentChannel.send(`${ self.currentPlayer.username }: **${ self.currentString }**`);
			self.currentStartSpeed = performance.now();
		}, TIMEOUT_SLEEP);
	}

	onAdd(message) {
		if (this.gameState !== GameStateEnum.NOTRUNNING) {
			message.channel.send(`Es ist bereits ein Spiel aktiv`);
			return;
		}

		this.players[message.author.id] = message.author;

		// Send info to channel
		message.channel.send(
			`${ message.author.username } wurde zum Spiel hinzugefügt.` + NEWLINE +
			`Folgende Spieler nehmen teil: ${ this.getPlayersAsString() }` + NEWLINE +
			`Aktueller Spielmodus: ${ this.gameMode }`
		);
	}

	onRemove(message) {
		if (this.gameState !== GameStateEnum.NOTRUNNING) {
			message.channel.send(`Das Spiel muss zuerst beendet werden`);
			return;
		}

		delete this.players[message.author.id];

		// Send info to channel
		message.channel.send(
			`${ message.author.username } wurde vom Spiel entfernt.` + NEWLINE +
			`Folgende Spieler nehmen teil: ${ this.getPlayersAsString() }` + NEWLINE +
			`Aktueller Spielmodus: ${ this.gameMode }`
		);
	}

	onStart(message) {
		// Check if a game is already running
		if (this.gameState !== GameStateEnum.NOTRUNNING) {
			message.channel.send(`Es ist bereits ein Spiel aktiv`);
			return;
		}

		// Check if at least 2 players are available
		if (Object.keys(this.players).length < 2) {
			message.channel.send(`Es müssen mindestens zwei Spieler mitmachen!`);
			return;
		}

		this.resetCurrent();

		this.gameState = GameStateEnum.STARTING;
		this.currentChannel = message.channel;

		message.channel.send(`Neues Spiel gestartet von ${ message.author.username }`);
		this.callNext();
	}

	onStop(message) {
		// Check if no game is running
		if (this.gameState === GameStateEnum.NOTRUNNING) {
			message.channel.send(`Es ist kein Spiel aktiv`);
			return;
		}

		message.channel.send(`Spiel beendet von ${message.author.username}`);
		this.reset();
	}

	onSetGameMode(message, args) {
		// Check if a game is already running
		if (this.gameState !== GameStateEnum.NOTRUNNING) {
			message.channel.send(`Es ist bereits ein Spiel aktiv`);
			return;
		}

		if (args.length >= 2 && Object.values(GameModeEnum).indexOf(args[1]) > -1) {
			this.gameMode = args[1];
			message.channel.send(`Der Spielmodus wurde angepasst auf ${ this.gameMode }`);
			return;
		}

		message.channel.send(`Der Spielmodus wurde nicht gefunden`);
	}

}
