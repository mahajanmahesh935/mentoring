// Dependencies
const userRequests = require('@requests/user')
const common = require('@constants/common')
const httpStatusCode = require('@generics/http-status')
const feedbackHelper = require('./feedback')
const utils = require('@generics/utils')

const { successResponse } = require('@constants/common')
const rolePermissionMappingQueries = require('@database/queries/role-permission-mapping')
const { UniqueConstraintError } = require('sequelize')
const menteeQueries = require('@database/queries/userExtension')
const sessionAttendeesQueries = require('@database/queries/sessionAttendees')
const sessionQueries = require('@database/queries/sessions')
const _ = require('lodash')
const entityTypeQueries = require('@database/queries/entityType')
const bigBlueButtonService = require('./bigBlueButton')
const organisationExtensionQueries = require('@database/queries/organisationExtension')
const orgAdminService = require('@services/org-admin')
const mentorQueries = require('@database/queries/mentorExtension')
const { getDefaultOrgId } = require('@helpers/getDefaultOrgId')
const { Op } = require('sequelize')
const { removeDefaultOrgEntityTypes } = require('@generics/utils')
const entityTypeService = require('@services/entity-type')
const entityType = require('@database/models/entityType')
const { getEnrolledMentees } = require('@helpers/getEnrolledMentees')
const responses = require('@helpers/responses')
const permissions = require('@helpers/getPermissions')
const { buildSearchFilter } = require('@helpers/search')
const { defaultRulesFilter } = require('@helpers/defaultRules')

const searchConfig = require('@configs/search.json')
const emailEncryption = require('@utils/emailEncryption')
const communicationHelper = require('@helpers/communications')
const menteeExtensionQueries = require('@database/queries/userExtension')

module.exports = class MenteesHelper {
	/**
	 * Profile.
	 * @method
	 * @name profile
	 * @param {String} userId - user id.
	 * @param {String} orgId - organization id.
	 * @param {String} roles - user roles.
	 * @returns {JSON} - profile details
	 */
	static async read(id, orgId, roles) {
		const menteeDetails = await userRequests.getUserDetails(id)
		const mentee = await menteeQueries.getMenteeExtension(id)
		delete mentee.user_id
		delete mentee.visible_to_organizations
		delete mentee.image

		const defaultOrgId = await getDefaultOrgId()
		if (!defaultOrgId)
			return responses.failureResponse({
				message: 'DEFAULT_ORG_ID_NOT_SET',
				statusCode: httpStatusCode.bad_request,
				responseCode: 'CLIENT_ERROR',
			})
		const userExtensionsModelName = await menteeQueries.getModelName()

		let entityTypes = await entityTypeQueries.findUserEntityTypesAndEntities({
			status: 'ACTIVE',
			organization_id: {
				[Op.in]: [orgId, defaultOrgId],
			},
			model_names: { [Op.contains]: [userExtensionsModelName] },
		})
		const validationData = removeDefaultOrgEntityTypes(entityTypes, orgId)
		//validationData = utils.removeParentEntityTypes(JSON.parse(JSON.stringify(validationData)))

		const processDbResponse = utils.processDbResponse(mentee, validationData)

		const totalSession = await sessionAttendeesQueries.countEnrolledSessions(id)

		const menteePermissions = await permissions.getPermissions(roles)
		if (!Array.isArray(menteeDetails.data.result.permissions)) {
			menteeDetails.data.result.permissions = []
		}
		menteeDetails.data.result.permissions.push(...menteePermissions)

		const profileMandatoryFields = await utils.validateProfileData(processDbResponse, validationData)
		menteeDetails.data.result.profile_mandatory_fields = profileMandatoryFields

		let communications = null

		if (mentee?.meta?.communications_user_id) {
			try {
				const chat = await communicationHelper.login(id)
				communications = chat
			} catch (error) {
				console.error('Failed to log in to communication service:', error)
			}
		}

		processDbResponse.meta = {
			...processDbResponse.meta,
			communications,
		}

		return responses.successResponse({
			statusCode: httpStatusCode.ok,
			message: 'PROFILE_FTECHED_SUCCESSFULLY',
			result: {
				sessions_attended: totalSession,
				...menteeDetails.data.result,
				...processDbResponse,
			},
		})
	}

	/**
	 * Sessions list. Includes upcoming and enrolled sessions.
	 * @method
	 * @name sessions
	 * @param {String} userId - user id.
	 * @param {Boolean} enrolledSessions - true/false.
	 * @param {Number} page - page No.
	 * @param {Number} limit - page limit.
	 * @param {String} search - search field.
	 * @returns {JSON} - List of sessions
	 */

	static async sessions(userId, page, limit, search = '') {
		try {
			/** Upcoming user's enrolled sessions {My sessions}*/
			/* Fetch sessions if it is not expired or if expired then either status is live or if mentor 
				delays in starting session then status will remain published for that particular interval so fetch that also */

			/* TODO: Need to write cron job that will change the status of expired sessions from published to cancelled if not hosted by mentor */
			const sessions = await this.getMySessions(page, limit, search, userId)

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_FETCHED_SUCCESSFULLY',
				result: { data: sessions.rows, count: sessions.count },
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Mentees reports.
	 * @method
	 * @name reports
	 * @param {String} userId - user id.
	 * @param {String} filterType - MONTHLY/WEEKLY/QUARTERLY.
	 * @returns {JSON} - Mentees reports
	 */

	static async reports(userId, filterType) {
		try {
			let filterStartDate, filterEndDate

			switch (filterType) {
				case 'MONTHLY':
					;[filterStartDate, filterEndDate] = utils.getCurrentMonthRange()
					break
				case 'WEEKLY':
					;[filterStartDate, filterEndDate] = utils.getCurrentWeekRange()
					break
				case 'QUARTERLY':
					;[filterStartDate, filterEndDate] = utils.getCurrentQuarterRange()
					break
				default:
					throw new Error('Invalid filterType')
			}

			const totalSessionsEnrolled = await sessionAttendeesQueries.getEnrolledSessionsCountInDateRange(
				filterStartDate.toISOString(),
				filterEndDate.toISOString(),
				userId
			)

			const totalSessionsAttended = await sessionAttendeesQueries.getAttendedSessionsCountInDateRange(
				filterStartDate.toISOString(),
				filterEndDate.toISOString(),
				userId
			)

			const result = {
				total_session_enrolled: totalSessionsEnrolled,
				total_session_attended: totalSessionsAttended,
			}

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'MENTEES_REPORT_FETCHED_SUCCESSFULLY',
				result,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Mentees homeFeed.
	 * @method
	 * @name homeFeed
	 * @param {String} userId - user id.
	 * @param {Boolean} isAMentor - true/false.
	 * @returns {JSON} - Mentees homeFeed.
	 */

	static async homeFeed(userId, isAMentor, page, limit, search, queryParams, roles, orgId) {
		try {
			/* All Sessions */

			let allSessions = await this.getAllSessions(
				page,
				limit,
				search,
				userId,
				queryParams,
				isAMentor,
				'',
				roles,
				orgId
			)

			if (allSessions.error && allSessions.error.missingField) {
				return responses.failureResponse({
					message: 'PROFILE_NOT_UPDATED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			/* My Sessions */
			let mySessions = await this.getMySessions(page, limit, search, userId)

			const result = {
				all_sessions: allSessions.rows,
				my_sessions: mySessions.rows,
			}
			const feedbackData = await feedbackHelper.pending(userId, isAMentor)

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_FETCHED_SUCCESSFULLY',
				result: result,
				meta: {
					type: 'feedback',
					data: feedbackData.result,
				},
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Join session as Mentees.
	 * @method
	 * @name joinSession
	 * @param {String} sessionId - session id.
	 * @param {String} token - Mentees token.
	 * @returns {JSON} - Mentees join session link.
	 */

	static async joinSession(sessionId, userId) {
		try {
			const mentee = await menteeExtensionQueries.getMenteeExtension(userId, ['name', 'user_id'])
			if (!mentee) throw createUnauthorizedResponse('USER_NOT_FOUND')

			const session = await sessionQueries.findById(sessionId)

			if (!session) {
				return responses.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			if (session.status == 'COMPLETED') {
				return responses.failureResponse({
					message: 'SESSION_ENDED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (session.status !== 'LIVE') {
				return responses.failureResponse({
					message: 'JOIN_ONLY_LIVE_SESSION',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const sessionAttendee = await sessionAttendeesQueries.findAttendeeBySessionAndUserId(
				mentee.user_id,
				sessionId
			)
			if (!sessionAttendee) {
				return responses.failureResponse({
					message: 'USER_NOT_ENROLLED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			let meetingInfo
			if (session?.meeting_info?.value !== common.BBB_VALUE) {
				meetingInfo = session.meeting_info

				await sessionAttendeesQueries.updateOne(
					{
						id: sessionAttendee.id,
					},
					{
						meeting_info: meetingInfo,
						joined_at: utils.utcFormat(),
					}
				)
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'SESSION_START_LINK',
					result: meetingInfo,
				})
			}
			if (sessionAttendee?.meeting_info?.link) {
				meetingInfo = sessionAttendee.meeting_info
			} else {
				const attendeeLink = await bigBlueButtonService.joinMeetingAsAttendee(
					sessionId,
					mentee.name,
					session.mentee_password
				)
				meetingInfo = {
					value: common.BBB_VALUE,
					platform: common.BBB_PLATFORM,
					link: attendeeLink,
				}
				await sessionAttendeesQueries.updateOne(
					{
						id: sessionAttendee.id,
					},
					{
						meeting_info: meetingInfo,
						joined_at: utils.utcFormat(),
					}
				)
			}

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_START_LINK',
				result: meetingInfo,
			})
		} catch (error) {
			return error
		}
	}

	/**
	 * Get all upcoming unenrolled session.
	 * @method
	 * @name getAllSessions
	 * @param {Number} page - page No.
	 * @param {Number} limit - page limit.
	 * @param {String} search - search session.
	 * @param {String} userId - user id.
	 * @returns {JSON} - List of all sessions
	 */

	static async getAllSessions(page, limit, search, userId, queryParams, isAMentor, searchOn, roles, orgId) {
		let additionalProjectionString = ''

		// check for fields query
		if (queryParams.fields && queryParams.fields !== '') {
			additionalProjectionString = queryParams.fields
			delete queryParams.fields
		}
		let query = utils.processQueryParametersWithExclusions(queryParams)
		const sessionModelName = await sessionQueries.getModelName()

		let validationData = await entityTypeQueries.findAllEntityTypesAndEntities({
			status: 'ACTIVE',
			allow_filtering: true,
			model_names: { [Op.contains]: [sessionModelName] },
		})

		let filteredQuery = utils.validateAndBuildFilters(query, validationData, sessionModelName)

		// Create saas filter for view query
		const saasFilter = await this.filterSessionsBasedOnSaasPolicy(userId, isAMentor)

		const searchFilter = await buildSearchFilter({
			searchOn: searchOn ? searchOn.split(',') : false,
			searchConfig: searchConfig.search.session,
			search,
			modelName: sessionModelName,
		})
		// return false response when buildSearchFilter() returns negative response
		// buildSearchFilter() false when search on only contains entity type and no valid matches.
		if (!searchFilter) {
			return {
				rows: [],
				count: 0,
			}
		}

		const defaultRuleFilter = await defaultRulesFilter({
			ruleType: 'session',
			requesterId: userId,
			roles: roles,
			requesterOrganizationId: orgId,
		})

		if (defaultRuleFilter.error && defaultRuleFilter.error.missingField) {
			return defaultRuleFilter
		}

		const sessions = await sessionQueries.getUpcomingSessionsFromView(
			page,
			limit,
			searchFilter,
			userId,
			filteredQuery,
			saasFilter,
			additionalProjectionString,
			search,
			defaultRuleFilter
		)
		if (sessions.rows.length > 0) {
			const uniqueOrgIds = [...new Set(sessions.rows.map((obj) => obj.mentor_organization_id))]
			sessions.rows = await entityTypeService.processEntityTypesToAddValueLabels(
				sessions.rows,
				uniqueOrgIds,
				common.sessionModelName,
				'mentor_organization_id'
			)
		}

		sessions.rows = await this.menteeSessionDetails(sessions.rows, userId)

		sessions.rows = await this.sessionMentorDetails(sessions.rows)

		return sessions
	}

	/**
	 * @description 							- filter sessions based on user's saas policy.
	 * @method
	 * @name filterSessionsBasedOnSaasPolicy
	 * @param {Number} userId 					- User id.
	 * @param {Boolean} isAMentor 				- user mentor or not.
	 * @returns {JSON} 							- List of filtered sessions
	 */
	static async filterSessionsBasedOnSaasPolicy(userId, isAMentor) {
		try {
			const menteeExtension = await menteeQueries.getMenteeExtension(userId, [
				'external_session_visibility',
				'organization_id',
				'is_mentor',
			])

			if (!menteeExtension) {
				throw responses.failureResponse({
					statusCode: httpStatusCode.unauthorized,
					message: 'USER_NOT_FOUND',
					responseCode: 'CLIENT_ERROR',
				})
			}
			const organizationName = menteeExtension
				? (await userRequests.getOrgDetails({ organizationId: menteeExtension.organization_id }))?.data?.result
						?.name
				: ''
			if (!isAMentor && menteeExtension.is_mentor == true) {
				throw responses.failureResponse({
					statusCode: httpStatusCode.unauthorized,
					message: `Congratulations! You are now a mentor in the ${organizationName} organization. Please log in again to begin your journey.`,
					responseCode: 'CLIENT_ERROR',
				})
			} else if (isAMentor && menteeExtension.is_mentor == false) {
				throw responses.failureResponse({
					statusCode: httpStatusCode.unauthorized,
					message: `You are now a mentee in the ${organizationName} organization. Please log in again to continue your journey.`,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const userPolicyDetails = menteeExtension || mentorExtension
			let filter = ''
			if (userPolicyDetails.external_session_visibility && userPolicyDetails.organization_id) {
				// generate filter based on condition
				if (userPolicyDetails.external_session_visibility === common.CURRENT) {
					/**
					 * If {userPolicyDetails.external_session_visibility === CURRENT} user will be able to sessions-
					 *  -created by his/her organization mentors.
					 * So will check if mentor_organization_id equals user's  organization_id
					 */
					filter = `AND "mentor_organization_id" = '${userPolicyDetails.organization_id}'`
				} else if (userPolicyDetails.external_session_visibility === common.ASSOCIATED) {
					/**
					 * user external_session_visibility is ASSOCIATED
					 * user can see sessions where session's visible_to_organizations contain user's organization_id and -
					 *  - session's visibility not CURRENT (In case of same organization session has to be fetched for that we added OR condition {"mentor_organization_id" = ${userPolicyDetails.organization_id}})
					 */
					filter = `AND (('${userPolicyDetails.organization_id}' = ANY("visible_to_organizations") AND "visibility" != 'CURRENT') OR "mentor_organization_id" = '${userPolicyDetails.organization_id}')`
				} else if (userPolicyDetails.external_session_visibility === common.ALL) {
					/**
					 * user's external_session_visibility === ALL (ASSOCIATED sessions + sessions whose visibility is ALL)
					 */
					filter = `AND (('${userPolicyDetails.organization_id}' = ANY("visible_to_organizations") AND "visibility" != 'CURRENT' ) OR "visibility" = 'ALL' OR "mentor_organization_id" = '${userPolicyDetails.organization_id}')`
				}
			}
			return filter
		} catch (err) {
			console.log(err)
			throw err
		}
	}

	/**
	 * Get all enrolled session.
	 * @method
	 * @name getMySessions
	 * @param {Number} page - page No.
	 * @param {Number} limit - page limit.
	 * @param {String} search - search session.
	 * @param {String} userId - user id.
	 * @returns {JSON} - List of enrolled sessions
	 */

	static async getMySessions(page, limit, search, userId) {
		try {
			const upcomingSessions = await sessionQueries.getUpcomingSessions(page, limit, search, userId)
			const upcomingSessionIds = upcomingSessions.rows.map((session) => session.id)
			const usersUpcomingSessions = await sessionAttendeesQueries.usersUpcomingSessions(
				userId,
				upcomingSessionIds
			)

			let sessionAndMenteeMap = {}
			usersUpcomingSessions.forEach((session) => {
				sessionAndMenteeMap[session.session_id] = session.type
			})

			const usersUpcomingSessionIds = usersUpcomingSessions.map(
				(usersUpcomingSession) => usersUpcomingSession.session_id
			)

			const attributes = { exclude: ['mentee_password', 'mentor_password'] }
			let sessionDetails = await sessionQueries.findAndCountAll(
				{ id: usersUpcomingSessionIds },
				{ order: [['start_date', 'ASC']] },
				{ attributes: attributes }
			)
			if (sessionDetails.rows.length > 0) {
				sessionDetails.rows.forEach((session) => {
					if (sessionAndMenteeMap.hasOwnProperty(session.id)) {
						session.enrolled_type = sessionAndMenteeMap[session.id]
					}
				})

				const uniqueOrgIds = [...new Set(sessionDetails.rows.map((obj) => obj.mentor_organization_id))]
				sessionDetails.rows = await entityTypeService.processEntityTypesToAddValueLabels(
					sessionDetails.rows,
					uniqueOrgIds,
					common.sessionModelName,
					'mentor_organization_id'
				)
			}
			sessionDetails.rows = await this.sessionMentorDetails(sessionDetails.rows)

			return sessionDetails
		} catch (error) {
			throw error
		}
	}

	static async menteeSessionDetails(sessions, userId) {
		try {
			if (sessions.length > 0) {
				const sessionIds = sessions.map((session) => session.id)

				const attendees = await sessionAttendeesQueries.findAll({
					session_id: sessionIds,
					mentee_id: userId,
				})

				await Promise.all(
					sessions.map(async (session) => {
						const attendee = attendees.find((attendee) => attendee.session_id === session.id)
						if (attendee) session.enrolled_type = attendee.type
						session.is_enrolled = !!attendee
					})
				)

				return sessions
			} else {
				return sessions
			}
		} catch (err) {
			return err
		}
	}

	static async sessionMentorDetails(sessions) {
		try {
			if (sessions.length === 0) {
				return sessions
			}

			// Extract unique mentor_ids
			const mentorIds = [...new Set(sessions.map((session) => session.mentor_id))]

			// Fetch mentor details
			// const mentorDetails = (await userRequests.getListOfUserDetails(mentorIds)).result
			const mentorDetails = await menteeQueries.getUsersByUserIds(
				mentorIds,
				{
					attributes: ['user_id', 'organization_id'],
				},
				true
			)

			let organizationIds = []
			mentorDetails.forEach((element) => {
				organizationIds.push(element.organization_id)
			})
			const organizationDetails = await organisationExtensionQueries.findAll(
				{
					organization_id: {
						[Op.in]: [...organizationIds],
					},
				},
				{
					attributes: ['name', 'organization_id'],
				}
			)

			// Map mentor names to sessions
			sessions.forEach((session) => {
				const mentor = mentorDetails.find((mentorDetail) => mentorDetail.user_id === session.mentor_id)
				if (mentor) {
					const orgnization = organizationDetails.find(
						(organizationDetail) => organizationDetail.organization_id === mentor.organization_id
					)
					session.mentor_name = mentor.name
					session.organization = orgnization.name
				}
			})

			// Fetch and update image URLs in parallel
			await Promise.all(
				sessions.map(async (session) => {
					if (session.image && session.image.length > 0) {
						session.image = await Promise.all(
							session.image.map(async (imgPath) =>
								imgPath ? await utils.getDownloadableUrl(imgPath) : null
							)
						)
					}
				})
			)

			return sessions
		} catch (error) {
			throw error
		}
	}
	// Functions for new APIs
	/**
	 * Create a new mentee extension.
	 * @method
	 * @name createMenteeExtension
	 * @param {Object} data - Mentee extension data to be created.
	 * @param {String} userId - User ID of the mentee.
	 * @returns {Promise<Object>} - Created mentee extension details.
	 */
	static async createMenteeExtension(data, userId, orgId) {
		try {
			let skipValidation = data.skipValidation ? data.skipValidation : false
			if (data.email) {
				data.email = emailEncryption.encrypt(data.email.toLowerCase())
			}
			// Call user service to fetch organisation details --SAAS related changes
			let userOrgDetails = await userRequests.fetchOrgDetails({ organizationId: orgId })

			// Return error if user org does not exists
			if (!userOrgDetails.success || !userOrgDetails.data || !userOrgDetails.data.result) {
				return responses.failureResponse({
					message: 'ORGANISATION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const organization_name = userOrgDetails.data.result.name

			// Find organisation policy from organisation_extension table
			let organisationPolicy = await organisationExtensionQueries.findOrInsertOrganizationExtension(
				orgId,
				organization_name
			)

			data.user_id = userId

			const defaultOrgId = await getDefaultOrgId()
			if (!defaultOrgId)
				return responses.failureResponse({
					message: 'DEFAULT_ORG_ID_NOT_SET',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			const userExtensionsModelName = await menteeQueries.getModelName()

			let entityTypes = await entityTypeQueries.findUserEntityTypesAndEntities({
				status: 'ACTIVE',
				organization_id: {
					[Op.in]: [orgId, defaultOrgId],
				},
				model_names: { [Op.contains]: [userExtensionsModelName] },
			})

			//validationData = utils.removeParentEntityTypes(JSON.parse(JSON.stringify(validationData)))
			const validationData = removeDefaultOrgEntityTypes(entityTypes, orgId)

			let res = utils.validateInput(data, validationData, userExtensionsModelName, skipValidation)
			if (!res.success) {
				return responses.failureResponse({
					message: 'MENTEE_EXTENSION_CREATION_FAILED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
					result: res.errors,
				})
			}
			let menteeExtensionsModel = await menteeQueries.getColumns()
			data = utils.restructureBody(data, validationData, menteeExtensionsModel)

			// construct policy object
			let saasPolicyData = await orgAdminService.constructOrgPolicyObject(organisationPolicy, true)

			userOrgDetails.data.result.related_orgs = userOrgDetails.data.result.related_orgs
				? userOrgDetails.data.result.related_orgs.concat([saasPolicyData.organization_id])
				: [saasPolicyData.organization_id]

			// Update mentee extension creation data
			data = {
				...data,
				...saasPolicyData,
				visible_to_organizations: userOrgDetails.data.result.related_orgs,
			}

			const response = await menteeQueries.createMenteeExtension(data)
			const processDbResponse = utils.processDbResponse(response.toJSON(), validationData)

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'MENTEE_EXTENSION_CREATED',
				result: processDbResponse,
			})
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return responses.failureResponse({
					message: 'MENTEE_EXTENSION_EXITS',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			return error
		}
	}

	/**
	 * Update a mentee extension.
	 * @method
	 * @name updateMenteeExtension
	 * @param {String} userId - User ID of the mentee.
	 * @param {Object} data - Updated mentee extension data excluding user_id.
	 * @returns {Promise<Object>} - Updated mentee extension details.
	 */
	static async updateMenteeExtension(data, userId, orgId) {
		try {
			if (data.email) data.email = emailEncryption.encrypt(data.email.toLowerCase())

			let skipValidation = data.skipValidation ? data.skipValidation : false
			// Remove certain data in case it is getting passed
			const dataToRemove = [
				'user_id',
				'mentor_visibility',
				'visible_to_organizations',
				'external_session_visibility',
				'external_mentor_visibility',
				'external_mentee_visibility',
				'mentee_visibility',
			]

			dataToRemove.forEach((key) => {
				if (data[key]) {
					delete data[key]
				}
			})

			const defaultOrgId = await getDefaultOrgId()
			if (!defaultOrgId)
				return responses.failureResponse({
					message: 'DEFAULT_ORG_ID_NOT_SET',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			const userExtensionsModelName = await menteeQueries.getModelName()
			const filter = {
				status: 'ACTIVE',
				organization_id: {
					[Op.in]: [orgId, defaultOrgId],
				},
				model_names: { [Op.contains]: [userExtensionsModelName] },
			}
			let entityTypes = await entityTypeQueries.findUserEntityTypesAndEntities(filter)

			//validationData = utils.removeParentEntityTypes(JSON.parse(JSON.stringify(validationData)))
			const validationData = removeDefaultOrgEntityTypes(entityTypes, orgId)
			let res = utils.validateInput(data, validationData, userExtensionsModelName, skipValidation)
			if (!res.success) {
				return responses.failureResponse({
					message: 'PROFILE_UPDATE_FAILED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
					result: res.errors,
				})
			}

			let userExtensionModel = await menteeQueries.getColumns()

			data = utils.restructureBody(data, validationData, userExtensionModel)

			if (data?.organization?.id) {
				//Do a org policy update for the user only if the data object explicitly includes an
				//organization.id. This is added for the users/update workflow where
				//both both user data and organisation can change at the same time.
				let userOrgDetails = await userRequests.fetchOrgDetails({ organizationId: data.organization.id })
				const orgPolicies = await organisationExtensionQueries.findOrInsertOrganizationExtension(
					data.organization.id,
					userOrgDetails.data.result.name
				)
				if (!orgPolicies?.organization_id) {
					return responses.failureResponse({
						message: 'ORG_EXTENSION_NOT_FOUND',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
				data.organization_id = data.organization.id
				const newPolicy = await orgAdminService.constructOrgPolicyObject(orgPolicies, true)
				data = _.merge({}, data, newPolicy)
				data.visible_to_organizations = Array.from(
					new Set([...userOrgDetails.data.result.related_orgs, data.organization.id])
				)
			}
			const [updateCount, updatedUser] = await menteeQueries.updateMenteeExtension(userId, data, {
				returning: true,
				raw: true,
			})

			if (updateCount === 0) {
				const fallbackUpdatedUser = await menteeQueries.getMenteeExtension(userId)
				console.log(fallbackUpdatedUser)
				if (!fallbackUpdatedUser) {
					return responses.failureResponse({
						statusCode: httpStatusCode.not_found,
						message: 'MENTEE_EXTENSION_NOT_FOUND',
					})
				}
				const processDbResponse = utils.processDbResponse(fallbackUpdatedUser, validationData)

				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'MENTEE_EXTENSION_UPDATED',
					result: processDbResponse,
				})
			}

			const processDbResponse = utils.processDbResponse(updatedUser[0], validationData)

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'MENTEE_EXTENSION_UPDATED',
				result: processDbResponse,
			})
		} catch (error) {
			return error
		}
	}

	/**
	 * Get mentee extension details by user ID.
	 * @method
	 * @name getMenteeExtension
	 * @param {String} userId - User ID of the mentee.
	 * @returns {Promise<Object>} - Mentee extension details.
	 */
	static async getMenteeExtension(userId, orgId) {
		try {
			const mentee = await menteeQueries.getMenteeExtension(userId)
			if (!mentee) {
				return responses.failureResponse({
					statusCode: httpStatusCode.not_found,
					message: 'MENTEE_EXTENSION_NOT_FOUND',
				})
			}

			const defaultOrgId = await getDefaultOrgId()
			if (!defaultOrgId)
				return responses.failureResponse({
					message: 'DEFAULT_ORG_ID_NOT_SET',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			const userExtensionsModelName = await menteeQueries.getModelName()
			const filter = {
				status: 'ACTIVE',
				organization_id: {
					[Op.in]: [orgId, defaultOrgId],
				},
				model_names: { [Op.contains]: [userExtensionsModelName] },
			}

			let entityTypes = await entityTypeQueries.findUserEntityTypesAndEntities(filter)

			//validationData = utils.removeParentEntityTypes(JSON.parse(JSON.stringify(validationData)))
			const validationData = removeDefaultOrgEntityTypes(entityTypes, orgId)
			const processDbResponse = utils.processDbResponse(mentee, validationData)

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'MENTEE_EXTENSION_FETCHED',
				result: processDbResponse,
			})
		} catch (error) {
			return error
		}
	}

	/**
	 * Delete a mentee extension by user ID.
	 * @method
	 * @name deleteMenteeExtension
	 * @param {String} userId - User ID of the mentee.
	 * @returns {Promise<Object>} - Indicates if the mentee extension was deleted successfully.
	 */
	static async deleteMenteeExtension(userId) {
		try {
			const deleteCount = await menteeQueries.deleteMenteeExtension(userId)
			if (deleteCount === '0') {
				return responses.failureResponse({
					statusCode: httpStatusCode.not_found,
					message: 'MENTEE_EXTENSION_NOT_FOUND',
				})
			}
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'MENTEE_EXTENSION_DELETED',
			})
		} catch (error) {
			return error
		}
	}

	/**
	 * Get entities and organization filter
	 * @method
	 * @name getFilterList
	 * @param {String} tokenInformation - token information
	 * @param {Boolean} queryParams - queryParams
	 * @returns {JSON} - Filter list.
	 */
	static async getFilterList(organization, entity_type, filterType, tokenInformation) {
		try {
			let result = {
				organizations: [],
				entity_types: {},
			}

			const filter_type = filterType !== '' ? filterType : common.MENTOR_ROLE

			let organization_ids = []
			const organizations = await this.getOrganizationIdBasedOnPolicy(
				tokenInformation.id,
				tokenInformation.organization_id,
				filter_type
			)

			if (organizations.success && organizations.result.length > 0) {
				organization_ids = [...organizations.result]

				if (organization_ids.length > 0) {
					//get organization list
					const organizationList = await userRequests.organizationList(organization_ids)
					if (organizationList.success && organizationList.data?.result?.length > 0) {
						result.organizations = organizationList.data.result
					}

					const defaultOrgId = await getDefaultOrgId()

					const modelName = []

					const queryMap = {
						[common.MENTEE_ROLE]: menteeQueries.getModelName,
						[common.MENTOR_ROLE]: mentorQueries.getModelName,
						[common.SESSION]: sessionQueries.getModelName,
					}

					if (queryMap[filter_type.toLowerCase()]) {
						const modelNameResult = await queryMap[filter_type.toLowerCase()]()
						modelName.push(modelNameResult)
					}
					// get entity type with entities list
					const getEntityTypesWithEntities = await this.getEntityTypeWithEntitiesBasedOnOrg(
						organization_ids,
						entity_type,
						defaultOrgId ? defaultOrgId : '',
						modelName
					)

					if (getEntityTypesWithEntities.success && getEntityTypesWithEntities.result) {
						let entityTypesWithEntities = getEntityTypesWithEntities.result
						if (entityTypesWithEntities.length > 0) {
							let convertedData = convertEntitiesForFilter(entityTypesWithEntities)
							let doNotRemoveDefaultOrg = false
							if (organization_ids.includes(defaultOrgId)) {
								doNotRemoveDefaultOrg = true
							}
							result.entity_types = filterEntitiesBasedOnParent(
								convertedData,
								defaultOrgId,
								doNotRemoveDefaultOrg
							)
						}
					}
				}
			}

			if (organization.toLowerCase() === common.FALSE) {
				delete result.organizations
			}

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'FILTER_FETCHED_SUCCESSFULLY',
				result,
			})
		} catch (error) {
			return error
		}
	}

	static async getOrganizationIdBasedOnPolicy(userId, organization_id, filterType) {
		try {
			let organizationIds = []
			filterType = filterType.toLowerCase()

			let visibilityPolicies = []
			let orgVisibilityPolicies = []

			const policyMap = {
				[common.MENTEE_ROLE]: ['organization_id', 'external_mentee_visibility_policy'],
				[common.SESSION]: ['organization_id', 'external_session_visibility_policy'],
				[common.MENTOR_ROLE]: ['organization_id', 'external_mentor_visibility_policy'],
			}
			visibilityPolicies = policyMap[filterType] || []
			const attributes = visibilityPolicies

			const orgExtension = await organisationExtensionQueries.findOne(
				{ organization_id },
				{
					attributes: attributes,
				}
			)

			const orgPolicyMap = {
				[common.MENTEE_ROLE]: orgExtension.external_mentee_visibility_policy,
				[common.SESSION]: orgExtension.external_session_visibility_policy,
				[common.MENTOR_ROLE]: orgExtension.external_mentor_visibility_policy,
			}
			orgVisibilityPolicies = orgPolicyMap[filterType] || []
			const visibilityPolicy = orgVisibilityPolicies

			if (orgExtension?.organization_id) {
				if (visibilityPolicy === common.CURRENT) {
					organizationIds.push(orgExtension.organization_id)
				} else if (visibilityPolicy === common.ASSOCIATED || visibilityPolicy === common.ALL) {
					organizationIds.push(orgExtension.organization_id)
					let relatedOrgs = []
					let userOrgDetails = await userRequests.fetchOrgDetails({
						organizationId: orgExtension.organization_id,
					})
					if (userOrgDetails.success && userOrgDetails.data?.result?.related_orgs?.length > 0) {
						relatedOrgs = userOrgDetails.data.result.related_orgs
					}
					if (visibilityPolicy === common.ASSOCIATED) {
						const associatedAdditionalFilter =
							filterType == common.MENTEE_ROLE
								? {
										mentee_visibility_policy: {
											[Op.ne]: 'CURRENT',
										},
								  }
								: filterType == common.SESSION
								? {
										session_visibility_policy: {
											[Op.ne]: 'CURRENT',
										},
								  }
								: {
										mentor_visibility_policy: {
											[Op.ne]: 'CURRENT',
										},
								  }

						const organizationExtension = await organisationExtensionQueries.findAll(
							{
								[Op.and]: [
									{
										organization_id: {
											[Op.in]: [...relatedOrgs],
										},
									},
									associatedAdditionalFilter,
								],
							},
							{
								attributes: ['organization_id'],
							}
						)
						organizationIds.push(orgExtension.organization_id)
						if (organizationExtension) {
							const organizationIdsFromOrgExtension = organizationExtension.map(
								(orgExt) => orgExt.organization_id
							)
							organizationIds.push(...organizationIdsFromOrgExtension)
						}
					} else {
						// filter out the organizations
						// CASE 1 : in case of mentee listing filterout organizations with external_mentee_visibility_policy = ALL
						// CASE 2 : in case of session listing filterout organizations with session_visibility_policy = ALL
						// CASE 3 : in case of mentor listing filterout organizations with mentor_visibility_policy = ALL
						const filterQuery =
							filterType == common.MENTEE_ROLE
								? {
										mentee_visibility_policy: common.ALL, //1
								  }
								: filterType == common.SESSION
								? {
										session_visibility_policy: common.ALL, //2
								  }
								: {
										mentor_visibility_policy: common.ALL, //3
								  }

						// this filter is applied for the below condition
						// SM mentee_visibility_policy (in case of mentee list) or external_mentor_visibility policy (in case of mentor list) = ALL
						//  and CASE 1 (mentee list) : Mentees is related to the SM org but external_mentee_visibility is CURRENT (exclude these mentees)
						//  CASE 2 : (session list) : Sessions is related to the SM org but session_visibility is CURRENT (exclude these sessions)
						//  CASE 3 : (mentor list) : Mentors is related to SM Org but mentor_visibility set to CURRENT  (exclude these mentors)
						const additionalFilter =
							filterType == common.MENTEE_ROLE
								? {
										mentee_visibility_policy: {
											//1
											[Op.ne]: 'CURRENT',
										},
								  }
								: filterType == common.SESSION
								? {
										session_visibility_policy: {
											//2
											[Op.ne]: 'CURRENT',
										},
								  }
								: {
										mentor_visibility_policy: {
											//3
											[Op.ne]: 'CURRENT',
										},
								  }
						const organizationExtension = await organisationExtensionQueries.findAll(
							{
								[Op.or]: [
									filterQuery,
									{
										[Op.and]: [
											{
												organization_id: {
													[Op.in]: [...relatedOrgs],
												},
											},
											additionalFilter,
										],
									},
								],
							},
							{
								attributes: ['organization_id'],
							}
						)
						organizationIds.push(orgExtension.organization_id)
						if (organizationExtension) {
							const organizationIdsFromOrgExtension = organizationExtension.map(
								(orgExt) => orgExt.organization_id
							)
							organizationIds.push(...organizationIdsFromOrgExtension)
						}
					}
				}
			}

			return {
				success: true,
				result: organizationIds,
			}
		} catch (error) {
			return {
				success: false,
				message: error.message,
			}
		}
	}

	static async getEntityTypeWithEntitiesBasedOnOrg(organization_ids, entity_types, defaultOrgId = '', modelName) {
		try {
			let filter = {
				status: common.ACTIVE_STATUS,
				allow_filtering: true,
				has_entities: true,
				organization_id: {
					[Op.in]: defaultOrgId ? [...organization_ids, defaultOrgId] : organization_ids,
				},
			}

			let entityTypes = []
			if (entity_types) {
				entityTypes = entity_types.split(',')
				filter.value = {
					[Op.in]: entityTypes,
				}
			}

			if (modelName) {
				filter.model_names = { [Op.contains]: [modelName] }
			}
			//fetch entity types and entities
			let entityTypesWithEntities = await entityTypeQueries.findUserEntityTypesAndEntities(filter)

			return {
				success: true,
				result: entityTypesWithEntities,
			}
		} catch (error) {
			return {
				success: false,
				message: error.message,
			}
		}
	}

	/* List mentees and search with name , email
	 * @method
	 * @name list
	 * @param {String} userId - User ID of the mentee.
	 * @param {Number} pageNo - Page No.
	 * @param {Number} pageSize - Page Size.
	 * @param {String} searchText
	 * @param {String} queryParams
	 * @param {String} userId
	 * @param {Boolean} isAMentor - true/false.
	 * @returns {Promise<Object>} - returns the list of mentees
	 */
	static async list(pageNo, pageSize, searchText, queryParams, userId, isAMentor) {
		try {
			let additionalProjectionString = ''

			// check for fields query
			if (queryParams.fields && queryParams.fields !== '') {
				additionalProjectionString = queryParams.fields
				delete queryParams.fields
			}
			let organization_ids = []

			const [sortBy, order] = ['name'].includes(queryParams.sort_by)
				? [queryParams.sort_by, queryParams.order || 'ASC']
				: [false, 'ASC']

			if (queryParams.hasOwnProperty('organization_ids')) {
				organization_ids = queryParams['organization_ids'].split(',')
			}

			const query = utils.processQueryParametersWithExclusions(queryParams)
			const userExtensionModelName = await menteeQueries.getModelName()

			let validationData = await entityTypeQueries.findAllEntityTypesAndEntities({
				status: common.ACTIVE_STATUS,
				model_names: { [Op.overlap]: [userExtensionModelName] },
			})

			let filteredQuery = utils.validateAndBuildFilters(
				query,
				JSON.parse(JSON.stringify(validationData)),
				userExtensionModelName
			)

			const emailIds = []
			const searchTextArray = searchText ? searchText.split(',') : []

			searchTextArray.forEach((element) => {
				if (utils.isValidEmail(element)) {
					emailIds.push(emailEncryption.encrypt(element.toLowerCase()))
				}
			})
			const hasValidEmails = emailIds.length > 0

			const saasFilter = await this.filterMenteeListBasedOnSaasPolicy(userId, isAMentor, organization_ids)
			let extensionDetails = await menteeQueries.getAllUsers(
				[],
				pageNo,
				pageSize,
				filteredQuery,
				saasFilter,
				additionalProjectionString,
				false,
				hasValidEmails ? emailIds : searchText
			)

			if (extensionDetails?.data.length == 0) {
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'MENTEE_LIST',
					result: extensionDetails,
				})
			}

			const menteeIds = extensionDetails.data.map((item) => item.user_id)
			const userDetails = await userRequests.getUserDetailedList(menteeIds)

			if (extensionDetails.data.length > 0) {
				const uniqueOrgIds = [...new Set(extensionDetails.data.map((obj) => obj.organization_id))]
				extensionDetails.data = await entityTypeService.processEntityTypesToAddValueLabels(
					extensionDetails.data,
					uniqueOrgIds,
					userExtensionModelName,
					'organization_id'
				)
			}
			const extensionDataMap = new Map(extensionDetails.data.map((newItem) => [newItem.user_id, newItem]))
			userDetails.result = userDetails.result
				.map((value) => {
					// Map over each value in the values array of the current group
					const user_id = value.user_id
					// Check if extensionDataMap has an entry with the key equal to the user_id
					if (extensionDataMap.has(user_id)) {
						const newItem = extensionDataMap.get(user_id)
						value = { ...value, ...newItem }
						value.id = user_id
						delete value.user_id
						delete value.mentor_visibility
						delete value.mentee_visibility
						delete value.organization_id
						delete value.meta
						delete value.rating
						delete value.permissions
						return value
					}
					return null
				})
				.filter((value) => value !== null)

			if (queryParams.session_id) {
				const enrolledMentees = await getEnrolledMentees(queryParams.session_id, '', userId)

				userDetails.result.forEach((user) => {
					user.is_enrolled = false
					const enrolledUser = _.find(enrolledMentees, { id: user.id })
					if (enrolledUser) {
						user.is_enrolled = true
						user.enrolled_type = enrolledUser.type
					}
				})
			}

			// Check if sortBy have values before applying sorting
			if (sortBy) {
				userDetails.result = userDetails.result.sort((a, b) => {
					// Determine the sorting order based on the 'order' value
					const sortOrder = order.toLowerCase() === 'asc' ? 1 : order.toLowerCase() === 'desc' ? -1 : 1

					// Customize the sorting based on the provided sortBy field
					return sortOrder * a[sortBy].localeCompare(b[sortBy])
				})
			}

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: userDetails.message,
				result: {
					data: userDetails.result,
					count: extensionDetails.count,
				},
			})
		} catch (error) {
			throw error
		}
	}
	static async filterMenteeListBasedOnSaasPolicy(userId, isAMentor, organization_ids = []) {
		try {
			// let extensionColumns = isAMentor ? await mentorQueries.getColumns() : await menteeQueries.getColumns()
			// // check for external_mentee_visibility else fetch external_mentor_visibility
			// extensionColumns = extensionColumns.includes('external_mentee_visibility')
			// 	? ['external_mentee_visibility', 'organization_id']
			// 	: ['external_mentor_visibility', 'organization_id']

			const userPolicyDetails = isAMentor
				? await mentorQueries.getMentorExtension(userId, ['organization_id'])
				: await menteeQueries.getMenteeExtension(userId, ['organization_id'])

			const getOrgPolicy = await organisationExtensionQueries.findOne(
				{
					organization_id: userPolicyDetails.organization_id,
				},
				{
					attributes: ['external_mentee_visibility_policy', 'organization_id'],
				}
			)
			// Throw error if mentor/mentee extension not found
			if (!userPolicyDetails || Object.keys(userPolicyDetails).length === 0) {
				return responses.failureResponse({
					statusCode: httpStatusCode.not_found,
					message: isAMentor ? 'MENTORS_NOT_FOUND' : 'MENTEE_EXTENSION_NOT_FOUND',
					responseCode: 'CLIENT_ERROR',
				})
			}

			let filter = ''
			// searching for specific organization
			let additionalFilter = ``
			if (organization_ids.length !== 0) {
				additionalFilter = `AND "organization_id" in (${organization_ids.map((id) => `'${id}'`).join(',')}) `
			}
			if (getOrgPolicy.external_mentee_visibility_policy && userPolicyDetails.organization_id) {
				const visibilityPolicy = getOrgPolicy.external_mentee_visibility_policy

				// Filter user data based on policy
				// generate filter based on condition
				if (visibilityPolicy === common.CURRENT) {
					/**
					 * if user external_mentor_visibility is current. He can only see his/her organizations mentors
					 * so we will check mentor's organization_id and user organization_id are matching
					 */
					filter = `AND "organization_id" = '${userPolicyDetails.organization_id}'`
				} else if (visibilityPolicy === common.ASSOCIATED) {
					/**
					 * If user external_mentor_visibility is associated
					 * <<point**>> first we need to check if mentor's visible_to_organizations contain the user organization_id and verify mentor's visibility is not current (if it is ALL and ASSOCIATED it is accessible)
					 */
					filter =
						additionalFilter +
						`AND ( ('${userPolicyDetails.organization_id}' = ANY("visible_to_organizations") AND "mentee_visibility" != 'CURRENT')`

					if (additionalFilter.length === 0)
						filter += ` OR organization_id = '${userPolicyDetails.organization_id}' )`
					else filter += `)`
				} else if (visibilityPolicy === common.ALL) {
					/**
					 * We need to check if mentor's visible_to_organizations contain the user organization_id and verify mentor's visibility is not current (if it is ALL and ASSOCIATED it is accessible)
					 * OR if mentor visibility is ALL that mentor is also accessible
					 */
					filter =
						additionalFilter +
						`AND (('${userPolicyDetails.organization_id}' = ANY("visible_to_organizations") AND "mentee_visibility" != 'CURRENT' ) OR "mentee_visibility" = 'ALL' OR "organization_id" = '${userPolicyDetails.organization_id}')`
				}
			}

			return filter
		} catch (err) {
			return err
		}
	}

	/**
	 * @description 							- check if mentee is accessible based on user's saas policy.
	 * @method
	 * @name checkIfMenteeIsAccessible
	 * @param {Number} userId 					- User id.
	 * @param {Array} userData					- User data
	 * @param {Boolean} isAMentor 				- user mentor or not.
	 * @returns {Boolean} 						- user Accessible
	 */

	static async checkIfMenteeIsAccessible(userData, userId, isAMentor) {
		try {
			// user can be mentor or mentee, based on isAMentor key get policy details
			const userPolicyDetails = isAMentor
				? await mentorQueries.getMentorExtension(userId, ['external_mentee_visibility', 'organization_id'])
				: await menteeQueries.getMenteeExtension(userId, ['external_mentee_visibility', 'organization_id'])

			// Throw error if mentor/mentee extension not found
			if (!userPolicyDetails || Object.keys(userPolicyDetails).length === 0) {
				return responses.failureResponse({
					statusCode: httpStatusCode.not_found,
					message: isAMentor ? 'MENTORS_NOT_FOUND' : 'MENTEE_EXTENSION_NOT_FOUND',
					responseCode: 'CLIENT_ERROR',
				})
			}

			// check the accessibility conditions
			const accessibleUsers = userData.map((mentee) => {
				let isAccessible = false

				if (userPolicyDetails.external_mentee_visibility && userPolicyDetails.organization_id) {
					const { external_mentee_visibility, organization_id } = userPolicyDetails

					switch (external_mentee_visibility) {
						/**
						 * if user external_mentee_visibility is current. He can only see his/her organizations mentee
						 * so we will check mentee's organization_id and user organization_id are matching
						 */
						case common.CURRENT:
							isAccessible = mentee.organization_id === organization_id
							break
						/**
						 * If user external_mentee_visibility is associated
						 * <<point**>> first we need to check if mentee's visible_to_organizations contain the user organization_id and verify mentee's visibility is not current (if it is ALL and ASSOCIATED it is accessible)
						 */
						case common.ASSOCIATED:
							isAccessible =
								(mentee.visible_to_organizations.includes(organization_id) &&
									mentee.mentee_visibility != common.CURRENT) ||
								mentee.organization_id === organization_id
							break
						/**
						 * We need to check if mentee's visible_to_organizations contain the user organization_id and verify mentee's visibility is not current (if it is ALL and ASSOCIATED it is accessible)
						 * OR if mentee visibility is ALL that mentee is also accessible
						 */
						case common.ALL:
							isAccessible =
								(mentee.visible_to_organizations.includes(organization_id) &&
									mentee.mentee_visibility != common.CURRENT) ||
								mentee.mentee_visibility === common.ALL ||
								mentee.organization_id === organization_id
							break
						default:
							break
					}
				}
				return { mentee, isAccessible }
			})
			const isAccessible = accessibleUsers.some((user) => user.isAccessible)
			return isAccessible
		} catch (error) {
			return error
		}
	}

	/**
	 * Retrieves a communication token for the logged in user.
	 *
	 * This asynchronous method logs in a user using their unique identifier (`id`)
	 * to obtain a communication token and other relevant details, then returns a
	 * standardized success response with the token, user ID, and metadata.
	 *
	 * @async
	 * @function getCommunicationToken
	 * @param {string} id - The unique identifier of the user for whom the communication token is to be retrieved.
	 * @returns {Promise<Object>} A promise that resolves to an object containing the response code, message, result data,
	 * and additional metadata.
	 *
	 * @throws {Error} If the communicationHelper login process fails, this method may throw an error.
	 *
	 * @example
	 * const response = await getCommunicationToken(123);
	 * console.log(response);
	 * // {
	 * //   responseCode: "OK",
	 * //   message: "Communication token fetched successfully!",
	 * //   result: {
	 * //     auth_token: "_GTFHENH422lGlLcgYQfu2GnnWO8bg6zY8ZHrXkcNmN",
	 * //     user_id: "Q9hz3jbPXkk3fXQoL"
	 * //   },
	 * //   meta: {
	 * //     correlation: "69893cb9-8b0c-44f9-945e-1bff2174af0d",
	 * //     meetingPlatform: "BBB"
	 * //   }
	 * // }
	 */
	static async getCommunicationToken(id) {
		try {
			const token = await communicationHelper.login(id)

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'COMMUNICATION_TOKEN_FETCHED_SUCCESSFULLY',
				result: token,
			})
		} catch (error) {
			if (error.message == 'unauthorized') {
				return responses.failureResponse({
					statusCode: httpStatusCode.not_found,
					message: 'COMMUNICATION_TOKEN_NOT_FOUND',
					responseCode: 'CLIENT_ERROR',
				})
			}
		}
	}

	/**
	 * Logs out a user by invoking the `communicationHelper.logout` function and
	 * returns a success response upon successful logout. If the logout fails due to
	 * an unauthorized error, returns a failure response indicating that the communication
	 * token was not found.
	 *
	 * @async
	 * @function logout
	 * @param {string} id - The ID of the user to be logged out.
	 * @returns {Promise<Object>} Resolves with a success response object if the logout is successful,
	 * or a failure response object if an unauthorized error occurs.
	 *
	 * @throws {Error} If an error other than 'unauthorized' occurs, it will not be caught here and may be handled upstream.
	 */
	static async logout(id) {
		try {
			const response = await communicationHelper.logout(id)

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'USER_LOGGED_OUT',
				result: response,
			})
		} catch (error) {
			if (error.message === 'unauthorized') {
				return responses.failureResponse({
					statusCode: httpStatusCode.not_found,
					message: 'COMMUNICATION_TOKEN_NOT_FOUND',
					responseCode: 'CLIENT_ERROR',
				})
			}
			throw error // rethrow other errors to be handled by a higher-level error handler
		}
	}
}

function convertEntitiesForFilter(entityTypes) {
	const result = {}

	entityTypes.forEach((entityType) => {
		const key = entityType.value

		if (!result[key]) {
			result[key] = []
		}

		const newObj = {
			id: entityType.id,
			label: entityType.label,
			value: entityType.value,
			parent_id: entityType.parent_id,
			organization_id: entityType.organization_id,
			entities: entityType.entities || [],
		}

		result[key].push(newObj)
	})
	return result
}

function filterEntitiesBasedOnParent(data, defaultOrgId, doNotRemoveDefaultOrg) {
	let result = {}

	for (let key in data) {
		let countWithParentId = 0
		let countOfEachKey = data[key].length
		data[key].forEach((obj) => {
			if (obj.parent_id !== null && obj.organization_id != defaultOrgId) {
				countWithParentId++
			}
		})

		let outputArray = data[key]
		if (countOfEachKey > 1 && countWithParentId == countOfEachKey - 1 && !doNotRemoveDefaultOrg) {
			outputArray = data[key].filter((obj) => !(obj.organization_id === defaultOrgId && obj.parent_id === null))
		}

		result[key] = outputArray
	}
	return result
}
