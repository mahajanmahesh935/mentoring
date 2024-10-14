const connectionsService = require('@services/connections')

module.exports = class Connection {
	async initiate(req) {
		try {
			return await connectionsService.initiate(req.body, req.decodedToken.id)
		} catch (error) {
			throw error
		}
	}

	async pending(req) {
		try {
			return await connectionsService.pending(req.decodedToken.id)
		} catch (error) {
			throw error
		}
	}

	async accept(req) {
		try {
			return await connectionsService.accept(req.body, req.decodedToken.id)
		} catch (error) {
			throw error
		}
	}

	async reject(req) {
		try {
			return await connectionsService.reject(req.body, req.decodedToken.id)
		} catch (error) {
			throw error
		}
	}
}
