module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    // Ignorer les messages des bots
    if (message.author.bot) return;

    // Vérifier si le message commence par la commande !changerRole
    if (message.content.startsWith('!changerRole')) {
      const changerRoleCommand = require('../commands/changerRole');
      changerRoleCommand(message, client);
    }

    // Vérifier si le message commence par la commande !infoRole
     if (message.content.startsWith('!infoRole')) {
      const infoRoleCommand = require('../commands/infoRole');
      infoRoleCommand(message, client);
    }

    if (message.content.startsWith('!giveRole')) {
      const giveRoleCommand = require('../commands/admin/giverole');
      giveRoleCommand(message, client);
    }
    
  },
};
