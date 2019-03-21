class WebSocketsClient {
  constructor (ws) {
    this.resource = ws
    this.ID = 'ws'
  }
  to ({ delivery, channel, action, parameters, response, authentication }) {
    if (delivery) {
      if (typeof delivery === 'object') {
        this.resource.emit(channel, {
          action: action,
          parameters: parameters,
          recipient: delivery.recipient,
          authentication: authentication
        })
      }
    } else {
      this.resource.emit(channel, {
        action: action,
        parameters: parameters,
        authentication: authentication
      })
    }
    if (response && response.listen) {
      return this.on(response.listen.channel, response.listen.action, null, response.callback)
    }
  }
  on (channel, action, resource, callback, response) {
    this.resource.on(channel, data => {
      if (!action || data.action === action) {
        const callbackArguments = {
          protocol: this.ID,
          sender: this.resource.id,
          parameters: data.parameters,
          authentication: data.authentication,
          reply: (parameters) => this.to({
            channel: response ? response.channel : null,
            action: response ? response.action : null,
            parameters: parameters,
            response: { listen: null, resource }
          }),
          forwardObject: { recipientObject: data.recipient, action: data.action }
        }
        callback(callbackArguments)
      }
    })
  }
  disconnect (callback) { }
  loadListeners (bindings) {
    this.resource.on('connect', () => {
      bindings.forEach(binding => {
        this.resource.on(binding.channel, binding.action, null, binding.callback, binding.response)
      })
    })
  }
}

exports['default'] = WebSocketsClient
module.exports = exports['default']
