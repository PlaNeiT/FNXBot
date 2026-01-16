const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupreactivation')
        .setDescription('Send the role reactivation embed in the current channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        try {
            // Create the embed
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎮 Valide ta présence !')
                .setDescription(
                    'Sélectionne les jeux auxquels tu veux participer pour récupérer tes rôles et accéder aux channels.\n\n' +
                    '**Jeux disponibles :**\n' +
                    '🎯 **Battlefield**\n' +
                    '🔫 **Call of Duty**\n' +
                    '⚽ **FIFA**\n\n' +
                    '✅ Une fois validé, tu recevras le rôle **Membre PHÉNIX**.'
                )
                .setFooter({ text: 'Sélectionne au moins un jeu pour te réactiver' })
                .setTimestamp();

            // Create the select menu
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('role_selection')
                .setPlaceholder('Choisis tes jeux')
                .setMinValues(1)
                .setMaxValues(3)
                .addOptions([
                    {
                        label: 'Battlefield',
                        description: 'Rejoins l\'escouade Battlefield',
                        value: 'battlefield',
                        emoji: '🎯'
                    },
                    {
                        label: 'Call of Duty',
                        description: 'Rejoins l\'escouade Call of Duty',
                        value: 'cod',
                        emoji: '🔫'
                    },
                    {
                        label: 'FIFA',
                        description: 'Rejoins l\'équipe FIFA',
                        value: 'fifa',
                        emoji: '⚽'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            // Send the embed
            await interaction.channel.send({
                embeds: [embed],
                components: [row]
            });

            // Reply to confirm
            await interaction.reply({ content: 'Embed de réactivation envoyé !', ephemeral: true });
        } catch (error) {
            console.error('Error in setupreactivation command:', error);

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(`Une erreur est survenue : ${error.message}`);
            } else {
                await interaction.reply({ content: `Une erreur est survenue : ${error.message}`, ephemeral: true });
            }
        }
    }
};
