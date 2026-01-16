const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const clientId = process.env.CLIENT_ID;
const guildId = '1297959026168041473'; // Your test server ID
const token = process.env.DISCORD_TOKEN;

const commands = [];

// Load all commands recursively
function loadCommands(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith('.js')) {
            const command = require(filePath);
            if (command.data) {
                commands.push(command.data.toJSON());
                console.log(`Loaded command: ${command.data.name}`);
            }
        }
    }
}

// Load commands from the commands folder
const commandsPath = path.join(__dirname, 'commands');
loadCommands(commandsPath);

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// Deploy commands to specific guild (instant)
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands for guild ${guildId}.`);

        // The put method is used to fully refresh all commands in the guild
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands for the guild.`);
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
})();
