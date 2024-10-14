const httpStatusCode = require('@generics/http-status')
const connectionQueries = require('@database/queries/connection')
const responses = require('@helpers/responses')
const menteeQueries = require('@database/queries/userExtension')
const { UniqueConstraintError } = require('sequelize')
const common = require('@constants/common')

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
			const connectionExists = await connectionQueries.getConnection(userId, bodyData.user_id)

			if (connectionExists?.status == common.CONNECTIONS_STATUS.BLOCKED) {
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'USER_NOT_FOUND',
				})
			}

			if (connectionExists) {
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
	static async getInfo(friendId, userId) {
		try {
			const connection = await connectionQueries.getConnection(userId, friendId)

			if (!connection) {
				return responses.failureResponse({
					statusCode: httpStatusCode.not_found,
					message: 'CONNECTION_NOT_FOUND',
				})
			}

			if (connection.status === common.CONNECTIONS_STATUS.BLOCKED) {
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'USER_NOT_FOUND',
				})
			}

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'CONNECTION_DETAILS',
				result: connection,
			})
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	static async pending(userId, pageNo, pageSize) {
		try {
			const connections = await connectionQueries.getPendingRequests(userId, pageNo, pageSize)
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'CONNECTION_LIST',
				result: { data: connections.rows, count: connections.count },
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
