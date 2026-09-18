const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

// ⚙️ CONFIGURAÇÕES DOS CARGOS E CANAIS (Substitua pelos IDs reais do seu servidor)
const CARGO_REGISTRADO_ID = '1549934590670540919'; // ID do cargo que a pessoa vai receber
const CANAL_LOGS_ID = '1549934591479914532';       // ID do canal onde vai cair os logs de registro

client.once('ready', () => {
    console.log(`Bot logado como ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Comando !setup para criar o painel
    if (message.content === '!setup') {
        message.delete().catch(() => {});

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🛡️ Sistema de Registro — Suécia')
            .setDescription(
                'Seja muito bem-vindo(a) ao nosso servidor!\n\n' +
                'Para ter acesso completo aos canais e conteúdos, é necessário realizar o seu registro em nosso sistema. É um procedimento rápido e totalmente seguro.\n\n' +
                '👉 Clique no botão **REGISTRAR-SE** abaixo para começar.'
            )
            .setImage('https://cdn.discordapp.com/attachments/1549934591748476991/1550330695312740402/ChatGPT_Image_17_de_set._de_2026_23_20_27.png?ex=6aadf179&is=6aac9ff9&hm=fc590a39a0251804b85ed138b498840c101d512f3dfcbad2a95e0623e5e7fc2c&') // Substitua pelo link da sua imagem se quiser
            .setFooter({ text: 'Suécia • Sistema de Segurança', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('abrir_registro')
                .setLabel('REGISTRAR-SE')
                .setStyle(ButtonStyle.Success)
                .setEmoji('📝')
        );

        try {
            await message.channel.send({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error('Erro ao enviar o painel:', error);
        }
    }
});

// Sistema de Interações (Botões e Modais)
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        // Quando clicar no botão "REGISTRAR-SE"
        if (interaction.customId === 'abrir_registro') {
            const modal = new ModalBuilder()
                .setCustomId('modal_registro')
                .setTitle('Formulário de Registro');

            const inputNome = new TextInputBuilder()
                .setCustomId('input_nome')
                .setLabel('Nome e Sobrenome')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: João Silva')
                .setRequired(true);

            const inputId = new TextInputBuilder()
                .setCustomId('input_id')
                .setLabel('ID')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 00000000')
                .setRequired(true);

            const inputNumero = new TextInputBuilder()
                .setCustomId('input_numero')
                .setLabel('Número')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 123-456')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(inputNome),
                new ActionRowBuilder().addComponents(inputId),
                new ActionRowBuilder().addComponents(inputNumero)
            );

            await interaction.showModal(modal);
        }
    } else if (interaction.isModalSubmit()) {
        // Quando o usuário enviar o formulário
        if (interaction.customId === 'modal_registro') {
            const nomeSobrenome = interaction.fields.getTextInputValue('input_nome');
            const idPassaporte = interaction.fields.getTextInputValue('input_id');
            const numeroPassaporte = interaction.fields.getTextInputValue('input_numero');
            const membro = interaction.member;

            try {
                // 1. Adiciona o cargo ao membro
                await membro.roles.add(CARGO_REGISTRADO_ID);

                // 2. Altera o apelido do usuário no servidor automaticamente (Nome + ID)
                await membro.setNickname(`${nomeSobrenome} | ${idPassaporte}`).catch(() => {});

                // 3. Envia a resposta privada para o usuário
                await interaction.reply({ 
                    content: '✅ Registro concluído com sucesso! Seu cargo foi liberado.', 
                    ephemeral: true 
                });

                // 4. Envia o Log no canal configurado
                const canalLogs = interaction.guild.channels.cache.get(CANAL_LOGS_ID);
                if (canalLogs) {
                    const embedLog = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('📋 Novo Registro Realizado')
                        .setThumbnail(membro.user.displayAvatarURL())
                        .addFields(
                            { name: '👤 Usuário', value: `${membro} (${membro.user.tag})`, inline: false },
                            { name: '📝 Nome e Sobrenome', value: nomeSobrenome, inline: true },
                            { name: '🆔 ID', value: idPassaporte, inline: true },
                            { name: '🔢 Número', value: numeroPassaporte, inline: true }
                        )
                        .setTimestamp();

                    await canalLogs.send({ embeds: [embedLog] });
                }
            } catch (error) {
                console.error('Erro ao registrar o usuário:', error);
                await interaction.reply({ 
                    content: '❌ Ocorreu um erro ao tentar te registrar. Verifique se o cargo do bot está acima do cargo que ele tenta dar e se ele tem permissão.', 
                    ephemeral: true 
                });
            }
        }
    }
});

client.login(process.env.TOKEN);