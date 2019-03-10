module.exports = {
	'command.add.description': 'Add yourself to a game',
	'command.add.addPlayer': '{{username}} was added to the game.',
	'command.remove.description': 'Remove yourself from the game',
	'command.remove.removePlayer': '{{username}} was removed from the game.',
	'command.start.description': 'Starts a new game with current gamemode',
	'command.stop.description': 'Stops the current game',
	'command.setgm.description': 'Changes the gamemode. Available options are: `speed` and `length`',
	'command.setgm.gamemode': '<gamemode>',
	'command.setgm.wrongGamemode': 'Gamemode **{{newGameMode}}** was not found! {{helpCommandInformation}}',
	'command.setgm.gamemodeChangedTo': 'Gamemode change to {{gameMode}}',
	'command.help.description': 'Shows an overview over all commands',
	'command.help.availableCommands': 'Available commands: ',
	'command.generalHelp': 'Use `{{prefix}} help` for more information',
	'command.wrongCountOfArguments': 'Wrong argument count!',
	'error.unknownCommand': 'Unknow command: {{commandName}} with following arguments: {{arguments}}! {{helpCommandInformation}}',
	'error.gameAlreadyRunning': 'Game already in progress',
	'error.noGameActive': 'No game running',
	'error.gameNeedsToBeFinished': 'Game needs to be finished first',
	'error.twoPlayersRequired': 'Two players are required to player a game!',
	'game.info': 'Current players: {{players}}\nCurrent gamemode: {{gameMode}}',
	'game.newRound': 'New round. Speed: {{currentSpeed}}ms',
	'game.toSlow': '{{username}} was to slow! ({{timeNeeded}}ms)',
	'game.wrongInput': '{{username}} did a spelling mistake!',
	'game.userMadeIt': '{{username}} did it! ({{timeNeeded}}ms)',
	'game.win': '{{username}} has won!',
	'game.gameStared': 'New game started by {{username}}',
	'game.gameStopped': 'Game stopped by {{username}}',
};
