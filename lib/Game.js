const RandomGenerator = require('./RandomGenerator');
const GameModeEnum = require('./GameModeEnum');

const DEFAULT_SPEED = 4000;
const DEFAULT_LENGTH = 1;
const TIMEOUT_SLEEP = 3000;

module.exports = class Game {

	static getCleanMessageContent(message) {
		return message.content.toLowerCase().replace(/\s+/g, '');
	}

	constructor(translation, gameMode, channel, players) {
		this.translation = translation;
		this.gameMode = gameMode;
		this.channel = channel;
		this.players = players;

		this.randomGenerator = new RandomGenerator();

		this.firstStart = true;
		this.currentPlayers = [];
		this.currentPlayer = null;
		this.currentString = null;
		this.currentSpeed = DEFAULT_SPEED;
		this.currentLength = DEFAULT_LENGTH;
		this.lastMessageOfBot = null;

		this.sleepTimeout = null;
		this.callbacks = {};
	}

	setLastMessageOfBot(message) {
		this.lastMessageOfBot = message;
	}

	on(key, callback) {
		this.callbacks[key] = callback;
	}

	start() {
		this.callNext();
	}

	stop() {
		if (typeof this.sleepTimeout !== 'undefined') {
			clearTimeout(this.sleepTimeout);
		}

		if (typeof this.callbacks.stop !== 'undefined') {
			this.callbacks.stop();
		}
	}

	callNext() {
		const playersAlive = Object.values(this.players);

		// Check if more than one player is alive
		if (playersAlive.length === 1) {
			this.channel.send(this.translation.f('game.win', { username: playersAlive[0].username }));
			this.stop();
			return;
		}

		if (playersAlive.length === 0) {
			this.stop();
			return;
		}

		// Check if all players played a round
		if (this.currentPlayers.length === 0) {
			this.gameNewRound(playersAlive);
		}

		this.currentPlayer = null;

		this.sleepTimeout = setTimeout(this.startNewRound.bind(this), TIMEOUT_SLEEP);
	}

	startNewRound() {
		// Create new message
		this.currentString = this.randomGenerator.getRandomString(this.currentLength);

		// Get random player & send new message
		const randomPlayerIndex = Math.floor(Math.random() * this.currentPlayers.length);
		const randomPlayer = this.currentPlayers.splice(randomPlayerIndex, 1);
		this.currentPlayer = randomPlayer[randomPlayer.length - 1];
		this.channel.send(`${this.currentPlayer.username}: **${this.currentString}**`);
	}

	gameNewRound(playersAlive) {
		this.currentPlayers = playersAlive;

		// Check if game has already been startet
		if (this.firstStart === false) {
			if (this.gameMode === GameModeEnum.SPEED) {
				this.gameAddSpeed();
			} else if (this.gameMode === GameModeEnum.LENGTH) {
				this.gameAddLength();
			}
		}
		this.firstStart = false;

		// Send new round info
		this.channel.send(this.translation.f('game.newRound', { currentSpeed: this.currentSpeed }));
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

	checkSpeedInput(message) {
		const timeNeeded = message.createdAt.getTime() - this.lastMessageOfBot.createdAt.getTime();

		const messageClean = this.constructor.getCleanMessageContent(message);

		if (timeNeeded > this.currentSpeed) {
			this.channel.send(this.translation.f('game.toSlow', {
				username: this.currentPlayer.username,
				timeNeeded: timeNeeded.toFixed(2),
			}));
			delete this.players[message.author.id];
		} else if (messageClean !== this.currentString.toLowerCase()) {
			this.channel.send(this.translation.f('game.wrongInput', {
				username: this.currentPlayer.username,
			}));
			delete this.players[message.author.id];
		} else {
			this.channel.send(this.translation.f('game.userMadeIt', {
				username: this.currentPlayer.username,
				timeNeeded: timeNeeded.toFixed(2),
			}));
		}

		this.callNext();
	}

	isCurrentPlayer(player) {
		return this.currentPlayer !== null && player.id === this.currentPlayer.id;
	}

};
