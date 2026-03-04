const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const INACTIF_ROLE_ID = '1440094227211096165';
const INVITE_LINK = 'https://discord.gg/JuGxC7Kk8V';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kickinactifs')
        .setDescription('Kick tous les membres ayant le rôle Inactif et leur envoie un MP avec le lien d\'invitation.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const botMember = interaction.guild.members.me;
            if (!botMember.permissions.has(PermissionFlagsBits.KickMembers)) {
                return interaction.editReply("Je n'ai pas la permission de kick des membres.");
            }

            await interaction.editReply('⏳ Récupération des membres du serveur...');
            await interaction.guild.members.fetch();

            const members = interaction.guild.members.cache.filter(member => {
                if (member.user.bot) return false;
                if (!member.kickable) return false;
                return member.roles.cache.has(INACTIF_ROLE_ID);
            });

            if (members.size === 0) {
                return interaction.editReply('Aucun membre avec le rôle Inactif trouvé.');
            }

            await interaction.editReply(`⏳ ${members.size} membres inactifs trouvés. Kick en cours...`);

            console.log(`[KICKINACTIFS] Début du kick de ${members.size} membres inactifs`);

            let kickCount = 0;
            let dmCount = 0;
            let failCount = 0;
            const totalMembers = members.size;
            let processedCount = 0;

            for (const member of members.values()) {
                processedCount++;

                try {
                    // Envoyer le MP avant le kick (impossible après)
                    try {
                        await member.send(
                            `Tu as été kick du serveur **${interaction.guild.name}** pour inactivité.\n\n` +
                            `Tu peux rejoindre à nouveau en cliquant sur le lien ci-dessous et refaire le processus en précisant ta venue :\n` +
                            `${INVITE_LINK}`
                        );
                        dmCount++;
                        console.log(`[${processedCount}/${totalMembers}] ✅ MP envoyé à ${member.user.tag}`);
                    } catch (dmError) {
                        console.log(`[${processedCount}/${totalMembers}] ⚠️ Impossible d'envoyer un MP à ${member.user.tag}: ${dmError.message}`);
                    }

                    // Kick le membre
                    await member.kick('Inactivité');
                    kickCount++;
                    console.log(`[${processedCount}/${totalMembers}] ✅ ${member.user.tag} kick`);

                    if (processedCount % 10 === 0) {
                        await interaction.editReply(
                            `⏳ En cours... ${processedCount}/${totalMembers} (${kickCount} kicks, ${failCount} échecs)`
                        );
                    }
                } catch (error) {
                    console.error(`[${processedCount}/${totalMembers}] ❌ Échec du kick de ${member.user.tag}:`, error.message);
                    failCount++;
                }
            }

            console.log(`[KICKINACTIFS] Terminé: ${kickCount} kicks, ${dmCount} MPs envoyés, ${failCount} échecs`);

            await interaction.editReply(
                `✅ Opération terminée.\n` +
                `**Kicks réussis :** ${kickCount}/${totalMembers}\n` +
                `**MPs envoyés :** ${dmCount}/${totalMembers}\n` +
                (failCount > 0 ? `❌ **Échecs :** ${failCount}` : '')
            );
        } catch (error) {
            console.error('Erreur dans la commande kickinactifs:', error);

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(`Une erreur est survenue : ${error.message}`);
            } else {
                await interaction.reply({ content: `Une erreur est survenue : ${error.message}`, ephemeral: true });
            }
        }
    }
};
