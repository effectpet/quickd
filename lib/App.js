const Discord = require('discord.js');
const EPLogger = require('eplogger');
const EPTranslation = require('eptranslation');

const Game = require('./Game');
const Markdown = require('./Markdown');
const Command = require('./Command');
const GameModeEnum = require('./GameModeEnum');

const PREFIX = '!qd';
const NEWLINE = '\n';

module.exports = class App {

	constructor() {
		this.logger = new EPLogger();

		this.markdown = new Markdown();
		this.translation = new EPTranslation();

		this.game = null;
		this.players = {};
		this.gameMode = GameModeEnum.SPEED;

		this.commands = [
			new Command(PREFIX, 'add', '', this.translation.t('command.add.description'), this.onAdd),
			new Command(PREFIX, 'remove', '', this.translation.t('command.remove.description'), this.onRemove),
			new Command(PREFIX, 'start', '', this.translation.t('command.start.description'), this.onStart),
			new Command(PREFIX, 'stop', '', this.translation.t('command.stop.description'), this.onStop),
			new Command(PREFIX, 'setgm', this.translation.t('command.setgm.gamemode'), this.translation.t('command.setgm.description'), this.onSetGameMode),
			new Command(PREFIX, 'help', '', this.translation.t('command.help.description'), this.onHelp),
		];
	}

	/**
	 * Initializes and starts the discord client
	 * @param {string} discordToken
	 */
	run(discordToken) {
		this.client = new Discord.Client();
		this.client.on('ready', this.onDiscordReady.bind(this));
		this.client.on('message', this.onDiscordMessage.bind(this));

		this.client.login(discordToken);
	}

	onDiscordReady() {
		this.logger.info('Discord bot is ready');
	}

	onDiscordMessage(message) {
		if (this.isMessageSendByThisBot(message) === true && this.isGameRunning() === true) {
			this.game.setLastMessageOfBot(message);
			return;
		}
		if (message.author.bot) {
			return;
		}

		if (message.content.startsWith(PREFIX) === false) {
			this.onUnprefixedMessage(message);
		} else {
			this.onBotCommandMessage(message);
		}
	}

	/**
	 * Called if a message does not contain the defined PREFIX
	 */
	onUnprefixedMessage(message) {
		if (this.isGameRunning() === true && this.game.isCurrentPlayer(message.author) === true) {
			this.game.checkSpeedInput(message);
		}
	}

	/**
	 * Called if a message contains the defined PREFIX
	 */
	onBotCommandMessage(message) {
		const args = message.content.slice(PREFIX.length + 1).split(' ');
		const commandName = args[0];

		const command = this.commands.find((command) => command.name === commandName);
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

	onAdd(message) {
		if (this.isGameRunning() === true) {
			message.channel.send(this.translation.t('error.gameAlreadyRunning'));
			return;
		}

		this.players[message.author.id] = message.author;

		// Send info to channel
		message.channel.send(
			this.translation.f('command.add.addPlayer', { username: message.author.username }) + NEWLINE + this.getCurrentInfo()
		);
	}

	onRemove(message) {
		if (this.isGameRunning() === true) {
			message.channel.send(this.translation.t('error.gameNeedsToBeFinished'));
			return;
		}

		delete this.players[message.author.id];

		// Send info to channel
		message.channel.send(
			this.translation.f('command.remove.removePlayer', { username: message.author.username }) + NEWLINE + this.getCurrentInfo()
		);
	}

	getCurrentInfo() {
		return this.translation.f('game.info', {
			players: this.getPlayersAsString(),
			gameMode: this.gameMode,
		});
	}

	onStart(message) {
		if (this.isGameRunning() === true) {
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

		this.game = new Game(
			this.translation,
			this.gameMode,
			message.channel,
			this.players,
		);
		this.game.on('stop', this.resetGame.bind(this));
		this.game.start();

		message.channel.send(this.translation.f('game.gameStared', { username: message.author.username }));
	}

	onStop(message) {
		if (this.isGameRunning() === false) {
			message.channel.send(this.translation.t('error.noGameActive'));
			return;
		}

		this.game.stop();
		this.resetGame();

		message.channel.send(this.translation.f('game.gameStopped', { username: message.author.username }));
	}

	resetGame() {
		this.game = null;
		this.players = {};
	}

	/**
	 * @param {any} message
	 * @param {string[]} args
	 */
	onSetGameMode(message, args) {
		if (this.isGameRunning() === true) {
			message.channel.send(this.translation.t('error.gameAlreadyRunning'));
			return;
		}

		if (args.length < 2) {
			message.channel.send(this.translation.t('command.wrongCountOfArguments') + this.getHelpCommandInformation());
			return;
		}

		const newGameMode = args[1];

		if (Object.values(GameModeEnum).indexOf(newGameMode) === -1) {
			message.channel.send(this.translation.f('command.setgm.wrongGamemode', {
				newGameMode: newGameMode, 
				helpCommandInformation: this.getHelpCommandInformation()
			}));
			return;
		}

		this.gameMode = newGameMode;
		message.channel.send(this.translation.f('command.setgm.gamemodeChangedTo', { gameMode: this.gameMode }));
	}

	onHelp(message) {
		message.channel.send(this.translation.t('command.help.availableCommands') + NEWLINE + this.commands.join(NEWLINE));
	}

	getHelpCommandInformation() {
		return this.translation.f('command.generalHelp', { prefix: PREFIX });
	}

	isGameRunning() {
		return this.game !== null;
	}
};
