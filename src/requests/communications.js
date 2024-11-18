// File: communications.js

const axios = require('axios')
const apiEndpoints = require('@constants/endpoints')

const baseUrl = process.env.COMMUNICATION_SERVICE_HOST + process.env.COMMUNICATION_SERVICE_BASE_URL
const internalAccessToken = process.env.INTERNAL_ACCESS_TOKEN

// Create Axios instance with default configurations for base URL and headers
const apiClient = axios.create({
	baseURL: baseUrl,
	headers: {
		internal_access_token: internalAccessToken,
	},
})

// Axios response interceptor to handle specific HTTP errors centrally
apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response && error.response.status === 401) {
			console.error('Unauthorized: 401 error')
			return Promise.reject(new Error('unauthorized'))
		}
		return Promise.reject(error)
	}
)

/**
 * Signs up a new user with the communication service.
 * @async
 * @param {Object} params - Parameters for signup.
 * @param {string} params.userId - The unique identifier for the user.
 * @param {string} params.name - The name of the user.
 * @param {string} params.email - The email of the user.
 * @param {string} params.image - URL for the user's profile image.
 * @returns {Promise<Object>} The response data from the signup request.
 * @throws Will throw an error if the signup request fails.
 */
exports.signup = async ({ userId, name, email, image }) => {
	try {
		const url = apiEndpoints.COMMUNICATION_SIGNUP
		const body = { user_id: userId, name, email, image_url: image }

		const response = await apiClient.post(url, body)
		return response.data
	} catch (err) {
		console.error('Signup error:', err.message)
		throw err
	}
}

/**
 * Logs in a user with the communication service.
 * @async
 * @param {Object} params - Parameters for login.
 * @param {string} params.userId - The unique identifier for the user.
 * @returns {Promise<Object>} The response data from the login request.
 * @throws Will throw an error if the login request fails.
 */
exports.login = async ({ userId }) => {
	try {
		const url = apiEndpoints.COMMUNICATION_LOGIN
		const body = { user_id: userId }

		const response = await apiClient.post(url, body)
		return response.data
	} catch (err) {
		console.error('Login error:', err.message)
		throw err
	}
}

/**
 * Logs out a user from the communication service.
 * @async
 * @param {Object} params - Parameters for logout.
 * @param {string} params.userId - The unique identifier for the user.
 * @returns {Promise<Object>} The response data from the logout request.
 * @throws Will throw an error if the logout request fails.
 */
exports.logout = async ({ userId }) => {
	try {
		const url = apiEndpoints.COMMUNICATION_LOGOUT
		const body = { user_id: userId }

		const response = await apiClient.post(url, body)
		return response.data
	} catch (err) {
		console.error('Logout error:', err.message)
		throw err
	}
}

/**
 * Creates a chat room with an optional initial message.
 * @async
 * @param {Object} params - Parameters for creating a chat room.
 * @param {Array<string>} params.userIds - Array of user IDs to be added to the chat room.
 * @param {string} [params.initialMessage] - An optional initial message for the chat room.
 * @returns {Promise<Object>} The response data from the create chat room request.
 * @throws Will throw an error if the request fails.
 */
exports.createChatRoom = async ({ userIds, initialMessage }) => {
	try {
		const url = apiEndpoints.COMMUNICATION_CREATE_CHAT_ROOM
		const body = { usernames: userIds, initial_message: initialMessage }

		const response = await apiClient.post(url, body)
		return response.data
	} catch (err) {
		console.error('Create Chat Room error:', err.message)
		throw err
	}
}
