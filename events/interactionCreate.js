module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Error executing command:', error);
                const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }

        // Handle string select menus (role selection)
        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'role_selection') {
                try {
                    await interaction.deferReply({ ephemeral: true });

                    const member = interaction.member;
                    const guild = interaction.guild;

                    // Define role mappings using role IDs
                    const roleMapping = {
                        'battlefield': '1423758356786446478',
                        'cod': '1441397506738229287',
                        'fifa': '1423758928755298467'
                    };

                    const selectedGames = interaction.values;
                    const rolesToAdd = [];
                    const notFoundRoles = [];

                    // Find the roles to add based on selection
                    for (const game of selectedGames) {
                        const roleId = roleMapping[game];
                        const role = guild.roles.cache.get(roleId);

                        if (role) {
                            rolesToAdd.push(role);
                        } else {
                            notFoundRoles.push(`Role ID: ${roleId}`);
                        }
                    }

                    // Find "Membre PHÉNIX" role using ID
                    const membrePhenixRole = guild.roles.cache.get('779660017627299841');
                    if (membrePhenixRole) {
                        rolesToAdd.push(membrePhenixRole);
                    } else {
                        notFoundRoles.push('Membre PHÉNIX (ID: 779660017627299841)');
                    }

                    // Find "Inactif" role to remove using ID
                    const inactifRole = guild.roles.cache.get('1440094227211096165');
                    // Check if member has Inactif role
                    if (!inactifRole || !member.roles.cache.has(inactifRole.id)) {
                        return interaction.editReply({
                            content: '❌ Tu n\'as pas le rôle Inactif, cette action n\'est pas nécessaire.',
                        });
                    }

                    // Check if any roles were not found
                    if (notFoundRoles.length > 0) {
                        return interaction.editReply({
                            content: `❌ Erreur : Les rôles suivants n'ont pas été trouvés sur le serveur : ${notFoundRoles.join(', ')}.\nContacte un administrateur.`,
                        });
                    }

                    // Add selected roles
                    await member.roles.add(rolesToAdd);

                    // Remove Inactif role
                    await member.roles.remove(inactifRole);

                    const addedRoleNames = rolesToAdd.map(r => r.name).join(', ');

                    await interaction.editReply({
                        content: `✅ **Bienvenue à nouveau !**\n\n` +
                                `**Rôles ajoutés :** ${addedRoleNames}\n` +
                                `**Rôle retiré :** ${inactifRole.name}\n\n` +
                                `Tu as maintenant accès aux channels de tes jeux sélectionnés !`,
                    });

                } catch (error) {
                    console.error('Error handling role selection:', error);

                    const errorReply = {
                        content: `❌ Une erreur est survenue lors de l'attribution des rôles : ${error.message}`,
                    };

                    if (interaction.deferred || interaction.replied) {
                        await interaction.editReply(errorReply);
                    } else {
                        await interaction.reply({ ...errorReply, ephemeral: true });
                    }
                }
            }
        }
    },
};
