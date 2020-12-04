const redis = require('redis')
const { redisPath } = 'process.env.redisPath'




module.exports = async () => {
    return await new Promise((resolve ,reject) => {
     let Client
      if(process.env.redisPath){
        Client = redis.createClient(process.env.redisPath)
        Client = redis.createClient(redisURL)
      } else {
        Client = redis.createClient()
      }

        client.on('error', (err) => {
            console.log('Redis Error:', err)
            client.quit()
            reject(err)
        })

        client.on('ready', () => {
            resolve(client)
            
        })
    })
}

module.exports.expire = (callback) => {
    const expired = () => {
      const sub = redis.createClient({ url: redisPath })
      sub.subscribe('__keyevent@0__:expired', () => {
        sub.on('message', (channel, message) => {
          callback(message)
        })
      })
    }
  
    const pub = redis.createClient({ url: redisPath })
    pub.send_command('config', ['set', 'notify-keyspace-events', 'Ex'], expired())
  }
