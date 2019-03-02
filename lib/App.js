'use strict';

require('dotenv').config();

const Discord = require('discord.js');
const performance = require('perf_hooks').performance;

const RandomGenerator = require('./RandomGenerator');
const Markdown = require('./Markdown');
const Command = require('./Command');
const Config = require('./Config');

const NEWLINE = '\n';
const DEFAULT_SPEED = 4000;
const DEFAULT_LENGTH = 1;
const TIMEOUT_SLEEP = 3000;

const USE_HELP_COMMAND = `Benutz \`${ Config.getPrefix() } help\` für weitere Informationen`;

const GameModeEnum = {
	SPEED: 'speed',
	LENGTH: 'length'
};

const GameStateEnum = {
	STARTING: 'starting',
	RUNNING: 'running',
	NOT_RUNNING: 'not_running'
};

module.exports = class App {

	constructor() {
		this.client = new Discord.Client();
		this.client.on('ready', this.onDiscordReady.bind(this));
		this.client.on('message', this.onDiscordMessage.bind(this));
		
		this.gameMode = GameModeEnum.SPEED;

		this.commands = [
			new Command('add', '', 'Add yourself to a game', this.onAdd),
			new Command('remove', '', 'Remove yourself from the game', this.onRemove),
			new Command('start', '', 'Starts a new game with current gamemode', this.onStart),
			new Command('stop', '', 'Stops the current game', this.onStop),
			new Command('setgm', '<gamemode>', 'Changes the gamemode. Available options are: `speed` and `length`', this.onSetGameMode),
			new Command('help', '', 'Shows an overview over all commands', this.onHelp),
		];
		this.randomGenerator = new RandomGenerator();
		this.markdown = new Markdown();
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
		this.gameState = GameStateEnum.NOT_RUNNING;
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
		console.info("Discord bot is ready")
	};

	onDiscordMessage(message) {
		if (message.author.bot) {
			return;
		}

		if (message.content.startsWith(Config.getPrefix()) === false) {
			this.onUnprefixedMessage(message);
		} else {
			this.onBotCommandMessage(message);
		}
	}

	/**
	 * Called if a message does not contain the defined PREFIX
	 */
	onUnprefixedMessage(message) {
		if (this.currentPlayer !== null && message.author.id === this.currentPlayer.id) {
			this.checkSpeedInput(message);
		}
	}

	/**
	 * Called if a message contains the defined PREFIX
	 */
	onBotCommandMessage(message) {
		let args = message.content.slice(Config.getPrefix().length + 1).split(' ');
		let commandName = args[0];
		
		let command = this.commands.find(command => command.name === commandName);
		if (!command) {
			message.channel.send(`Unbekannter Befehl: ${ this.markdown.markdownCode(commandName) } mit den Argumenten: ${ this.markdown.markdownCode(args.join(' ')) }! ${ USE_HELP_COMMAND }`);
			return;
		}
		command.functionToCall.bind(this)(message, args);
	}

	getPlayersAsString() {
		return Object.values(this.players).map((player) => player.username).join(', ');
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
			self.currentString = this.randomGenerator.getRandomString(self.currentLength);

			// Get random player & send new message
			self.currentPlayer = self.currentPlayers.splice(Math.floor(Math.random() * self.currentPlayers.length), 1)[0];
			self.currentChannel.send(`${ self.currentPlayer.username }: **${ self.currentString }**`);
			self.currentStartSpeed = performance.now();
		}, TIMEOUT_SLEEP);
	}

	onAdd(message) {
		if (this.gameState !== GameStateEnum.NOT_RUNNING) {
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
		if (this.gameState !== GameStateEnum.NOT_RUNNING) {
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
		if (this.gameState !== GameStateEnum.NOT_RUNNING) {
			message.channel.send(`Es ist bereits ein Spiel aktiv`);
			return;
		}

		// Check if at least 2 players are available
		if (Object.keys(this.players).length < 2) {
			message.channel.send(
				`Es müssen mindestens zwei Spieler mitmachen!` + NEWLINE + 
				`Spieler: ${ this.getPlayersAsString() }`);
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
		if (this.gameState === GameStateEnum.NOT_RUNNING) {
			message.channel.send(`Es ist kein Spiel aktiv`);
			return;
		}

		message.channel.send(`Spiel beendet von ${message.author.username}`);
		this.reset();
	}

	/**
	 * @param {any} message 
	 * @param {string[]} args 
	 */
	onSetGameMode(message, args) {
		// Check if a game is already running
		if (this.gameState !== GameStateEnum.NOT_RUNNING) {
			message.channel.send(`Es ist bereits ein Spiel aktiv`);
			return;
		}

		if (args.length < 2) {
			message.channel.send(`Falsche Anzahl an Argumenten! ${ USE_HELP_COMMAND }`);
			return;
		}

		let newGameMode = args[1];

		if (Object.values(GameModeEnum).indexOf(newGameMode) === -1) {
			message.channel.send(`Der Spielmodus **${ newGameMode }** wurde nicht gefunden! ${ USE_HELP_COMMAND }`);
			return;
		}

		this.gameMode = newGameMode;
		message.channel.send(`Der Spielmodus wurde angepasst auf ${ this.gameMode }`);
	}

	onHelp(message) {
		message.channel.send(`Available commands: ${NEWLINE}${ this.commands.join(NEWLINE) }`);
	}
}
