const { 
  ChannelType, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');

// Fonction pour échapper les caractères spéciaux en markdown
function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/([\[\]\(\)\<\>\*\`_~])/g, '\\$1');
}

// Fonction de pagination : découpe un tableau en chunks
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

module.exports = async (message, client) => {
  console.log('[INFO] Début de la commande infoRole');

  // Vérifier que le rôle est mentionné
  const roleMentions = message.mentions.roles;
  if (roleMentions.size === 0) {
    return message.reply('Veuillez mentionner un rôle.');
  }
  const role = roleMentions.first();
  console.log(`[INFO] Rôle ciblé : ${role.name} (${role.id})`);

  // Optionnel : Vérifier si un channel est mentionné en second paramètre
  const channelMentions = message.mentions.channels;
  let targetChannels = [];
  if (channelMentions.size > 0) {
    targetChannels = Array.from(channelMentions.values());
    console.log(`[INFO] Channel(s) ciblé(s) spécifié(s) : ${targetChannels.map(ch => ch.name).join(', ')}`);
  } else {
    targetChannels = message.guild.channels.cache.filter(ch =>
      (ch.type === ChannelType.GuildText ||
       ch.type === ChannelType.GuildPublicThread ||
       ch.type === ChannelType.GuildPrivateThread) &&
      ch.viewable
    );
    console.log(`[INFO] Aucun channel spécifié. Traitement de tous les channels textuels du serveur (${targetChannels.size}).`);
  }

  try {
    // Envoyer un message de progression initial
    const progressMsg = await message.channel.send('Début de la récupération des messages...');

    // Récupérer les membres possédant le rôle
    const membersWithRole = await message.guild.members.fetch().then(members =>
      members.filter(member => member.roles.cache.has(role.id))
    );
    if (membersWithRole.size === 0) {
      return message.reply(`Aucun membre n'a le rôle ${role.name}.`);
    }
    console.log(`[INFO] Nombre de membres avec le rôle ${role.name} : ${membersWithRole.size}`);

    // Trier les membres par date d'arrivée
    const sortedMembers = membersWithRole.sort((a, b) => a.joinedAt - b.joinedAt);

    // Fonction pour récupérer les messages de manière paginée dans un channel
    async function fetchMessagesPaginated(channel, maxMessages = 10000) {
      let allMessages = [];
      let lastMessageId = null;
      const options = { limit: 100 };

      console.log(`[INFO] Début de la récupération des messages dans #${channel.name}`);
      while (true) {
        if (lastMessageId) options.before = lastMessageId;
        let messages;
        try {
          messages = await channel.messages.fetch(options);
        } catch (err) {
          console.error(`[ERROR] Échec lors de la récupération des messages dans #${channel.name} :`, err);
          break;
        }
        if (messages.size === 0) break;

        allMessages = allMessages.concat(Array.from(messages.values()));
        lastMessageId = messages.last().id;
        console.log(`[INFO] ${messages.size} messages récupérés dans #${channel.name}, total = ${allMessages.length}`);
        if (allMessages.length >= maxMessages) break;

        // Pause d'une seconde pour respecter les limites de taux
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      console.log(`[INFO] Fin de récupération dans #${channel.name} : ${allMessages.length} messages récupérés`);
      return allMessages.slice(0, maxMessages);
    }

    // Récupérer les messages dans les channels ciblés et mettre à jour la progression
    let allFetchedMessages = [];
    let processedChannels = 0;
    for (const channel of targetChannels.values()) {
      if (!channel.viewable || !channel.permissionsFor(client.user)?.has('READ_MESSAGE_HISTORY')) {
        console.warn(`[WARN] Pas d'accès aux messages de #${channel.name}`);
        continue;
      }
      const channelMessages = await fetchMessagesPaginated(channel, 10000);
      allFetchedMessages = allFetchedMessages.concat(channelMessages);
      processedChannels++;
      console.log(`[INFO] Channel ${channel.name} traité (${processedChannels}/${targetChannels.size}).`);
      try {
        await progressMsg.edit(`Channels traités : ${processedChannels} sur ${targetChannels.size}.\nMessages récupérés jusqu'à présent : ${allFetchedMessages.length}`);
      } catch (err) {
        console.error('[ERROR] Échec lors de la mise à jour du message de progression :', err);
      }
    }
    console.log(`[INFO] Total messages récupérés : ${allFetchedMessages.length}`);
    allFetchedMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    // Construire les infos pour chaque membre
    const memberInfos = [];
    for (const member of sortedMembers.values()) {
      let infoText = `<@${member.id}> (${member.user.tag}) - Arrivé le : ${member.joinedAt.toLocaleString()}\n`;
      const memberMessages = allFetchedMessages.filter(msg => msg.author.id === member.id);
      if (memberMessages.length > 0) {
        const lastMessage = memberMessages[memberMessages.length - 1];
        const jumpURL = `https://discord.com/channels/${message.guild.id}/${lastMessage.channel.id}/${lastMessage.id}`;
        const escapedContent = escapeMarkdown(lastMessage.content || "Message vide");
        infoText += `Dernier message : [${escapedContent}](${jumpURL}) envoyé le ${lastMessage.createdAt.toLocaleString()}`;
      } else {
        infoText += `Aucun message trouvé dans les channels ciblés.`;
      }
      memberInfos.push(infoText);
    }

    // Créer les pages avec 10 membres par page
    const pages = chunkArray(memberInfos, 10);
    let currentPage = 0;
    console.log(`[INFO] Création de ${pages.length} pages de résultats.`);

    // Fonction pour générer un embed de page
    const generateEmbed = (pageContent) => {
      const embed = new EmbedBuilder()
        .setTitle(`Informations pour le rôle ${role.name}`)
        .setDescription(pageContent.join('\n\n'))
        .setFooter({ text: `Page ${currentPage + 1} sur ${pages.length}` })
        .setColor(0x0099ff);
      console.log(`[INFO] Génération de l'embed pour la page ${currentPage + 1}`);
      return embed;
    };

    // Fonction pour créer de nouveaux boutons à chaque update
    const generateButtons = () => {
      const newPrevButton = new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('Précédent')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0);
      const newNextButton = new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Suivant')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === pages.length - 1);
      console.log(`[INFO] Boutons générés : Précédent ${currentPage === 0 ? 'désactivé' : 'activé'}, Suivant ${currentPage === pages.length - 1 ? 'désactivé' : 'activé'}`);
      return new ActionRowBuilder().addComponents(newPrevButton, newNextButton);
    };

    // Envoyer le premier embed avec les boutons
    const embedMessage = await message.channel.send({
      embeds: [generateEmbed(pages[currentPage])],
      components: [generateButtons()]
    });
    console.log('[INFO] Embed initial envoyé.');

    // Supprimer le message de progression
    try {
      await progressMsg.delete();
      console.log('[INFO] Message de progression supprimé.');
    } catch (err) {
      console.error('[ERROR] Échec de la suppression du message de progression :', err);
    }

    // Créer un collector pour gérer les interactions sur les boutons (durée de 2 minutes)
    const collector = embedMessage.createMessageComponentCollector({
      componentType: 'BUTTON',
      time: 120000,
      filter: (interaction) => interaction.user.id === message.author.id
    });

    collector.on('collect', async (interaction) => {
      console.log(`[INFO] Interaction collectée : ${interaction.customId} par ${interaction.user.tag}`);
      // Mettre à jour la page en fonction du bouton cliqué
      if (interaction.customId === 'prev' && currentPage > 0) {
        currentPage--;
        console.log('[INFO] Bouton "Précédent" cliqué, nouvelle page :', currentPage + 1);
      } else if (interaction.customId === 'next' && currentPage < pages.length - 1) {
        currentPage++;
        console.log('[INFO] Bouton "Suivant" cliqué, nouvelle page :', currentPage + 1);
      } else {
        console.warn('[WARN] Aucun changement de page effectué.');
      }

      try {
        const newEmbed = generateEmbed(pages[currentPage]);
        const newButtons = generateButtons();
        console.log('[INFO] Mise à jour de l\'interaction avec la nouvelle page.');
        await interaction.update({
          embeds: [newEmbed],
          components: [newButtons]
        });
        console.log(`[INFO] Interaction update réussie pour la page ${currentPage + 1}`);
      } catch (err) {
        console.error('[ERROR] Échec lors de la mise à jour de l\'interaction :', err);
      }
    });

    collector.on('end', async () => {
      console.log('[INFO] Collector terminé, désactivation des boutons.');
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('Précédent')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Suivant')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true)
      );
      try {
        await embedMessage.edit({ components: [disabledRow] });
        console.log('[INFO] Boutons désactivés à la fin du collector.');
      } catch (err) {
        console.error('[ERROR] Échec lors de la désactivation des boutons à la fin du collector :', err);
      }
    });
  } catch (error) {
    console.error('[ERROR] Une erreur est survenue dans la commande infoRole :', error);
    message.reply('Une erreur est survenue lors de la récupération des informations du rôle.');
  }
};
