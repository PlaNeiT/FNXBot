const { PermissionsBitField } = require('discord.js');

module.exports = async (message, client) => {
    console.log(`🔹 Commande !giveRole exécutée par ${message.author.tag} dans #${message.channel.name}`);

    // Vérifier si l'utilisateur a la permission de gérer les rôles
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        console.log('❌ L\'utilisateur n\'a pas la permission MANAGE_ROLES');
        return message.reply('❌ Vous n\'avez pas la permission de gérer les rôles.');
    }

    // Récupérer le rôle mentionné
    const roleMention = message.mentions.roles.first();
    if (!roleMention) {
        console.log('⚠️ Aucun rôle mentionné');
        return message.reply('⚠️ Vous devez mentionner un rôle à attribuer.');
    }

    console.log(`🔹 Rôle mentionné : ${roleMention.name} (ID: ${roleMention.id})`);

    // Vérifier si le bot a la permission de gérer les rôles
    const botMember = message.guild.members.cache.get(client.user.id);
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        console.log('❌ Le bot n\'a pas la permission MANAGE_ROLES');
        return message.reply('❌ Le bot n\'a pas la permission de gérer les rôles.');
    }

    // Vérifier si le bot peut gérer le rôle cible
    if (roleMention.position >= botMember.roles.highest.position) {
        console.log(`❌ Le rôle ${roleMention.name} est supérieur au rôle le plus haut du bot.`);
        return message.reply('❌ Le bot ne peut pas attribuer ce rôle car il est supérieur à son plus haut rôle.');
    }

    try {
        console.log('🔄 Récupération des membres ayant accès au salon...');

        // Récupérer tous les membres pouvant voir le salon
        const membersWithAccess = await message.guild.members.fetch().then(members =>
            members.filter(member => 
                message.channel.permissionsFor(member).has(PermissionsBitField.Flags.ViewChannel)
            )
        );

        console.log(`✅ Nombre total de membres ayant accès : ${membersWithAccess.size}`);

        if (membersWithAccess.size === 0) {
            console.log('⚠️ Aucun membre trouvé avec accès à ce salon.');
            return message.reply('⚠️ Aucun membre n\'a accès à ce salon.');
        }

        let successCount = 0;
        let failCount = 0;

        console.log('🔄 Attribution des rôles en cours...');
        for (const member of membersWithAccess.values()) {
            if (!member.roles.cache.has(roleMention.id)) {
                try {
                    await member.roles.add(roleMention);
                    console.log(`✅ Rôle ajouté à ${member.user.tag}`);
                    successCount++;
                } catch (error) {
                    console.error(`❌ Impossible d'ajouter le rôle à ${member.user.tag}:`, error);
                    failCount++;
                }
            }
        }

        console.log(`✅ Attribution terminée : ${successCount} succès, ${failCount} échecs.`);

        // Envoyer un message de confirmation
        message.channel.send(`✅ Le rôle **${roleMention.name}** a été attribué à **${successCount}** membres.`);
        if (failCount > 0) {
            message.channel.send(`⚠️ Impossible d'attribuer le rôle à **${failCount}** membres.`);
        }
    } catch (error) {
        console.error('❌ Une erreur s\'est produite lors de l\'attribution des rôles:', error);
        message.reply('❌ Une erreur est survenue lors de l\'attribution des rôles.');
    }
};
