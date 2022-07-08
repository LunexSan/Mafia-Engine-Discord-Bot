import { CategoryChannel, CommandInteraction, Guild, TextChannel} from "discord.js";
import { ConfessionalsRaw, ConfessionalsSchema, IndividualConfessional, updateChannelPermissions } from "../../database/Confessionals";
import { SlashCommand } from "../../structures/SlashCommand";

export const slashCommand: SlashCommand = {
    name: 'add',
    description: '[HOST] Add a player to the confessionals.',
    commandData: [
        {
            name: 'player',
            description: 'Player you are adding',
            type: 'USER',
            required: true
        },
        {
            name: 'add_type',
            description: 'Where you are adding them. Defaults to `PLAYER`',
            type: 'STRING',
            choices: [
                { name: 'PLAYER', value: 'player' },
                { name: 'SPECTATOR', value: 'spectator' }
            ],
            required: false
        },
        {
            name: 'title',
            description: 'Change the referenced name to a custom',
            type: 'STRING',
            required: false
        },
    ],

    commandFunction: async (i: CommandInteraction) => {
        await i.deferReply();
        const channel = i.channel as TextChannel;
        if (channel.name !== 'host-panel') return i.editReply('You cannot use this command outside of the dedicated host panel.')


        const newPlayer = i.options.getUser('player', true);
        const addType = i.options.getString('add_type', false) || 'player';
        const confTitle = i.options.getString('title', false);

        try {
            const fetchedConfessional = await ConfessionalsSchema.findOne({ hostPanelId: channel.parentId });
            if (!fetchedConfessional) return await i.editReply('Cannot find a stored confessionals linked to this category.');

            let userExists = false;
            let userConfessional = null;
            if (fetchedConfessional.confessionals) {
                fetchedConfessional.confessionals.forEach((val: IndividualConfessional) => {
                    if (val.user == newPlayer.id) {
                        userExists = true;
                        userConfessional = val.channelId;
                    }
                })
            } else {
            }

            if (userExists) return i.editReply(`User already has a confessional which you can find here -> <#${userConfessional}>`);
            
            if (addType === 'player') {
                if (!channel.parent) return i.editReply('An error has occurred when creating the confessional.');
                const newChannel = await channel.guild.channels.create(confTitle ? confTitle : newPlayer.username, { parent: channel.parent.id });
                const confessionalList = fetchedConfessional.confessionals || [];
                confessionalList.push({
                    user: newPlayer.id,
                    channelId: newChannel.id
                })

                fetchedConfessional.confessionals = confessionalList;
                await fetchedConfessional.save();

                await updateChannelPermissions(newChannel, fetchedConfessional);

                newChannel.send(`<@${newPlayer.id}> welcome to your confessional. Anything you say here will be kept strictly between you and the host, unless said otherwise.`)
                await i.editReply(`Confessional created -> <#${newChannel.id}>`);
            }

            if (addType === 'spectator') {
                let spectatorList = fetchedConfessional.specIds || [];
                spectatorList = spectatorList.filter((v: string) => v != newPlayer.id);
                spectatorList.push(newPlayer.id);
                fetchedConfessional.specIds = spectatorList;
                await fetchedConfessional.save();

                const confessionalList = fetchedConfessional.confessionals || [];
                await confessionalList.forEach(async (conf: IndividualConfessional) => {
                    const confChannel = channel.guild.channels.cache.get(conf.channelId) as TextChannel;
                    await updateChannelPermissions(confChannel, fetchedConfessional);
                })

                await i.editReply(`<@${newPlayer.id}> is now a spectator and can see all confessionals.`)

            }

        } catch (err) {
            console.log(err);
            await i.editReply(`An unexpected error has occurred.`)
        }
    }
}