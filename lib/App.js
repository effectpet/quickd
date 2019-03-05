'use strict';

const Discord = require('discord.js');

const RandomGenerator = require('./RandomGenerator');
const Markdown = require('./Markdown');
const Command = require('./Command');
const Config = require('./Config');
const Translation = require('./Translation');

const NEWLINE = '\n';
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
	NOT_RUNNING: 'not_running'
};

module.exports = class App {

	constructor() {
		this.randomGenerator = new RandomGenerator();
		this.markdown = new Markdown();
		this.translation = new Translation(Config.getLanguage());

		this.client = new Discord.Client();
		this.client.on('ready', this.onDiscordReady.bind(this));
		this.client.on('message', this.onDiscordMessage.bind(this));

		this.gameMode = GameModeEnum.SPEED;

		this.commands = [
			new Command('add', '', this.translation.t('command.add.description'), this.onAdd),
			new Command('remove', '', this.translation.t('command.remove.description'), this.onRemove),
			new Command('start', '', this.translation.t('command.start.description'), this.onStart),
			new Command('stop', '', this.translation.t('command.stop.description'), this.onStop),
			new Command('setgm', this.translation.t('command.setgm.gamemode'), this.translation.t('command.setgm.description'), this.onSetGameMode),
			new Command('help', '', this.translation.t('command.help.description'), this.onHelp),
		];
		this.reset();
	}

	run() {
		this.client.login(Config.getToken());
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
		this.lastMessageOfBot = null;
	}

	onDiscordReady() {
		console.info("Discord bot is ready");
	}

	onDiscordMessage(message) {
		if (this.isMessageSendByThisBot(message)) {
			this.lastMessageOfBot = message;
			return;
		}
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

		let command = this.commands.find((command) => command.name === commandName);
		if (typeof command === 'undefined') {
			message.channel.send(this.translation.f('error.unknownCommand', {
				commandName: this.markdown.markdownCode(commandName),
				arguments: this.markdown.markdownCode(args.join(' ')),
				helpCommandInformation: this.getHelpCommandInformation()
			}));
			return;
		}
		command.functionToCall.bind(this)(message, args);
	}

	isMessageSendByThisBot(message) {
		return message.author.id === this.client.user.id;
	}

	getPlayersAsString() {
		return Object.values(this.players).map((player) => player.username).join(', ');
	}

	checkSpeedInput(message) {
		let timeNeeded = message.createdAt.getTime() - this.lastMessageOfBot.createdAt.getTime();

		let messageClean = this.getCleanMessageContent(message);

		if (timeNeeded > this.currentSpeed) {
			this.currentChannel.send(this.translation.f('game.toSlow', {
				username: this.currentPlayer.username,
				timeNeeded: timeNeeded.toFixed(2)
			}));
			delete this.players[message.author.id];
		} else if (messageClean !== this.currentString.toLowerCase()) {
			this.currentChannel.send(this.translation.f('game.wrongInput', {
				username: this.currentPlayer.username
			}));
			delete this.players[message.author.id];
		} else {
			this.currentChannel.send(this.translation.f('game.userMadeIt', {
				username: this.currentPlayer.username,
				timeNeeded: timeNeeded.toFixed(2)
			}));
		}

		this.callNext();
	}

	getCleanMessageContent(message) {
		return message.content.toLowerCase().replace(/\s+/g, '');
	}

	callNext() {
		let playersAlive = Object.values(this.players);

		// Check if more than one player is alive
		if (playersAlive.length === 1) {
			this.currentChannel.send(this.translation.f('game.win', {username: playersAlive[0].username}));
			this.reset();
			return;
		} else if (playersAlive.length === 0) {
			this.reset();
			return;
		}

		// Check if all players played a round
		if (this.currentPlayers.length === 0) {
			this.gameNewRound(playersAlive);
		}

		this.sleepTimeout = setTimeout( () => {
			// Create new message
			this.currentString = this.randomGenerator.getRandomString(this.currentLength);

			// Get random player & send new message
			this.currentPlayer = this.currentPlayers.splice(Math.floor(Math.random() * this.currentPlayers.length), 1)[0];
			this.currentChannel.send(`${this.currentPlayer.username}: **${this.currentString}**`);
		}, TIMEOUT_SLEEP);
	}

	gameNewRound(playersAlive) {
		this.currentPlayers = playersAlive;

		// Check if game has already been startet
		if (this.gameState === GameStateEnum.RUNNING) {
			if (this.gameMode === GameModeEnum.SPEED) {
				this.gameAddSpeed();
			} else if (this.gameMode === GameModeEnum.LENGTH) {
				this.gameAddLength();
			}
		}
		this.gameState = GameStateEnum.RUNNING;

		// Send new round info
		this.currentChannel.send(this.translation.f('game.newRound', {currentSpeed: this.currentSpeed}) + NEWLINE + this.getCurrentInfo());
	}

	gameAddSpeed() {
		if (this.currentSpeed <= 300) {
			this.currentSpeed -= 20;
		} else if (this.currentSpeed <= 1000) {
			this.currentSpeed -= 100;
		} else {
			this.currentSpeed -= 200;
		}
	}

	gameAddLength() {
		this.currentLength += 1;
	}

	onAdd(message) {
		if (this.gameState !== GameStateEnum.NOT_RUNNING) {
			message.channel.send(this.translation.t('error.gameAlreadyRunning'));
			return;
		}

		this.players[message.author.id] = message.author;

		// Send info to channel
		message.channel.send(
			this.translation.f('command.add.addPlayer', {username: message.author.username}) + NEWLINE + this.getCurrentInfo()
		);
	}

	onRemove(message) {
		if (this.gameState !== GameStateEnum.NOT_RUNNING) {
			message.channel.send(this.translation.t('error.gameNeedsToBeFinished'));
			return;
		}

		delete this.players[message.author.id];

		// Send info to channel
		message.channel.send(
			this.translation.f('command.remove.removePlayer', {username: message.author.username}) + NEWLINE + this.getCurrentInfo()
		);
	}

	getCurrentInfo() {
		return this.translation.f('game.info', {
			players: this.getPlayersAsString(),
			gameMode: this.gameMode
		});
	}

	onStart(message) {
		// Check if a game is already running
		if (this.gameState !== GameStateEnum.NOT_RUNNING) {
			message.channel.send(this.translation.t('error.gameAlreadyRunning'));
			return;
		}

		// Check if at least 2 players are available
		if (Object.keys(this.players).length < 2) {
			message.channel.send(this.translation.f('error.twoPlayersRequired', {
				players: this.getPlayersAsString()
			}));
			return;
		}

		this.resetCurrent();

		this.gameState = GameStateEnum.STARTING;
		this.currentChannel = message.channel;

		message.channel.send(this.translation.f('game.gameStared', {username: message.author.username}));
		this.callNext();
	}

	onStop(message) {
		// Check if no game is running
		if (this.gameState === GameStateEnum.NOT_RUNNING) {
			message.channel.send(this.translation.t('error.noGameActive'));
			return;
		}

		message.channel.send(this.translation.f('game.gameStopped', {username: message.author.username}));
		this.reset();
	}

	/**
	 * @param {any} message 
	 * @param {string[]} args 
	 */
	onSetGameMode(message, args) {
		// Check if a game is already running
		if (this.gameState !== GameStateEnum.NOT_RUNNING) {
			message.channel.send(this.translation.t('error.gameAlreadyRunning'));
			return;
		}

		if (args.length < 2) {
			message.channel.send(this.translation.t('command.wrongCountOfArguments') + this.getHelpCommandInformation());
			return;
		}

		let newGameMode = args[1];

		if (Object.values(GameModeEnum).indexOf(newGameMode) === -1) {
			message.channel.send(this.translation.f('command.setgm.wrongGamemode', {
				newGameMode: newGameMode, 
				helpCommandInformation: this.getHelpCommandInformation()
			}));
			return;
		}

		this.gameMode = newGameMode;
		message.channel.send(this.translation.f('command.setgm.gamemodeChangedTo', {gameMode: this.gameMode}));
	}

	onHelp(message) {
		message.channel.send(this.translation.t('command.help.availableCommands') + NEWLINE + this.commands.join(NEWLINE));
	}

	getHelpCommandInformation() {
		return this.translation.f('command.generalHelp', {prefix: Config.getPrefix()});
	}
};
