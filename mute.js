const redis = require('./redis')
const command = require('./command')
const { RedisClient } = require('redis')



module.exports = client => {
    const redisKeyPrefix = 'muted-'

    redis.expire(message => {
        if (message.startsWith(redisKeyPrefix)) {
            const split = message.split('-')

            const memberId = split[1]
            const guildId = split[2]
      
            const guild = client.guilds.cache.get(guildId)
            const member = guild.members.cache.get(memberId)
      
            const role = getRole(guild)
      
            member.roles.remove(role)
        }
    })

    const getRole = (guild) => {
        return guild.roles.cache.find((role) => role.name === 'muted')
      }


    const giveRole = member => {
        const role = getRole(member.guild)
                    if (role) {
                        member.roles.add(role)
                        console.log('Muted ' + member.id)
                    }
    }


    const OnJoin = async member => {
        const { id } = member

        const redisClient = await redis()
        try {
            redisClient.get(`${redisKeyPrefix}${id}-${guild.id}`, (err, result) => {
                if (err) {
                    console.error('Redis GET error:', err)
                } else if (result) {
                    giveRole(member)
                } else {
                    console.log('The user is not muted')
                }
            })
        } finally {
            
        }
    }



    client.on('guildMemberAdd', member => {
        OnJoin(member)
    })

    command(client, 'unmute', message => {
        const { member, channel, content, mentions, guild } = message
        const { id } = member

        const syntax = '-unmute <@> <reason>'
        const split = content.trim().split(' ')

        if (split.length < 3) {
            channel.send('Please use the correct command syntax: ' + syntax)
            return
          }

        if (!member.hasPermission('ADMINISTRATOR') || !member.hasPermission('MUTE_MEMBER')) {
            channel.send('You do not have permission to run this command.')
            return
        }
        
        const target = mentions.users.first()

        if (!target) {
            channel.send('Please mention a user to unmute: ' + syntax)
            return
        }
        split.shift()
        split.shift()
        const reason = split.join(',').replace(/,/g, ' ').split().slice()

        channel.send(`Successfully unmuted ${member} becouse "${reason}"`)
        guild.members.cache.get(id).send(`You have been unmuted for ${reason}`);



        const role = getRole(guild)
  
        member.roles.remove(role)
    })

    command(client, 'simjoin', message => {
        OnJoin(message.member)
    })

    command(client, 'mute', async (message) => {
        // !mute @ duration duration_type
    
        const syntax = '-mute <@> <duration as a number> <m, h, d, or perm> <reason>'
    
        const { member, channel, content, mentions, guild } = message
    
        if (!member.hasPermission('ADMINISTRATOR') || !member.hasPermission('MUTE_MEMBER')) {
          channel.send('You do not have permission to run this command.')
          return
        }
    
        const split = content.trim().split(' ')
    
        if (split.length < 5) {
          channel.send('Please use the correct command syntax: ' + syntax)
          return
        }
    
        const duration = split[2]
        const durationType = split[3]
        
        split.shift()
        split.shift()
        split.shift()
        split.shift()
        const reason = split.join(',').replace(/,/g, ' ').split().slice()
    
        if (isNaN(duration)) {
          channel.send('Please provide a number for the duration. ' + syntax)
          return
        }

    
        const durations = {
          m: 60,
          h: 60 * 60,
          d: 60 * 60 * 24,
          perm: -1,
        }
    
        if (!durations[durationType]) {
          channel.send('Please provide a valid duration type. ' + syntax)
          return
        }
    
        const seconds = duration * durations[durationType]

        const target = mentions.users.first()
        
        if (!target) {
            channel.send('Please mention a user to mute: ' + syntax)
            return
        }



        
        const { id } = target
        const targetmember = guild.members.cache.get(id)
        console.log(reason)
        giveRole(targetmember)

        channel.send(`Successfully muted ${member} for ${duration}${durationType} becouse "${reason}"`)
        guild.members.cache.get(id).send(`You have been muted for ${duration}${durationType} becouse "${reason}"`);

        const redisClient = await redis()
        try {
            const redisKey = `${redisKeyPrefix}${id}-${guild.id}-${reason}`


        if (seconds > 0) {
            redisClient.set(redisKey, 'true', 'EX', seconds)
        } else {
            redisClient.set(redisKey, 'true')
        }
        } finally {
            redisClient.quit()
        }
    })
}