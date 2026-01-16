const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('changerole')
        .setDescription('Remove roles and assign new ones to all members who have the specified roles.')
        // Required options first
        .addRoleOption(option =>
            option.setName('roletoremove1')
                .setDescription('First role to remove from members')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('roletoadd1')
                .setDescription('First role to add to members')
                .setRequired(true))
        // Optional roles to remove
        .addRoleOption(option =>
            option.setName('roletoremove2')
                .setDescription('Second role to remove (optional)')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('roletoremove3')
                .setDescription('Third role to remove (optional)')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('roletoremove4')
                .setDescription('Fourth role to remove (optional)')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('roletoremove5')
                .setDescription('Fifth role to remove (optional)')
                .setRequired(false))
        // Optional roles to add
        .addRoleOption(option =>
            option.setName('roletoadd2')
                .setDescription('Second role to add (optional)')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('roletoadd3')
                .setDescription('Third role to add (optional)')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('roletoadd4')
                .setDescription('Fourth role to add (optional)')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('roletoadd5')
                .setDescription('Fifth role to add (optional)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        try {
            // Defer reply to allow processing time
            await interaction.deferReply();

            // Collect all roles to remove
            const rolesToRemove = [];
            for (let i = 1; i <= 5; i++) {
                const role = interaction.options.getRole(`roletoremove${i}`);
                if (role) rolesToRemove.push(role);
            }

            // Collect all roles to add
            const rolesToAdd = [];
            for (let i = 1; i <= 5; i++) {
                const role = interaction.options.getRole(`roletoadd${i}`);
                if (role) rolesToAdd.push(role);
            }

            // Check if bot has the required permission
            const botMember = interaction.guild.members.me;
            if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return interaction.editReply("I don't have permission to manage roles.");
            }

            // Check if bot can manage all roles
            for (const role of [...rolesToRemove, ...rolesToAdd]) {
                if (role.position >= botMember.roles.highest.position) {
                    return interaction.editReply(`I can't manage the role **${role.name}** because it is higher or equal to my highest role.`);
                }
            }

            // Fetch all members from the server (not just cached ones)
            await interaction.editReply('⏳ Fetching all server members...');
            await interaction.guild.members.fetch();

            // Get all members who have the primary role (roletoremove1)
            const primaryRole = rolesToRemove[0]; // roletoremove1 is always first since it's required
            const members = interaction.guild.members.cache.filter(member => {
                if (member.user.bot) return false;
                return member.roles.cache.has(primaryRole.id);
            });

            if (members.size === 0) {
                return interaction.editReply(`No members found with the role: **${primaryRole.name}**`);
            }

            await interaction.editReply(`⏳ Found ${members.size} members with **${primaryRole.name}**. Processing role changes...`);

            console.log(`[CHANGEROLE] Starting to process ${members.size} members`);
            console.log(`[CHANGEROLE] Roles to add: ${rolesToAdd.map(r => r.name).join(', ')}`);
            console.log(`[CHANGEROLE] Roles to remove: ${rolesToRemove.map(r => r.name).join(', ')}`);

            let successCount = 0;
            let failCount = 0;
            const totalMembers = members.size;
            let processedCount = 0;

            // Add new roles first, then remove old roles (to avoid permission errors)
            for (const member of members.values()) {
                processedCount++;

                try {
                    // Add all specified roles FIRST
                    await member.roles.add(rolesToAdd);
                    console.log(`[${processedCount}/${totalMembers}] ✅ Added roles to ${member.user.tag}`);

                    // Then remove all specified roles
                    await member.roles.remove(rolesToRemove);
                    console.log(`[${processedCount}/${totalMembers}] ✅ Removed roles from ${member.user.tag}`);

                    successCount++;

                    // Update progress every 10 members
                    if (processedCount % 10 === 0) {
                        await interaction.editReply(
                            `⏳ Processing... ${processedCount}/${totalMembers} members (${successCount} succeeded, ${failCount} failed)`
                        );
                    }
                } catch (error) {
                    console.error(`[${processedCount}/${totalMembers}] ❌ Failed to change roles for ${member.user.tag}:`, error.message);
                    failCount++;
                }
            }

            console.log(`[CHANGEROLE] Completed: ${successCount} succeeded, ${failCount} failed`);

            // Respond with the results
            const removedRoleNames = rolesToRemove.map(r => r.name).join(', ');
            const addedRoleNames = rolesToAdd.map(r => r.name).join(', ');

            await interaction.editReply(
                `✅ Successfully changed roles for ${successCount} members.\n` +
                `**Removed:** ${removedRoleNames}\n` +
                `**Added:** ${addedRoleNames}\n` +
                (failCount > 0 ? `❌ Failed for ${failCount} members.` : '')
            );
        } catch (error) {
            console.error('Error in changerole command:', error);

            // Handle the error reply safely
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(`An error occurred: ${error.message}`);
            } else {
                await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
            }
        }
    }
};
