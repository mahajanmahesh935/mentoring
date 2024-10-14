const httpStatusCode = require('@generics/http-status')
const connectionQueries = require('@database/queries/connection')
const responses = require('@helpers/responses')
const menteeQueries = require('@database/queries/userExtension')
const { UniqueConstraintError } = require('sequelize')

module.exports = class ConnectionHelper {
	static async checkConnectionRequestExists(userId, targetUserId) {
		const connectionRequest = await connectionQueries.findOneRequest(userId, targetUserId)
		if (!connectionRequest) {
			return responses.failureResponse({
				statusCode: httpStatusCode.not_found,
				message: 'CONNECTION_REQUEST_NOT_FOUND',
			})
		}
		return connectionRequest
	}

	static async initiate(bodyData, userId) {
		try {
			const userExists = await menteeQueries.getMenteeExtension(bodyData.user_id)
			if (!userExists) {
				return responses.failureResponse({
					statusCode: httpStatusCode.not_found,
					message: 'USER_NOT_FOUND',
				})
			}
			const connectionExits = await connectionQueries.getConnection(userId, bodyData.user_id)
			if (connectionExits) {
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'CONNECTION_EXITS',
				})
			}
			const friendRequestResult = await connectionQueries.addFriendRequest(
				userId,
				bodyData.user_id,
				bodyData.message
			)
			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'CONNECTION_REQUEST_SEND_SUCCESSFULLY',
				result: friendRequestResult,
			})
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return responses.failureResponse({
					message: 'CONNECTION_REQUEST_EXISTS',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			console.error(error)
			throw error
		}
	}

	static async pending(userId) {
		try {
			const connections = await connectionQueries.getPendingRequests(userId)
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'CONNECTION_LIST',
				result: connections,
			})
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	static async accept(bodyData, userId) {
		try {
			const connectionRequest = await this.checkConnectionRequestExists(userId, bodyData.user_id)
			if (!connectionRequest) return connectionRequest

			const approvedResponse = await connectionQueries.approveRequest(
				userId,
				bodyData.user_id,
				connectionRequest.meta
			)
			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'CONNECTION_REQUEST_APPROVED',
				result: approvedResponse,
			})
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	static async reject(bodyData, userId) {
		try {
			const connectionRequest = await this.checkConnectionRequestExists(userId, bodyData.user_id)
			if (!connectionRequest) return connectionRequest

			const rejectedRequest = await connectionQueries.rejectRequest(userId, bodyData.user_id)
			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'CONNECTION_REQUEST_REJECTED',
				result: rejectedRequest,
			})
		} catch (error) {
			console.error(error)
			throw error
		}
	}
}
