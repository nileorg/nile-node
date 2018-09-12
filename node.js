const EventEmitter = require('events')

class Node extends EventEmitter {
	constructor(ws, ipfs) {
		super()
		this.ws = ws
		this.ipfs = ipfs
		this.loadListeners()
	}
	loadListeners() {
		this.ws.on("instance.to.node", data => this.processInstanceRequest(data))
		this.ws.on("client.to.node", data => this.processClientRequest(data))
	}
	processClientRequest(request) {
		let f_string = this.actions[request.content.action]
		let f = new Function("parameters", "reply", f_string)
		const sender = request.sender
		f(request.content.parameters, (response) => {
			this.ws.emit("node.to.instance", {
				action: "forward",
				recipient: sender,
				parameters: response
			})
		});
	}
	processInstanceRequest(request) {
		if (request.server) {
			switch (request.action) {
				case 'registered': {
					this.registered(request.parameters)
				} break;
				case 'logged': {
					this.logged(request.parameters)
				}
			}
		}
	}
	async login() {
		this.ws.emit("node.to.instance", {
			action: "login",
			parameters: {
				token: this.token
			}
		})
	}
	async logged(parameters) {
		this.hash = parameters.hash
		let properties_file = ''
		this.ipfs.files.get(this.hash, (err, files) => {
			files.forEach(file => { properties_file += file.content.toString() })
			let properties = JSON.parse(properties_file)
			this.information = properties.information
			this.components = properties.components
			this.actions = properties.actions
			this.emit("logged", {
				information: this.information,
				components: this.components,
				actions: this.actions,
			})
		})
	}
	async register() {
		this.ipfs.files.add(Buffer.from(JSON.stringify({
			information: this.information,
			components: this.components,
			actions: this.actions,
		})), (err, files) => {
			this.hash = files[0].hash
			this.ws.emit("node.to.instance", {
				action: "register",
				parameters: {
					hash: this.hash,
					information: this.information
				}
			})
		})
	}
	async registered(parameters) {
		this.token = parameters.token
		this.emit("registered", {
			token: this.token
		})
	}
}

module.exports = Node