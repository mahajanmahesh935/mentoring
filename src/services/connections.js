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
	/**
	 * Check if a connection request already exists between two users.
	 * @param {string} userId - The ID of the user making the request.
	 * @param {string} targetUserId - The ID of the target user.
	 * @returns {Promise<Object|undefined>} The connection request if it exists, otherwise a failure response.
	 */
	static async checkConnectionRequestExists(userId, targetUserId) {
		const connectionRequest = await connectionQueries.findOneRequest(userId, targetUserId)
		if (!connectionRequest) {
			return false
		}
		return connectionRequest
	}

	/**
	 * Initiates a connection request between two users.
	 * @param {Object} bodyData - The request body containing user information.
	 * @param {string} bodyData.user_id - The ID of the target user.
	 * @param {string} userId - The ID of the user initiating the request.
	 * @returns {Promise<Object>} A success or failure response.
	 */
	static async initiate(bodyData, userId) {
		try {
			// Check if the target user exists
			const userExists = await menteeQueries.getMenteeExtension(bodyData.user_id)
			if (!userExists) {
				return responses.failureResponse({
					statusCode: httpStatusCode.not_found,
					message: 'USER_NOT_FOUND',
				})
			}

			// Check if a connection already exists between the users
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

			// Create a new connection request
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

	/**
	 * Get information about the connection between two users.
	 * @param {string} friendId - The ID of the friend or target user.
	 * @param {string} userId - The ID of the authenticated user.
	 * @returns {Promise<Object>} The connection details or appropriate error.
	 */
	static async getInfo(friendId, userId) {
		try {
			let connection = await connectionQueries.getConnection(userId, friendId)

			if (!connection) {
				// If no connection is found, check for pending requests
				connection = await connectionQueries.checkPendingRequest(userId, friendId)
			}

			if (!connection) {
				// If still no connection, check for the deleted request
				connection = await connectionQueries.getRejectedRequest(userId, friendId)
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
				menteeQueries.getMenteeExtension(friendId, [
					'name',
					'user_id',
					'mentee_visibility',
					'organization_id',
					'designation',
					'area_of_expertise',
					'education_qualification',
					'custom_entity_text',
					'meta',
					'is_mentor',
				]),
			])

			if (connection?.status === common.CONNECTIONS_STATUS.BLOCKED || !userDetails) {
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'USER_NOT_FOUND',
				})
			}

			// Fetch entity types associated with the user
			let entityTypes = await entityTypeQueries.findUserEntityTypesAndEntities({
				status: 'ACTIVE',
				organization_id: {
					[Op.in]: [userDetails.organization_id, defaultOrgId],
				},
				model_names: { [Op.contains]: [userExtensionsModelName] },
			})
			const validationData = removeDefaultOrgEntityTypes(entityTypes, userDetails.organization_id)
			const processedUserDetails = utils.processDbResponse(userDetails, validationData)

			//To be removed later.
			processedUserDetails.image = 'https://picsum.photos/200'

			if (!connection) {
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'CONNECTION_NOT_FOUND',
					result: { user_details: processedUserDetails },
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

	/**
	 * Get a list of pending connection requests for a user.
	 * @param {string} userId - The ID of the user.
	 * @param {number} pageNo - The page number for pagination.
	 * @param {number} pageSize - The number of records per page.
	 * @returns {Promise<Object>} The list of pending connection requests.
	 */
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

			// Map friend details by user IDs
			const friendIds = connections.rows.map((connection) => connection.friend_id)
			let friendDetails = await menteeQueries.getUsersByUserIds(friendIds, {
				attributes: [
					'name',
					'user_id',
					'mentee_visibility',
					'organization_id',
					'designation',
					'area_of_expertise',
					'education_qualification',
					'custom_entity_text',
					'meta',
				],
			})

			const userExtensionsModelName = await menteeQueries.getModelName()

			const uniqueOrgIds = [...new Set(friendDetails.map((obj) => obj.organization_id))]
			friendDetails = await entityTypeService.processEntityTypesToAddValueLabels(
				friendDetails,
				uniqueOrgIds,
				userExtensionsModelName,
				'organization_id'
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

			//To be removed later
			connectionsWithDetails.forEach((detail) => {
				detail.user_details.image = 'https://picsum.photos/200'
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

	/**
	 * Accept a pending connection request.
	 * @param {Object} bodyData - The body data containing the target user ID.
	 * @param {string} bodyData.user_id - The ID of the target user.
	 * @param {string} userId - The ID of the authenticated user.
	 * @returns {Promise<Object>} A success response indicating the request was accepted.
	 */
	static async accept(bodyData, userId) {
		try {
			const connectionRequest = await this.checkConnectionRequestExists(userId, bodyData.user_id)
			if (!connectionRequest)
				return responses.failureResponse({
					message: 'CONNECTION_REQUEST_NOT_FOUND_OR_ALREADY_PROCESSED',
					statusCode: httpStatusCode.not_found,
					responseCode: 'CLIENT_ERROR',
				})

			const approvedResponse = await connectionQueries.approveRequest(
				userId,
				bodyData.user_id,
				connectionRequest.meta
			)
			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'CONNECTION_REQUEST_APPROVED',
				result: approvedResponse[0],
			})
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	/**
	 * Reject a pending connection request.
	 * @param {Object} bodyData - The body data containing the target user ID.
	 * @param {string} bodyData.user_id - The ID of the target user.
	 * @param {string} userId - The ID of the authenticated user.
	 * @returns {Promise<Object>} A success response indicating the request was rejected.
	 */
	static async reject(bodyData, userId) {
		try {
			const connectionRequest = await this.checkConnectionRequestExists(userId, bodyData.user_id)
			if (!connectionRequest)
				return responses.failureResponse({
					message: 'CONNECTION_REQUEST_NOT_FOUND_OR_ALREADY_PROCESSED',
					statusCode: httpStatusCode.not_found,
					responseCode: 'CLIENT_ERROR',
				})

			const [rejectedCount, rejectedData] = await connectionQueries.rejectRequest(userId, bodyData.user_id)

			if (rejectedCount == 0) {
				return responses.failureResponse({
					message: 'CONNECTION_REQUEST_NOT_FOUND_OR_ALREADY_PROCESSED',
					statusCode: httpStatusCode.not_found,
					responseCode: 'CLIENT_ERROR',
				})
			}
			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'CONNECTION_REQUEST_REJECTED',
			})
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	/**
	 * Fetch a list of connections based on query parameters and filters.
	 * @param {number} pageNo - The page number for pagination.
	 * @param {number} pageSize - The number of records per page.
	 * @param {string} searchText - The search text to filter results.
	 * @param {Object} queryParams - The query parameters for filtering.
	 * @param {string} userId - The ID of the authenticated user.
	 * @param {string} orgId - The organization ID for filtering.
	 * @returns {Promise<Object>} A list of filtered connections.
	 */
	static async list(pageNo, pageSize, searchText, queryParams, userId, orgId) {
		try {
			let organizationIds = []

			if (queryParams.organization_ids) {
				organizationIds = queryParams.organization_ids.split(',')
			}

			const query = utils.processQueryParametersWithExclusions(queryParams)
			const userExtensionsModelName = await menteeQueries.getModelName()

			// Fetch validation data for filtering connections (excluding roles)
			const validationData = await entityTypeQueries.findAllEntityTypesAndEntities({
				status: 'ACTIVE',
				allow_filtering: true,
				model_names: { [Op.contains]: [userExtensionsModelName] },
			})

			const filteredQuery = utils.validateAndBuildFilters(query, validationData, userExtensionsModelName)

			let roles = []
			if (queryParams.roles) {
				roles = queryParams.roles.split(',')
			}

			let extensionDetails = await connectionQueries.getConnectionsDetails(
				pageNo,
				pageSize,
				filteredQuery,
				searchText,
				userId,
				organizationIds,
				roles
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
					'organization_id'
				)
			}

			//To be removed later
			extensionDetails.data.forEach((detail) => {
				detail.image = 'https://picsum.photos/200'
			})

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
