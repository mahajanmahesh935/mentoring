// Dependencies
const httpStatusCode = require('@generics/http-status')
const common = require('@constants/common')
const userRequests = require('@requests/user')
const menteeQueries = require('@database/queries/userExtension')
const mentorQueries = require('@database/queries/mentorExtension')
const responses = require('@helpers/responses')

const organisationExtensionQueries = require('@database/queries/organisationExtension')
const mentorsService = require('@services/mentors')
const menteesService = require('@services/mentees')
const orgAdminService = require('@services/org-admin')

module.exports = class UserHelper {
	/**
	 * Get user list.
	 * @method
	 * @name create
	 * @param {String} userType 				- mentee/mentor.
	 * @param {Number} pageSize 				- Page size.
	 * @param {Number} pageNo 					- Page number.
	 * @param {String} searchText 				- Search text.
	 * @param {Number} searchText 				- userId.
	 * @returns {JSON} 							- User list.
	 */

	static async list(userType, pageNo, pageSize, searchText) {
		try {
			const userDetails = await userRequests.list(userType, pageNo, pageSize, searchText)
			const ids = userDetails.data.result.data.map((item) => item.values[0].id)

			let extensionDetails
			if (userType == common.MENTEE_ROLE) {
				extensionDetails = await menteeQueries.getUsersByUserIds(ids, {
					attributes: ['user_id', 'rating'],
				})
			} else if (userType == common.MENTOR_ROLE) {
				extensionDetails = await mentorQueries.getMentorsByUserIds(ids, {
					attributes: ['user_id', 'rating', 'mentor_visibility', 'organization_id'],
				})
				// Inside your function
				extensionDetails = extensionDetails.filter((item) => item.mentor_visibility && item.organization_id)
			}
			const extensionDataMap = new Map(extensionDetails.map((newItem) => [newItem.user_id, newItem]))

			userDetails.data.result.data = userDetails.data.result.data.filter((existingItem) => {
				const user_id = existingItem.values[0].id
				if (extensionDataMap.has(user_id)) {
					const newItem = extensionDataMap.get(user_id)
					existingItem.values[0] = { ...existingItem.values[0], ...newItem }
					delete existingItem.values[0].user_id
					delete existingItem.values[0].mentor_visibility
					delete existingItem.values[0].organization_id
					return true // Keep this item
				}

				return false // Remove this item
			})

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: userDetails.data.message,
				result: userDetails.data.result,
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	static async create(decodedToken) {
		try {
			const isNewUser = await this.#checkUserExistence(decodedToken.id)
			if (isNewUser) {
				const result = await this.#createOrUpdateUserAndOrg(decodedToken.id, isNewUser)
				return result
			} else {
				const menteeExtension = await menteeQueries.getMenteeExtension(decodedToken.id)

				if (!menteeExtension) {
					return responses.failureResponse({
						statusCode: httpStatusCode.not_found,
						message: 'USER_NOT_FOUND',
					})
				}

				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'USER_DETAILS_FETCHED_SUCCESSFULLY',
					result: menteeExtension,
				})
			}
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	static async update(updateData) {
		try {
			const userId = updateData.userId
			const isNewUser = await this.#checkUserExistence(userId)
			const result = await this.#createOrUpdateUserAndOrg(userId, isNewUser)
			return result
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	static async #createOrUpdateUserAndOrg(userId, isNewUser) {
		const userDetails = await userRequests.fetchUserDetails({ userId })
		if (!userDetails?.data?.result) {
			return responses.failureResponse({
				message: 'SOMETHING_WENT_WRONG',
				statusCode: httpStatusCode.not_found,
				responseCode: 'UNAUTHORIZED',
			})
		}

		const validationError = await this.#validateUserDetails(userDetails)

		if (validationError) {
			return responses.failureResponse({
				message: validationError,
				statusCode: httpStatusCode.not_found,
				responseCode: 'UNAUTHORIZED',
			})
		}

		const orgExtension = await this.#createOrUpdateOrg({ id: userDetails.data.result.organization_id })

		if (!orgExtension) {
			return responses.failureResponse({
				message: 'ORG_EXTENSION_NOT_FOUND',
				statusCode: httpStatusCode.not_found,
				responseCode: 'UNAUTHORIZED',
			})
		}
		const userExtensionData = this.#getExtensionData(userDetails.data.result, orgExtension)

		const createOrUpdateResult = isNewUser
			? await this.#createUser(userExtensionData)
			: await this.#updateUser(userExtensionData)
		if (createOrUpdateResult.statusCode != httpStatusCode.ok) return createOrUpdateResult
		else
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'PROFILE_CREATED_SUCCESSFULLY',
				result: createOrUpdateResult.result,
			})
	}

	static #getExtensionData(userDetails, orgExtension) {
		return {
			id: userDetails.id,
			organization: {
				id: orgExtension.organization_id,
			},
			roles: userDetails.user_roles,
			email: userDetails.email,
			phone: userDetails.phone,
			name: userDetails.name,
			skipValidation: true,
			competency: userDetails.competency,
			designation: userDetails.designation,
			language: userDetails.language,
			image: userDetails.image ? userDetails.image : '',
		}
	}

	static async #createOrUpdateOrg(orgData) {
		let orgExtension = await organisationExtensionQueries.getById(orgData.id)
		if (orgExtension) return orgExtension

		const orgExtensionData = {
			...common.getDefaultOrgPolicies(),
			organization_id: orgData.id,
			created_by: 1,
			updated_by: 1,
		}
		orgExtension = await organisationExtensionQueries.upsert(orgExtensionData)
		return orgExtension.toJSON()
	}

	static async #createUser(userExtensionData) {
		const isAMentor = userExtensionData.roles.some((role) => role.title == common.MENTOR_ROLE)
		const orgId = userExtensionData.organization.id
		const user = isAMentor
			? await mentorsService.createMentorExtension(userExtensionData, userExtensionData.id, orgId)
			: await menteesService.createMenteeExtension(userExtensionData, userExtensionData.id, orgId)
		return user
	}

	static #checkOrgChange = (existingOrgId, newOrgId) => existingOrgId !== newOrgId

	static async #updateUser(userExtensionData) {
		const isAMentee = userExtensionData.roles.some((role) => role.title === common.MENTEE_ROLE)
		const roleChangePayload = {
			user_id: userExtensionData.id,
			organization_id: userExtensionData.organization.id,
		}

		let isRoleChanged = false

		const menteeExtension = await menteeQueries.getMenteeExtension(userExtensionData.id, [
			'organization_id',
			'is_mentor',
		])

		if (!menteeExtension) throw new Error('User Not Found')

		if (isAMentee && menteeExtension.is_mentor) {
			roleChangePayload.current_roles = [common.MENTOR_ROLE]
			roleChangePayload.new_roles = [common.MENTEE_ROLE]
			isRoleChanged = true
		} else if (!isAMentee && !menteeExtension.is_mentor) {
			roleChangePayload.current_roles = [common.MENTEE_ROLE]
			roleChangePayload.new_roles = [common.MENTOR_ROLE]
			isRoleChanged = true
		}

		if (isRoleChanged) {
			//If role is changed, the role change, org policy changes for that user
			//and additional data update of the user is done by orgAdmin's roleChange workflow
			const roleChangeResult = await orgAdminService.roleChange(roleChangePayload, userExtensionData)
			return roleChangeResult
		} else {
			//If role is not changed, org policy changes along with other user data updation is done
			//using the updateMentee or updateMentor workflows
			const user = isAMentee
				? await menteesService.updateMenteeExtension(
						userExtensionData,
						userExtensionData.id,
						userExtensionData.organization.id
				  )
				: await mentorsService.updateMentorExtension(
						userExtensionData,
						userExtensionData.id,
						userExtensionData.organization.id
				  )
			return user
		}
	}

	/**
	 * Checks the existence of a user based on their mentee extension.
	 *
	 * @param {string} userId - The ID of the user to check.
	 * @returns {Promise<boolean>} - Returns `true` if the user does not exist, `false` otherwise.
	 * @throws {Error} - Throws an error if the query fails.
	 */
	static async #checkUserExistence(userId) {
		try {
			const menteeExtension = await menteeQueries.getMenteeExtension(userId, ['organization_id'])

			// Check if menteeExtension exists
			const userExists = menteeExtension !== null

			return !userExists // Return true if user does not exist
		} catch (error) {
			console.error('HERE: ', error)
			throw error
		}
	}

	/**
	 * Validates that the required user details are present and not null/undefined.
	 *
	 * This function checks if the userDetails object contains the necessary fields
	 * for processing a user. It specifically looks for:
	 * - id
	 * - user_roles
	 * - email
	 * - name
	 * - organization
	 * - organization_id
	 *
	 * If any of these fields are missing or null, the function returns an error message.
	 *
	 * @param {Object} userDetails - The user details object containing user data.
	 * @returns {string|null} - Returns an error message if validation fails, otherwise null.
	 */

	static async #validateUserDetails(userDetails) {
		if (!userDetails.data.result) {
			return 'FAILED_TO_GET_REQUIRED_USER_DETAILS'
		} else {
			const requiredFields = ['id', 'user_roles', 'email', 'name', 'organization', 'organization_id']
			for (const field of requiredFields) {
				if (!userDetails.data.result[field] || userDetails.data.result[field] == null) {
					return 'FAILED_TO_GET_REQUIRED_USER_DETAILS'
				}
			}
		}
		return null
	}
}
