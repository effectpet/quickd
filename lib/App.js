const Discord = require('discord.js');
const EPLogger = require('eplogger');
const EPTranslation = require('eptranslation');

const GamesHandler = require('./GamesHandler');
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
		this.gamesHandler = new GamesHandler(this.translation);

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
		const channelGame = this.gamesHandler.getGameByChannel(message.channel);

		if (message.content.startsWith(PREFIX) === false) {
			this.onUnprefixedMessage(message, channelGame);
			return;
		}

		this.onBotCommandMessage(message, channelGame);
	}

	/**
	 * Called if a message does not contain the defined PREFIX
	 */
	onUnprefixedMessage(message, channelGame) {
		if (channelGame === undefined) {
			return;
		}

		if (this.isMessageSendByThisBot(message) === true) {
			channelGame.setLastMessageOfBot(message);
			return;
		}

		if (channelGame.isCurrentPlayer(message.author) === true) {
			channelGame.checkSpeedInput(message);
		}
	}

	/**
	 * Called if a message contains the defined PREFIX
	 */
	onBotCommandMessage(message, channelGame) {
		if (message.author.bot) {
			return;
		}

		const args = message.content.slice(PREFIX.length + 1).split(' ');
		const commandName = args[0];

		const command = this.commands.find((command) => command.name === commandName);
		if (typeof command === 'undefined') {
			message.channel.send(this.translation.f('error.unknownCommand', {
				commandName: this.markdown.markdownCode(commandName),
				arguments: this.markdown.markdownCode(args.join(' ')),
				helpCommandInformation: this.translation.f('command.generalHelp', { prefix: PREFIX }),
			}));

			return;
		}
		command.functionToCall.bind(this)(message, channelGame, args);
	}

	isMessageSendByThisBot(message) {
		return message.author.id === this.client.user.id;
	}

	onAdd(message, channelGame) {
		if (channelGame === undefined) {
			channelGame = this.gamesHandler.createGameByChannel(message.channel);
		}

		if (channelGame.isActive === true) {
			message.channel.send(this.translation.t('error.gameAlreadyRunning'));
			return;
		}

		channelGame.addPlayer(message.author);

		message.channel.send(
			this.translation.f('command.add.addPlayer', { username: message.author.username })
		);
	}

	onRemove(message, channelGame) {
		if (channelGame === undefined) {
			message.channel.send(this.translation.t('error.noGameActive'));
			return;
		}

		if (channelGame.isActive === true) {
			message.channel.send(this.translation.t('error.gameNeedsToBeFinished'));
			return;
		}

		channelGame.removePlayer(message.author);
		message.channel.send(
			this.translation.f('command.remove.removePlayer', { username: message.author.username })
		);

		if (channelGame.getPlayersLength() === 0) {
			channelGame.stop();
		}
	}

	onStart(message, channelGame) {
		if (channelGame === undefined) {
			message.channel.send(this.translation.t('error.noGameActive'));
			return;
		}

		if (channelGame.isActive === true) {
			message.channel.send(this.translation.t('error.gameAlreadyRunning'));
			return;
		}

		if (channelGame.getPlayersLength() <= 1) {
			message.channel.send(this.translation.t('error.twoPlayersRequired'));
			return;
		}

		message.channel.send(this.translation.f('game.gameStared', { username: message.author.username }));
		channelGame.start();
	}

	onStop(message, channelGame) {
		if (channelGame === undefined) {
			message.channel.send(this.translation.t('error.noGameActive'));
			return;
		}

		channelGame.stop();
		message.channel.send(this.translation.f('game.gameStopped', { username: message.author.username }));
	}

	/**
	 * @param {any} message
	 * @param {any} channelGame
	 * @param {string[]} args
	 */
	onSetGameMode(message, channelGame, args) {
		if (channelGame === undefined) {
			message.channel.send(this.translation.t('error.noGameActive'));
			return;
		}

		if (channelGame.isActive === true) {
			message.channel.send(this.translation.t('error.gameAlreadyRunning'));
			return;
		}

		if (args.length < 2) {
			message.channel.send(`${this.translation.t('command.wrongCountOfArguments')} ${this.translation.f('command.generalHelp', { prefix: PREFIX })}`);
			return;
		}

		const newGameMode = args[1];

		if (Object.values(GameModeEnum).indexOf(newGameMode) === -1) {
			message.channel.send(this.translation.f('command.setgm.wrongGamemode', {
				newGameMode,
				helpCommandInformation: this.translation.f('command.generalHelp', { prefix: PREFIX }),
			}));
			return;
		}

		this.channelGame.setGameMode(newGameMode);
		message.channel.send(this.translation.f('command.setgm.gamemodeChangedTo', { gameMode: newGameMode }));
	}

	onHelp(message) {
		message.channel.send(this.translation.t('command.help.availableCommands') + NEWLINE + this.commands.join(NEWLINE));
	}
};
