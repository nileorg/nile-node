const EventEmitter = require('events')
const Db = require('./Db')

module.exports = class Instance extends EventEmitter {
  constructor (protocol, protocols, db, ddbms) {
    super()
    this.protocol = protocol
    this.protocols = protocols
    this.db = new Db(db)
    this.ddbms = ddbms
    this.models = {}
    this.bindings = []
  }
  loadListeners () {
    for (let protocolId in this.protocols) {
      let protocol = this.protocols[protocolId]
      protocol.loadListeners(this.bindings)
    }
  }
  async login ({ token }) {
    this.protocols[this.protocol].to({
      channel: 'node.to.instance',
      action: 'login',
      authentication: {
        token: token
      },
      response: {
        listen: {
          channel: 'instance.to.node',
          action: 'logged'
        },
        callback: function (res) {
          this.emit('logged', {
            success: res.parameters.success,
            id: res.parameters.id,
            components: res.parameters.components,
            queue: res.parameters.queue
          })
        }.bind(this)
      }
    })
  }
  async register ({ components, information }) {
    const hash = await this.ddbms.ipfs.add(components)
    const parameters = {
      information: information,
      components: 'ipfs://' + hash
    }
    this.protocols[this.protocol].to({
      channel: 'node.to.instance',
      action: 'register',
      parameters: parameters,
      response: {
        listen: {
          channel: 'instance.to.node',
          action: 'registerConfirm'
        },
        callback: function (res) {
          this.emit('registerRequestReceived', { id: res.parameters.id, token: res.parameters.token })
        }.bind(this)
      }
    })
  }
}
