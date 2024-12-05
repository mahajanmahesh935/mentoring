const menteesService = require('@services/mentees')
const mentorsService = require('@services/mentors')
const { isAMentor } = require('@generics/utils')

module.exports = class Mentees {
	/**
	 * Create a new mentor or mentee extension.
	 * @method
	 * @name create
	 * @param {Object} req - Request data.
	 * @param {Object} req.body - Mentee extension data excluding user_id.
	 * @returns {Promise<Object>} - Created mentee extension details.
	 */
	async create(req) {
		try {
			if (isAMentor(req.decodedToken.roles)) {
				return await mentorsService.createMentorExtension(
					req.body,
					req.decodedToken.id,
					req.decodedToken.organization_id
				)
			}
			return await menteesService.createMenteeExtension(
				req.body,
				req.decodedToken.id,
				req.decodedToken.organization_id
			)
		} catch (error) {
			console.error(error)
			return error
		}
	}

	/**
	 * Update a mentor or mentee extension.
	 * @method
	 * @name update
	 * @param {Object} req - Request data.
	 * @param {String} req.decodedToken.id - User ID of the user.
	 * @param {Object} req.body - Updated user extension data excluding user_id.
	 * @returns {Promise<Object>} - Updated user extension details.
	 */
	async update(req) {
		try {
			if (isAMentor(req.decodedToken.roles)) {
				return await mentorsService.updateMentorExtension(
					req.body,
					req.decodedToken.id,
					req.decodedToken.organization_id
				)
			}
			return await menteesService.updateMenteeExtension(
				req.body,
				req.decodedToken.id,
				req.decodedToken.organization_id
			)
		} catch (error) {
			return error
		}
	}

	/**
	 * Get mentor or mentee extension by user ID.
	 * @method
	 * @name getExtension
	 * @param {Object} req - Request data.
	 * @param {String} req.params.id - User ID of the user.
	 * @returns {Promise<Object>} - user extension details.
	 */
	async getExtension(req) {
		try {
			if (isAMentor(req.decodedToken.roles)) {
				return await mentorsService.getMentorExtension(req.query.id || req.decodedToken.id)
			}
			return await menteesService.getMenteeExtension(req.decodedToken.id, req.decodedToken.organization_id) // params since read will be public for mentees
		} catch (error) {
			return error
		}
	}

	/**
	 * Get mentor or mentee extension by user ID.
	 * @method
	 * @name read
	 * @param {Object} req - Request data.
	 * @param {String} req.params.id - User ID of the user.
	 * @returns {Promise<Object>} - user extension details.
	 */
	async read(req) {
		try {
			if (isAMentor(req.decodedToken.roles)) {
				return await mentorsService.read(req.decodedToken.id, req.decodedToken.organization_id)
			}
			return await menteesService.read(
				req.decodedToken.id,
				req.decodedToken.organization_id,
				req.decodedToken.roles
			)
		} catch (error) {
			return error
		}
	}

	/**
	 * Filter list
	 * @method
	 * @name filterList
	 * @param {Object} req - request data.
	 * @param {String} req.decodedToken.token - user token.
	 * @returns {JSON} - filter list.
	 */

	async filterList(req) {
		try {
			const filterList = await menteesService.getFilterList(
				req.query.organization ? req.query.organization : 'true',
				req.query.entity_types ? req.query.entity_types : '',
				req.query.filter_type ? req.query.filter_type : '',
				req.decodedToken
			)
			return filterList
		} catch (error) {
			return error
		}
	}

	/**
	 * Get mentor or mentee extension by user ID.
	 * @method
	 * @name getExtension
	 * @param {Object} req - Request data.
	 * @param {String} req.params.id - User ID of the user.
	 * @returns {Promise<Object>} - user extension details.
	 */
	async getCommunicationToken(req) {
		try {
			return await menteesService.getCommunicationToken(req.decodedToken.id) // params since read will be public for mentees
		} catch (error) {
			return error
		}
	}

	/**
	 * Logs out a mentee by terminating their session.
	 *
	 * This function retrieves the mentee's ID from the decoded token in the request
	 * and calls the `logout` method in `menteesService` to handle session termination.
	 * Any errors during the process are caught and returned.
	 *
	 * @async
	 * @function logout
	 * @param {Object} req - The request object containing authentication details.
	 * @param {Object} req.decodedToken - The decoded token from the authenticated request.
	 * @param {string} req.decodedToken.id - The ID of the mentee extracted from the decoded token.
	 * @returns {Promise<*>} Returns a promise that resolves with the result of `menteesService.logout` if successful,
	 * or the caught error if an error occurs.
	 */
	async logout(req) {
		try {
			return await menteesService.logout(req.decodedToken.id) // Params since read will be public for mentees
		} catch (error) {
			return error
		}
	}

	//To be enabled when delete flow is needed.
	// /**
	//  * Delete a mentee extension by user ID.
	//  * @method
	//  * @name deleteMenteeExtension
	//  * @param {Object} req - Request data.
	//  * @param {String} req.decodedToken.id - User ID of the mentee.
	//  * @returns {Promise<Boolean>} - True if deleted successfully, otherwise false.
	//  */
	// async delete(req) {
	// 	try {
	// 		if (isAMentor(req.decodedToken.roles)) {
	// 			return await mentorsService.deleteMentorExtension(req.body, req.decodedToken.id)
	// 		}
	// 		return await menteesService.deleteMenteeExtension(req.decodedToken.id)
	// 	} catch (error) {
	// 		return error
	// 	}
	// }
}
