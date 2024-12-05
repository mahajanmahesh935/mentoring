'use strict'
// Dependenices
const common = require('@constants/common')
const mentorQueries = require('@database/queries/mentorExtension')
const menteeQueries = require('@database/queries/userExtension')
const httpStatusCode = require('@generics/http-status')
const sessionQueries = require('@database/queries/sessions')
const adminService = require('./admin')
const organisationExtensionQueries = require('@database/queries/organisationExtension')
const entityTypeQueries = require('@database/queries/entityType')
const userRequests = require('@requests/user')
const utils = require('@generics/utils')
const _ = require('lodash')
const questionSetQueries = require('../database/queries/question-set')
const { Op } = require('sequelize')
const responses = require('@helpers/responses')
const { getDefaultOrgId } = require('@helpers/getDefaultOrgId')

module.exports = class OrgAdminService {
	/**
	 * @description 					- Change user's role based on the current role.
	 * @method
	 * @name 							- roleChange
	 * @param {Object} bodyData 		- The request body containing user data.
	 * @returns {Promise<Object>} 		- A Promise that resolves to a response object.
	 */

	static async roleChange(bodyData, updateData = {}) {
		try {
			bodyData.user_id = bodyData.user_id.toString()
			if (
				utils.validateRoleAccess(bodyData.current_roles, common.MENTOR_ROLE) &&
				utils.validateRoleAccess(bodyData.new_roles, common.MENTEE_ROLE)
			) {
				return await this.changeRoleToMentee(bodyData, updateData)
			} else if (
				utils.validateRoleAccess(bodyData.current_roles, common.MENTEE_ROLE) &&
				utils.validateRoleAccess(bodyData.new_roles, common.MENTOR_ROLE)
			) {
				return await this.changeRoleToMentor(bodyData, updateData)
			}
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	/**
	 * @description 				- Change user's role to Mentee.
	 * @method
	 * @name 						- changeRoleToMentee
	 * @param {Object} bodyData 	- The request body.
	 * @returns {Object} 			- A Promise that resolves to a response object.
	 */
	static async changeRoleToMentee(bodyData, updateData = {}) {
		try {
			// Check current role based on that swap data
			// If current role is mentor validate data from mentor_extenion table
			let mentorDetails = await mentorQueries.getMentorExtension(bodyData.user_id, [], true)
			// If such mentor return error
			if (!mentorDetails) {
				return responses.failureResponse({
					message: 'MENTOR_EXTENSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (bodyData.organization_id) {
				bodyData.organization_id = bodyData.organization_id.toString()
				mentorDetails.organization_id = bodyData.organization_id
				const organizationDetails = await userRequests.fetchOrgDetails({
					organizationId: bodyData.organization_id,
				})
				if (!(organizationDetails.success && organizationDetails.data && organizationDetails.data.result)) {
					return responses.failureResponse({
						message: 'ORGANIZATION_NOT_FOUND',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}

				const orgPolicies = await organisationExtensionQueries.findOrInsertOrganizationExtension(
					bodyData.organization_id,
					organizationDetails.data.result.name
				)
				if (!orgPolicies?.organization_id) {
					return responses.failureResponse({
						message: 'ORG_EXTENSION_NOT_FOUND',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
				mentorDetails.organization_id = bodyData.organization_id
				const newPolicy = await this.constructOrgPolicyObject(orgPolicies)
				mentorDetails = _.merge({}, mentorDetails, newPolicy, updateData)
				mentorDetails.visible_to_organizations = Array.from(
					new Set([...(organizationDetails.data.result.related_orgs || []), bodyData.organization_id])
				)
			}
			mentorDetails.is_mentor = false
			if (mentorDetails.email) delete mentorDetails.email
			// Add fetched mentor details to user_extension table
			const menteeCreationData = await menteeQueries.updateMenteeExtension(bodyData.user_id, mentorDetails)
			if (!menteeCreationData) {
				return responses.failureResponse({
					message: 'MENTEE_EXTENSION_CREATION_FAILED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			// Delete upcoming sessions of user as mentor
			const removedSessionsDetail = await sessionQueries.removeAndReturnMentorSessions(bodyData.user_id)
			const isAttendeesNotified = await adminService.unenrollAndNotifySessionAttendees(
				removedSessionsDetail,
				mentorDetails.organization_id ? mentorDetails.organization_id : ''
			)

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'USER_ROLE_UPDATED',
				result: {
					user_id: menteeCreationData.user_id,
					roles: bodyData.new_roles,
				},
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	/**
	 * @description 				- Change user's role to Mentor.
	 * @method
	 * @name 						- changeRoleToMentor
	 * @param {Object} bodyData 	- The request body containing user data.
	 * @returns {Promise<Object>} 	- A Promise that resolves to a response object.
	 */

	static async changeRoleToMentor(bodyData, updateData = {}) {
		try {
			// Get mentee_extension data
			let menteeDetails = await menteeQueries.getMenteeExtension(bodyData.user_id, '', true)

			// If no mentee present return error
			if (!menteeDetails) {
				return responses.failureResponse({
					statusCode: httpStatusCode.not_found,
					message: 'MENTEE_EXTENSION_NOT_FOUND',
				})
			}

			if (bodyData.organization_id) {
				bodyData.organization_id = bodyData.organization_id.toString()
				let organizationDetails = await userRequests.fetchOrgDetails({
					organizationId: bodyData.organization_id,
				})
				if (!(organizationDetails.success && organizationDetails.data && organizationDetails.data.result)) {
					return responses.failureResponse({
						message: 'ORGANIZATION_NOT_FOUND',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}

				const orgPolicies = await organisationExtensionQueries.findOrInsertOrganizationExtension(
					bodyData.organization_id,
					organizationDetails.data.result.name
				)
				if (!orgPolicies?.organization_id) {
					return responses.failureResponse({
						message: 'ORG_EXTENSION_NOT_FOUND',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
				menteeDetails.organization_id = bodyData.organization_id
				const newPolicy = await this.constructOrgPolicyObject(orgPolicies)
				menteeDetails = _.merge({}, menteeDetails, newPolicy, updateData)
				menteeDetails.visible_to_organizations = Array.from(
					new Set([...(organizationDetails.data.result.related_orgs || []), bodyData.organization_id])
				)
			}

			if (menteeDetails.email) delete menteeDetails.email
			// Add fetched mentee details to mentor_extension table
			const mentorCreationData = await mentorQueries.updateMentorExtension(
				bodyData.user_id,
				menteeDetails,
				'',
				'',
				true
			)

			if (!mentorCreationData) {
				return responses.failureResponse({
					message: 'MENTOR_EXTENSION_CREATION_FAILED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'USER_ROLE_UPDATED',
				result: {
					user_id: bodyData.user_id,
					roles: bodyData.new_roles,
				},
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	static async setOrgPolicies(decodedToken, policies) {
		try {
			const orgPolicies = await organisationExtensionQueries.upsert({
				organization_id: decodedToken.organization_id,
				...policies,
				created_by: decodedToken.id,
				updated_by: decodedToken.id,
			})
			const orgPolicyUpdated =
				new Date(orgPolicies.dataValues.created_at).getTime() !==
				new Date(orgPolicies.dataValues.updated_at).getTime()

			// If org policies updated update mentor and mentee extensions under the org
			if (orgPolicyUpdated) {
				// if org policy is updated update mentor extension and user extension
				let policyData = await this.constructOrgPolicyObject(orgPolicies.dataValues)

				if (
					policyData?.external_mentor_visibility == common.ASSOCIATED ||
					policyData?.mentor_visibility_policy == common.ASSOCIATED ||
					policyData?.external_mentee_visibility == common.ASSOCIATED ||
					policyData?.mentee_visibility_policy == common.ASSOCIATED
				) {
					const organizationDetails = await userRequests.fetchOrgDetails({
						organizationId: decodedToken.organization_id,
					})
					policyData.visible_to_organizations = organizationDetails.data.result.related_orgs
				}
				//Update all users belonging to the org with new policies
				await menteeQueries.updateMenteeExtension(
					'', //userId not required
					policyData, // data to update
					{}, //options
					{ organization_id: decodedToken.organization_id } //custom filter for where clause
				)
				// commenting as part of first level SAAS changes. will need this in the code next level
				// await sessionQueries.updateSession(
				// 	{
				// 		status: common.PUBLISHED_STATUS,
				// 		mentor_org_ id: decodedToken.organization _id
				// 	},
				// 	{
				// 		visibility: orgPolicies.dataValues.session_visibility_policy
				// 	}
				// )
			}

			delete orgPolicies.dataValues.deleted_at
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'ORG_POLICIES_SET_SUCCESSFULLY',
				result: { ...orgPolicies.dataValues },
			})
		} catch (error) {
			throw new Error(`Error setting organisation policies: ${error.message}`)
		}
	}

	static async getOrgPolicies(decodedToken) {
		try {
			const orgPolicies = await organisationExtensionQueries.getById(decodedToken.organization_id)
			if (orgPolicies) {
				delete orgPolicies.deleted_at
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'ORG_POLICIES_FETCHED_SUCCESSFULLY',
					result: { ...orgPolicies },
				})
			} else {
				throw new Error(`No organisation extension found for organization_id ${decodedToken.organization_id}`)
			}
		} catch (error) {
			throw new Error(`Error reading organisation policies: ${error.message}`)
		}
	}

	/**
	 * @description 					- Inherit new entity type from an existing default org's entityType.
	 * @method
	 * @name 							- inheritEntityType
	 * @param {String} entityValue 		- Entity type value
	 * @param {String} entityLabel 		- Entity type label
	 * @param {Integer} userOrgId 		- User org id
	 * @param {Object} decodedToken 	- User token details
	 * @returns {Promise<Object>} 		- A Promise that resolves to a response object.
	 */

	static async inheritEntityType(entityValue, entityLabel, userOrgId, decodedToken) {
		try {
			// Get default organisation details
			let defaultOrgDetails = await userRequests.fetchOrgDetails({
				organizationCode: process.env.DEFAULT_ORGANISATION_CODE,
			})

			let defaultOrgId
			if (defaultOrgDetails.success && defaultOrgDetails.data && defaultOrgDetails.data.result) {
				defaultOrgId = defaultOrgDetails.data.result.id
			} else {
				return responses.failureResponse({
					message: 'DEFAULT_ORG_ID_NOT_SET',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (defaultOrgId === userOrgId) {
				return responses.failureResponse({
					message: 'USER_IS_FROM_DEFAULT_ORG',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			// Fetch entity type data using defaultOrgId and entityValue
			const filter = {
				value: entityValue,
				organization_id: defaultOrgId,
				allow_filtering: true,
			}
			let entityTypeDetails = await entityTypeQueries.findOneEntityType(filter)

			// If no matching data found return failure response
			if (!entityTypeDetails) {
				return responses.failureResponse({
					message: 'ENTITY_TYPE_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			// Build data for inheriting entityType
			entityTypeDetails.parent_id = entityTypeDetails.id
			entityTypeDetails.label = entityLabel
			entityTypeDetails.organization_id = userOrgId
			entityTypeDetails.created_by = decodedToken.id
			entityTypeDetails.updated_by = decodedToken.id
			delete entityTypeDetails.id

			// Create new inherited entity type
			let inheritedEntityType = await entityTypeQueries.createEntityType(entityTypeDetails)
			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'ENTITY_TYPE_CREATED_SUCCESSFULLY',
				result: inheritedEntityType,
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	/**
	 * Update User Organization.
	 * @method
	 * @name updateOrganization
	 * @param {Object} bodyData
	 * @returns {JSON} - User data.
	 */
	static async updateOrganization(bodyData) {
		try {
			bodyData.user_id = bodyData.user_id.toString()
			bodyData.organization_id = bodyData.organization_id.toString()
			const orgId = bodyData.organization_id
			// Get organization details
			let organizationDetails = await userRequests.fetchOrgDetails({ organizationId: orgId })
			if (!(organizationDetails.success && organizationDetails.data && organizationDetails.data.result)) {
				return responses.failureResponse({
					message: 'ORGANIZATION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			// Get organization policies
			const orgPolicies = await organisationExtensionQueries.findOrInsertOrganizationExtension(
				orgId,
				organizationDetails.data.result.name
			)
			if (!orgPolicies?.organization_id) {
				return responses.failureResponse({
					message: 'ORG_EXTENSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			//Update the policy
			const updateData = {
				organization_id: orgId,
				external_session_visibility: orgPolicies.external_session_visibility_policy,
				external_mentor_visibility: orgPolicies.external_mentor_visibility_policy,
				mentor_visibility: orgPolicies.mentor_visibility_policy,
				mentee_visibility: orgPolicies.mentee_visibility_policy,
				external_mentee_visibility: orgPolicies.external_mentee_visibility_policy,
				visible_to_organizations: organizationDetails.data.result.related_orgs,
			}
			if (utils.validateRoleAccess(bodyData.roles, common.MENTOR_ROLE))
				await mentorQueries.updateMentorExtension(bodyData.user_id, updateData)
			else await menteeQueries.updateMenteeExtension(bodyData.user_id, updateData)
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'UPDATE_ORG_SUCCESSFULLY',
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	/**
	 * Deactivate upcoming session.
	 * @method
	 * @name deactivateUpcomingSession
	 * @param {Object} bodyData
	 * @returns {JSON} - User data.
	 */
	static async deactivateUpcomingSession(userIds) {
		try {
			userIds = userIds.map(String)
			let deactivatedIdsList = []
			let failedUserIds = []
			for (let key in userIds) {
				const userId = userIds[key]
				const mentorDetails = await mentorQueries.getMentorExtension(userId)
				if (mentorDetails?.user_id) {
					// Deactivate upcoming sessions of user as mentor
					const removedSessionsDetail = await sessionQueries.deactivateAndReturnMentorSessions(userId)
					await adminService.unenrollAndNotifySessionAttendees(removedSessionsDetail)
					deactivatedIdsList.push(userId)
				}

				//unenroll from upcoming session
				const menteeDetails = await menteeQueries.getMenteeExtension(userId)
				if (menteeDetails?.user_id) {
					await adminService.unenrollFromUpcomingSessions(userId)
					deactivatedIdsList.push(userId)
				}

				if (!mentorDetails?.user_id && !menteeDetails?.user_id) {
					failedUserIds.push(userId)
				}
			}

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: failedUserIds.length > 0 ? 'SESSION_DEACTIVATION_FAILED' : 'SESSION_DEACTIVATED_SUCCESSFULLY',
				result: {
					deactivatedIdsList: deactivatedIdsList,
					failedUserIds: failedUserIds,
				},
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}
	/**
	 * @description 							- constuct organisation policy object for mentor_extension/user_extension.
	 * @method
	 * @name 									- constructOrgPolicyObject
	 * @param {Object} organisationPolicy 		- organisation policy data
	 * @param {Boolean} addOrgId 				- Boolean that specifies if org_ id needs to be added or not
	 * @returns {Object} 						- A object that reurn a response object.
	 */
	static async constructOrgPolicyObject(organisationPolicy, addOrgId = false) {
		const {
			mentor_visibility_policy,
			external_session_visibility_policy,
			external_mentor_visibility_policy,
			organization_id,
			external_mentee_visibility_policy,
			mentee_visibility_policy,
		} = organisationPolicy
		// create policy object
		let policyData = {
			mentee_visibility: mentee_visibility_policy,
			mentor_visibility: mentor_visibility_policy,
			external_session_visibility: external_session_visibility_policy,
			external_mentor_visibility: external_mentor_visibility_policy,
			external_mentee_visibility: external_mentee_visibility_policy,
		}
		// add org_ id value if requested
		if (addOrgId) {
			policyData.organization_id = organization_id
		}
		return policyData
	}

	/**
	 * @description 							- update related organization of mentees and mentors if there is an update in the organization
	 * @method									- POST
	 * @name 									- updateRelatedOrgs
	 * @param {Array} relatedOrgs 		 		- Array of related organization passed
	 * @param {Number} orgId 					- Specific orgId which was updated
	 * @param {Object} organizationDetails 		- Object of organization details of the related org from user service.
	 * @returns {Object} 						- A object that reurn a response object.
	 */
	static async updateRelatedOrgs(deltaOrganizationIds, orgId, action) {
		try {
			orgId = orgId.toString()
			deltaOrganizationIds = deltaOrganizationIds.map(String)
			if (action === common.PUSH) {
				await menteeQueries.addVisibleToOrg(orgId, deltaOrganizationIds)
			} else if (action === common.POP) {
				await menteeQueries.removeVisibleToOrg(orgId, deltaOrganizationIds)
			}

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'RELATED_ORG_UPDATED',
			})
		} catch (error) {
			throw error
		}
	}

	static async setDefaultQuestionSets(bodyData, decodedToken) {
		try {
			const questionSets = await questionSetQueries.findQuestionSets(
				{
					code: { [Op.in]: [bodyData.mentee_feedback_question_set, bodyData.mentor_feedback_question_set] },
				},
				['id', 'code']
			)
			if (
				questionSets.length === 0 ||
				(questionSets.length === 1 &&
					bodyData.mentee_feedback_question_set !== bodyData.mentor_feedback_question_set)
			) {
				return responses.failureResponse({
					message: 'QUESTIONS_SET_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			const extensionData = {
				organization_id: decodedToken.id,
				mentee_feedback_question_set: bodyData.mentee_feedback_question_set,
				mentor_feedback_question_set: bodyData.mentor_feedback_question_set,
				updated_by: decodedToken.id,
			}
			const orgExtension = await organisationExtensionQueries.upsert(extensionData)
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'ORG_DEFAULT_QUESTION_SETS_SET_SUCCESSFULLY',
				result: {
					organization_id: orgExtension.organization_id,
					mentee_feedback_question_set: orgExtension.mentee_feedback_question_set,
					mentor_feedback_question_set: orgExtension.mentor_feedback_question_set,
					updated_by: orgExtension.updated_by,
				},
			})
		} catch (error) {
			console.log(error)
		}
	}

	static async uploadSampleCSV(filepath, orgId) {
		const defaultOrgId = await getDefaultOrgId()
		if (!defaultOrgId) {
			return responses.failureResponse({
				message: 'DEFAULT_ORG_ID_NOT_SET',
				statusCode: httpStatusCode.bad_request,
				responseCode: 'CLIENT_ERROR',
			})
		}

		const newData = { uploads: { session_csv_path: filepath } }
		if (orgId != defaultOrgId) {
			let result = await organisationExtensionQueries.update(newData, orgId)
			if (!result) {
				return responses.failureResponse({
					message: 'CSV_UPDATE_FAILED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'CSV_UPLOADED_SUCCESSFULLY',
			})
		}
		return responses.failureResponse({
			message: 'CSV_UPDATE_FAILED',
			statusCode: httpStatusCode.bad_request,
			responseCode: 'CLIENT_ERROR',
		})
	}
}
