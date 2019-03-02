## About
quickd is a small discord game (bot) that allows you to test your reaction time with other users.

## Commands
Following commands exist:
- `!qd add` adds you to a game
- `!qd remove` removes you from the game
- `!qd start` starts a new game
- `!qd stop` stops the current game
- `!qd setgm <gamemode>` changes the [gamemode](#Gamemodes)

## Gamemodes
- `speed` Every round gets faster
- `length` The string gets longer every round

# Development

## Installation
**Tested with Node.js 10.14.2.**  
Ignore any warnings about unmet peer dependencies from [discord.js](https://github.com/discordjs/discord.js), as they're all optional.

- Install dependencies with `npm install`
- Create an .env file and add the line `TOKEN='<YOUR-TOKEN>'` [howto get a token](https://github.com/Chikachi/DiscordIntegration/wiki/How-to-get-a-token-and-channel-ID-for-Discord)
- Start the game with `npm start`

## JSDoc in Visual Studio Code
1. Go to **Preferences**
2. Go to **Settings**
3. Set this confiuguration to true: `"javascript.implicitProjectConfig.checkJs": true`

## Contributing
Before creating an issue, please ensure that it hasn't already been reported/suggested.

Feel free to submit a PR.

## Help
If you experiencing any problems, please don't hesitate to contact me here or on Discord: unGenau#2209.
