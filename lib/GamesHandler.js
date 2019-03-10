const Game = require('./Game');

module.exports = class GamesHandler {
	constructor(translation) {
		this.translation = translation;
		this.games = {};
	}

	getGameByChannel(channel) {
		return this.games[channel.id];
	}

	createGameByChannel(channel) {
		const game = new Game(this.translation, channel);
		game.on('stop', this.removeGameByChannel.bind(this));

		this.games[channel.id] = game;

		return game;
	}

	removeGameByChannel(channel) {
		delete this.games[channel.id];
	}
};
