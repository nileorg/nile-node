const WebSocketsClient = require('./protocols/WebSocketsClient')

const Node = require('./Node')

const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(':memory:')

// Initialize an websocket server
const io = require('socket.io-client')
const socket = io.connect('http://173.18.0.24:3001/')

// initialize ipfs
const IPFS = require('ipfs')
let ipfsNode = new IPFS({
  silent: true,
  repo: 'var/node',
  config: {
    Addresses: {
      Swarm: ['/ip4/0.0.0.0/tcp/0']
    }
  }
})

const Ipfs = require('../src/ddbms/Ipfs')
let ddbms = {}
const ipfsddbms = new Ipfs(ipfsNode)
ddbms[ipfsddbms.ID] = ipfsddbms

// Initialize the Node with the object
let node = new Node('ws-client', {
  'ws-client': new WebSocketsClient(socket)
}, null, ddbms)

node.on('registerRequestReceived', e => console.log(e))

socket.on('connect', () => {
  ipfsNode.on('ready', () => {
    node.register({
      components: [
        {
          'type': 'button',
          'action': 'function1',
          'parameters': ['inp1'],
          'label': 'Call function1'
        },
        {
          'type': 'text',
          'key': 'inp1'
        },
        {
          'type': 'output',
          'key': 'out1'
        }
      ],
      information: { name: "prova" }
    })
  })
})

node.loadListeners()
