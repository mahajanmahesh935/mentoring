const httpStatusCode = require('@generics/http-status')
const connectionQueries = require('@database/queries/connection')
const responses = require('@helpers/responses')
const menteeQueries = require('@database/queries/userExtension')
const { UniqueConstraintError } = require('sequelize')
const common = require('@constants/common')
const entityTypeService = require('@services/entity-type')
const entityTypeQueries = require('@database/queries/entityType')
const { Op } = require('sequelize')
const { getDefaultOrgId } = require('@helpers/getDefaultOrgId')
const { removeDefaultOrgEntityTypes } = require('@generics/utils')
const utils = require('@generics/utils')

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
			let connection = await connectionQueries.getConnection(userId, friendId)
			if (!connection) {
				connection = await connectionQueries.checkPendingRequest(userId, friendId)
			}

			const defaultOrgId = await getDefaultOrgId()
			if (!defaultOrgId) {
				return responses.failureResponse({
					message: 'DEFAULT_ORG_ID_NOT_SET',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const [userExtensionsModelName, userDetails] = await Promise.all([
				menteeQueries.getModelName(),
				menteeQueries.getMenteeExtension(friendId, ['user_id', 'name', 'designation', 'organization_id']),
			])

			let entityTypes = await entityTypeQueries.findUserEntityTypesAndEntities({
				status: 'ACTIVE',
				organization_id: {
					[Op.in]: [userDetails.organization_id, defaultOrgId],
				},
				model_names: { [Op.contains]: [userExtensionsModelName] },
				value: 'designation',
			})
			const validationData = removeDefaultOrgEntityTypes(entityTypes, userDetails.organization_id)
			const processedUserDetails = utils.processDbResponse(userDetails, validationData)

			if (!connection) {
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'CONNECTION_NOT_FOUND',
					result: { user_details: processedUserDetails },
				})
			}

			if (connection.status === common.CONNECTIONS_STATUS.BLOCKED) {
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'USER_NOT_FOUND',
				})
			}

			connection.user_details = processedUserDetails

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

			if (connections.count == 0 || connections.rows.length == 0) {
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'CONNECTION_LIST',
					result: {
						data: [],
						count: connections.count,
					},
				})
			}
			const friendIds = connections.rows.map((connection) => connection.friend_id)
			let friendDetails = await menteeQueries.getUsersByUserIds(friendIds, {
				attributes: ['user_id', 'name', 'designation', 'organization_id'],
			})
			const userExtensionsModelName = await menteeQueries.getModelName()

			const uniqueOrgIds = [...new Set(friendDetails.map((obj) => obj.organization_id))]
			friendDetails = await entityTypeService.processEntityTypesToAddValueLabels(
				friendDetails,
				uniqueOrgIds,
				userExtensionsModelName,
				'organization_id',
				['designation']
			)

			const friendDetailsMap = friendDetails.reduce((acc, friend) => {
				acc[friend.user_id] = friend
				return acc
			}, {})

			let connectionsWithDetails = connections.rows.map((connection) => {
				return {
					...connection,
					user_details: friendDetailsMap[connection.friend_id] || null,
				}
			})

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'CONNECTION_LIST',
				result: { data: connectionsWithDetails, count: connections.count },
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
	static async list(pageNo, pageSize, searchText, queryParams, userId, orgId) {
		try {
			let organizationIds = []

			if (queryParams.organization_ids) {
				organizationIds = queryParams.organization_ids.split(',')
			}

			const query = utils.processQueryParametersWithExclusions(queryParams)

			const userExtensionsModelName = await menteeQueries.getModelName()

			const validationData = await entityTypeQueries.findAllEntityTypesAndEntities({
				status: 'ACTIVE',
				allow_filtering: true,
				model_names: { [Op.contains]: [userExtensionsModelName] },
			})

			const filteredQuery = utils.validateAndBuildFilters(query, validationData, userExtensionsModelName)

			let extensionDetails = await connectionQueries.getConnectionsDetails(
				pageNo,
				pageSize,
				filteredQuery,
				searchText,
				userId,
				organizationIds
			)

			if (extensionDetails.count === 0 || extensionDetails.data.length === 0) {
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'CONNECTED_USERS_FETCHED',
					result: {
						data: [],
						count: extensionDetails.count,
					},
				})
			}

			if (extensionDetails.data.length > 0) {
				const uniqueOrgIds = [...new Set(extensionDetails.data.map((obj) => obj.organization_id))]

				extensionDetails.data = await entityTypeService.processEntityTypesToAddValueLabels(
					extensionDetails.data,
					uniqueOrgIds,
					userExtensionsModelName,
					'organization_id',
					['designation']
				)
			}

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'CONNECTED_USERS_FETCHED',
				result: extensionDetails,
			})
		} catch (error) {
			console.error('Error in list function:', error)
			throw error
		}
	}
}
