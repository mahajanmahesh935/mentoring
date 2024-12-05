'use strict'
const communicationRequests = require('@requests/communications')
const userExtensionQueries = require('@database/queries/userExtension')
const emailEncryption = require('@utils/emailEncryption')
const common = require('@constants/common')
/**
 * Logs in a user and retrieves authentication token and user ID.
 * @async
 * @param {string} userId - Unique identifier of the user.
 * @returns {Promise<Object>} An object containing auth_token and user_id if login is successful.
 * @throws Will throw an error if the login request fails for reasons other than unauthorized access.
 */
exports.login = async (userId) => {
	try {
		const login = await communicationRequests.login({ userId })
		return {
			auth_token: login.result.auth_token,
			user_id: login.result.user_id,
		}
	} catch (error) {
		if (error.message === common.COMMUNICATION.UNAUTHORIZED) {
			console.error('Error: Unauthorized access during login. Please check your tokens.')
		}
		throw error
	}
}

/**
 * Logs out a user from the communication service.
 * @async
 * @param {string} userId - Unique identifier of the user.
 * @returns {Promise<Object>} The status of the logout operation.
 * @throws Will throw an error if the logout request fails for reasons other than unauthorized access.
 */
exports.logout = async (userId) => {
	try {
		const logout = await communicationRequests.logout({ userId })
		return logout.result.status
	} catch (error) {
		if (error.message === common.COMMUNICATION.UNAUTHORIZED) {
			console.error('Error: Unauthorized access during logout. Please check your tokens.')
		}
		throw error
	}
}

/**
 * Creates a new user in the communication system, then updates the user's metadata.
 * @async
 * @param {string} userId - Unique identifier of the user.
 * @param {string} name - Name of the user.
 * @param {string} email - Email of the user.
 * @param {string} image - URL of the user's profile image.
 * @returns {Promise<Object>} An object containing the user_id from the communication service.
 * @throws Will throw an error if the signup request fails for reasons other than unauthorized access.
 */
exports.create = async (userId, name, email, image) => {
	try {
		const signup = await communicationRequests.signup({ userId, name, email, image })

		if (signup.result.user_id) {
			// Update the user's metadata with the communication service user ID
			const [updateCount, updatedUser] = await userExtensionQueries.updateMenteeExtension(
				userId,
				{ meta: { communications_user_id: signup.result.user_id } },
				{
					returning: true,
					raw: true,
				}
			)
		}
		return {
			user_id: signup.result.user_id,
		}
	} catch (error) {
		if (error.message === common.COMMUNICATION.UNAUTHORIZED) {
			console.error('Error: Unauthorized access during signup. Please check your tokens.')
		}
		throw error
	}
}

/**
 * Creates a chat room between two users. If a user lacks a communications ID, it creates one.
 * @async
 * @param {string} recipientUserId - The ID of the user to receive the chat room invite.
 * @param {string} initiatorUserId - The ID of the user initiating the chat room.
 * @param {string} initialMessage - An initial message to be sent in the chat room.
 * @returns {Promise<Object>} The response from the communication service upon creating the chat room.
 * @throws Will throw an error if the request to create a chat room fails.
 */
exports.createChatRoom = async (recipientUserId, initiatorUserId, initialMessage) => {
	try {
		// Retrieve user details, ensuring each has a `communications_user_id`
		let userDetails = await userExtensionQueries.getUsersByUserIds(
			[initiatorUserId, recipientUserId],
			{
				attributes: ['name', 'user_id', 'email', 'meta'],
			},
			true
		)

		// Loop through users to ensure they have a `communications_user_id`
		for (const user of userDetails) {
			if (!user.meta || !user.meta.communications_user_id) {
				// Decrypt email and create user in communication service if `communications_user_id` is missing
				user.email = await emailEncryption.decrypt(user.email)
				await this.create(user.user_id, user.name, user.email, 'https://picsum.photos/200/200')
			}
		}

		// Create the chat room after ensuring all users have `communications_user_id`
		const chatRoom = await communicationRequests.createChatRoom({
			userIds: [initiatorUserId, recipientUserId],
			initialMessage: initialMessage,
		})
		return chatRoom
	} catch (error) {
		console.error('Create Room Failed:', error)
		throw error
	}
}
