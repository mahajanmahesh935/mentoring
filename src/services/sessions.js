// Dependencies
const _ = require('lodash')
const moment = require('moment-timezone')
const httpStatusCode = require('@generics/http-status')
const apiEndpoints = require('@constants/endpoints')
const common = require('@constants/common')
const kafkaCommunication = require('@generics/kafka-communication')
const apiBaseUrl = process.env.USER_SERVICE_HOST + process.env.USER_SERVICE_BASE_URL
const request = require('request')
const sessionQueries = require('@database/queries/sessions')
const sessionAttendeesQueries = require('@database/queries/sessionAttendees')
const mentorExtensionQueries = require('@database/queries/mentorExtension')
const menteeExtensionQueries = require('@database/queries/userExtension')
const sessionEnrollmentQueries = require('@database/queries/sessionEnrollments')
const postSessionQueries = require('@database/queries/postSessionDetail')
const entityTypeQueries = require('@database/queries/entityType')
const entitiesQueries = require('@database/queries/entity')
const { Op } = require('sequelize')
const notificationQueries = require('@database/queries/notificationTemplate')

const schedulerRequest = require('@requests/scheduler')
const fileService = require('@services/files')
const bigBlueButtonRequests = require('@requests/bigBlueButton')
const userRequests = require('@requests/user')
const utils = require('@generics/utils')
const bigBlueButtonService = require('./bigBlueButton')
const organisationExtensionQueries = require('@database/queries/organisationExtension')
const { getDefaultOrgId } = require('@helpers/getDefaultOrgId')
const { removeDefaultOrgEntityTypes } = require('@generics/utils')
const menteeService = require('@services/mentees')
const { updatedDiff } = require('deep-object-diff')
const { Parser } = require('@json2csv/plainjs')
const entityTypeService = require('@services/entity-type')
const mentorsService = require('./mentors')
const { getEnrolledMentees } = require('@helpers/getEnrolledMentees')
const responses = require('@helpers/responses')
const path = require('path')
const ProjectRootDir = path.join(__dirname, '../')
const inviteeFileDir = ProjectRootDir + common.tempFolderForBulkUpload
const fileUploadQueries = require('@database/queries/fileUpload')
const { Queue } = require('bullmq')
const fs = require('fs')
const csv = require('csvtojson')
const csvParser = require('csv-parser')
const axios = require('axios')
const messages = require('../locales/en.json')
const { validateDefaultRulesFilter } = require('@helpers/defaultRules')
const adminService = require('@services/admin')
const mentorQueries = require('@database/queries/mentorExtension')
const emailEncryption = require('@utils/emailEncryption')

module.exports = class SessionsHelper {
	/**
	 * Create session.
	 *
	 * @static
	 * @async
	 * @method
	 * @name create
	 * @param {Object} bodyData 			- Session creation data.
	 * @param {String} loggedInUserId 		- logged in user id.
	 * @param {Boolean} isAMentor 			- indicates if user is mentor or not
	 * @returns {JSON} 						- Create session data.
	 */

	static async create(bodyData, loggedInUserId, orgId, isAMentor, notifyUser) {
		try {
			// check if session mentor is added in the mentee list
			if (bodyData?.mentees?.includes(bodyData?.mentor_id)) {
				return responses.failureResponse({
					message: 'SESSION_MENTOR_ADDED_TO_MENTEE_LIST',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			// If type is passed store it in upper case
			bodyData.type && (bodyData.type = bodyData.type.toUpperCase())
			// If session type is private and mentorId is not passed in request body return an error
			if (bodyData.type && (!bodyData.mentor_id || bodyData.mentor_id == '')) {
				return responses.failureResponse({
					message: 'MENTORS_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			bodyData.created_by = loggedInUserId
			bodyData.updated_by = loggedInUserId
			let menteeIdsToEnroll = bodyData.mentees ? bodyData.mentees : []
			const mentorIdToCheck = bodyData.mentor_id || loggedInUserId
			const isSessionCreatedByManager = !!bodyData.mentor_id

			if (bodyData.type == common.SESSION_TYPE.PRIVATE && menteeIdsToEnroll.length === 0) {
				return responses.failureResponse({
					message: 'MENTEES_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const mentorDetails = await mentorExtensionQueries.getMentorExtension(mentorIdToCheck)
			if (!mentorDetails) {
				return responses.failureResponse({
					message: 'INVALID_PERMISSION',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			const isAccessible = await mentorsService.checkIfMentorIsAccessible(
				[mentorDetails],
				loggedInUserId,
				isAMentor
			)
			// update mentor Id in session creation data
			if (!bodyData.mentor_id) {
				bodyData.mentor_id = loggedInUserId
			} else if (!isAccessible) {
				return responses.failureResponse({
					message: 'USER_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const validMenteeIds = menteeIdsToEnroll.filter((id) => typeof id === 'number')
			if (menteeIdsToEnroll.length != 0 && validMenteeIds.length != 0) {
				const menteesDetailsInMentor = await this.validateMentorExtensions(menteeIdsToEnroll)
				const invalidMentorId =
					menteesDetailsInMentor.invalidMentors.length === 0 ? [] : menteesDetailsInMentor.invalidMentors
				const menteesDetailsInMentee = await this.validateMenteeExtensions(invalidMentorId)
				if (
					(menteesDetailsInMentor.validMentors.length === 0) &
					(menteesDetailsInMentee.validMentees.length === 0)
				) {
					return responses.failureResponse({
						message: 'MENTEES_NOT_FOUND',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
				const allValidMenteesDetails = menteesDetailsInMentor.validMentors.concat(
					menteesDetailsInMentee.validMentees
				)
				const isMenteeAccessible = await menteeService.checkIfMenteeIsAccessible(
					allValidMenteesDetails,
					loggedInUserId,
					isAMentor
				)
				if (!isMenteeAccessible && bodyData.type === common.SESSION_TYPE.PRIVATE) {
					return responses.failureResponse({
						message: 'USER_NOT_FOUND',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
			}
			// Check if mentor is available for this session's time slot
			const timeSlot = await this.isTimeSlotAvailable(mentorIdToCheck, bodyData.start_date, bodyData.end_date)

			// If time slot not available return corresponding error
			if (timeSlot.isTimeSlotAvailable === false) {
				const errorMessage = isSessionCreatedByManager
					? 'SESSION_CREATION_LIMIT_EXCEDED_FOR_GIVEN_MENTOR'
					: { key: 'INVALID_TIME_SELECTION', interpolation: { sessionName: timeSlot.sessionName } }

				return responses.failureResponse({
					message: errorMessage,
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			// Calculate duration of the session
			let duration = moment.duration(moment.unix(bodyData.end_date).diff(moment.unix(bodyData.start_date)))
			let elapsedMinutes = duration.asMinutes()

			// Based on session duration check recommended conditions
			if (elapsedMinutes < 30) {
				return responses.failureResponse({
					message: 'BELOW_MINIMUM_SESSION_TIME',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (elapsedMinutes > 1440) {
				return responses.failureResponse({
					message: 'EXCEEDED_MAXIMUM_SESSION_TIME',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			// Fetch mentor name from user service to store it in sessions data {for listing purpose}
			const userDetails = await mentorExtensionQueries.getMentorExtension(mentorIdToCheck, ['name'], true)
			if (userDetails && userDetails.name) {
				bodyData.mentor_name = userDetails.name
			}

			// Get default org id and entities
			const defaultOrgId = await getDefaultOrgId()
			if (!defaultOrgId)
				return responses.failureResponse({
					message: 'DEFAULT_ORG_ID_NOT_SET',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			const sessionModelName = await sessionQueries.getModelName()

			let entityTypes = await entityTypeQueries.findUserEntityTypesAndEntities({
				status: 'ACTIVE',
				organization_id: {
					[Op.in]: [orgId, defaultOrgId],
				},
				model_names: { [Op.contains]: [sessionModelName] },
			})

			//validationData = utils.removeParentEntityTypes(JSON.parse(JSON.stringify(validationData)))
			const validationData = removeDefaultOrgEntityTypes(entityTypes, orgId)
			bodyData.status = common.PUBLISHED_STATUS
			let res = utils.validateInput(bodyData, validationData, sessionModelName)
			if (!res.success) {
				return responses.failureResponse({
					message: 'SESSION_CREATION_FAILED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
					result: res.errors,
				})
			}
			let sessionModel = await sessionQueries.getColumns()
			bodyData = utils.restructureBody(bodyData, validationData, sessionModel)

			if (!bodyData.meeting_info) {
				bodyData.meeting_info = {
					platform: process.env.DEFAULT_MEETING_SERVICE,
					value: process.env.DEFAULT_MEETING_SERVICE,
				}
				if (process.env.DEFAULT_MEETING_SERVICE === common.BBB_VALUE) {
					bodyData.meeting_info = {
						platform: common.BBB_PLATFORM,
						value: common.BBB_VALUE,
					}
				}
			}

			bodyData['mentor_organization_id'] = orgId
			// SAAS changes; Include visibility and visible organisation
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
			// Find organisation policy from organisation_extension table
			let organisationPolicy = await organisationExtensionQueries.findOrInsertOrganizationExtension(
				orgId,
				userOrgDetails.data.result.name
			)
			bodyData.visibility = organisationPolicy.session_visibility_policy
			bodyData.visible_to_organizations = userOrgDetails.data.result.related_orgs
				? userOrgDetails.data.result.related_orgs.concat([orgId])
				: [orgId]
			if (organisationPolicy.mentee_feedback_question_set)
				bodyData.mentee_feedback_question_set = organisationPolicy.mentee_feedback_question_set
			if (organisationPolicy.mentor_feedback_question_set)
				bodyData.mentor_feedback_question_set = organisationPolicy.mentor_feedback_question_set

			// Create session

			const data = await sessionQueries.create(bodyData)

			if (!data?.id) {
				return responses.failureResponse({
					message: 'SESSION_CREATION_FAILED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
					result: res.errors,
				})
			}
			// If menteeIds are provided in the req body enroll them
			if (menteeIdsToEnroll.length > 0) {
				await this.addMentees(data.id, menteeIdsToEnroll, bodyData.time_zone)
			}

			await this.setMentorPassword(data.id, data.mentor_id)
			await this.setMenteePassword(data.id, data.created_at)

			const processDbResponse = utils.processDbResponse(data.toJSON(), validationData)

			// Set notification schedulers for the session
			// Deep clone to avoid unintended modifications to the original object.
			const jobsToCreate = _.cloneDeep(common.jobsToCreate)

			// Calculate delays for notification jobs
			jobsToCreate[0].delay = await utils.getTimeDifferenceInMilliseconds(bodyData.start_date, 1, 'hour')
			jobsToCreate[1].delay = await utils.getTimeDifferenceInMilliseconds(bodyData.start_date, 24, 'hour')
			jobsToCreate[2].delay = await utils.getTimeDifferenceInMilliseconds(bodyData.start_date, 15, 'minutes')
			jobsToCreate[3].delay = await utils.getTimeDifferenceInMilliseconds(bodyData.end_date, 0, 'minutes')

			// Iterate through the jobs and create scheduler jobs
			for (let jobIndex = 0; jobIndex < jobsToCreate.length; jobIndex++) {
				// Append the session ID to the job ID

				jobsToCreate[jobIndex].jobId = jobsToCreate[jobIndex].jobId + data.id

				const reqBody = {
					job_id: jobsToCreate[jobIndex].jobId,
					email_template_code: jobsToCreate[jobIndex].emailTemplate,
					job_creator_org_id: orgId,
				}
				// Create the scheduler job with the calculated delay and other parameters
				await schedulerRequest.createSchedulerJob(
					jobsToCreate[jobIndex].jobId,
					jobsToCreate[jobIndex].delay,
					jobsToCreate[jobIndex].jobName,
					reqBody,
					reqBody.email_template_code
						? common.notificationEndPoint
						: common.sessionCompleteEndpoint + data.id,
					reqBody.email_template_code ? common.POST_METHOD : common.PATCH_METHOD
				)
			}

			let emailTemplateCode
			if (isSessionCreatedByManager && userDetails.email && notifyUser) {
				if (data.type == common.SESSION_TYPE.PRIVATE) {
					//assign template data
					emailTemplateCode = process.env.MENTOR_PRIVATE_SESSION_INVITE_BY_MANAGER_EMAIL_TEMPLATE
				} else {
					// public session email template
					emailTemplateCode = process.env.MENTOR_PUBLIC_SESSION_INVITE_BY_MANAGER_EMAIL_TEMPLATE
				}
				// send mail to mentors on session creation if session created by manager
				const templateData = await notificationQueries.findOneEmailTemplate(emailTemplateCode, orgId)

				// If template data is available. create mail data and push to kafka
				if (templateData) {
					let name = userDetails.name
					// Push successful enrollment to session in kafka
					const payload = {
						type: 'email',
						email: {
							to: userDetails.email,
							subject: templateData.subject,
							body: utils.composeEmailBody(templateData.body, {
								name,
								sessionTitle: data.title,
								mentorName: data.mentor_name,
								startDate: utils.getTimeZone(data.start_date, common.dateFormat, data.time_zone),
								startTime: utils.getTimeZone(data.start_date, common.timeFormat, data.time_zone),
								sessionDuration: Math.round(elapsedMinutes),
								sessionPlatform: data.meeting_info.platform,
								unitOfTime: common.UNIT_OF_TIME,
								sessionType: data.type,
								noOfMentees: menteeIdsToEnroll.length,
							}),
						},
					}
					console.log('EMAIL PAYLOAD: ', payload)
					await kafkaCommunication.pushEmailToKafka(payload)
				}
			}

			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'SESSION_CREATED_SUCCESSFULLY',
				result: processDbResponse,
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	/**
	 * Update session.
	 * @method
	 * @name update
	 * @param {String} sessionId - Session id.
	 * @param {Object} bodyData - Session creation data.
	 * @param {String} userId - logged in user id.
	 * @param {String} method - method name.
	 * @returns {JSON} - Update session data.
	 */

	static async update(sessionId, bodyData, userId, method, orgId, notifyUser) {
		let isSessionReschedule = false
		let isSessionCreatedByManager = false
		let skipValidation = true
		try {
			// To determine the session is created by manager or mentor we need to fetch the session details first
			// Then compare mentor_id and created_by information
			// If manager is the session creator then no need to check Mentor extension data
			let sessionDetail = await sessionQueries.findById(sessionId)
			if (!sessionDetail) {
				return responses.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (bodyData.mentor_id && bodyData.type) {
				if (
					sessionDetail.dataValues.mentor_id != bodyData.mentor_id ||
					sessionDetail.dataValues.type != bodyData.type
				) {
					return responses.failureResponse({
						message: 'CANNOT_EDIT_MENTOR_AND_TYPE',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
			}

			//	if(sessionDetail)
			// check if session mentor is added in the mentee list
			if (bodyData?.mentees?.includes(bodyData?.mentor_id)) {
				return responses.failureResponse({
					message: 'SESSION_MENTOR_ADDED_TO_MENTEE_LIST',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			sessionDetail = sessionDetail.dataValues
			if (sessionDetail.created_by !== userId) {
				return responses.failureResponse({
					message: 'CANNOT_EDIT_DELETE_LIVE_SESSION',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			// If type is passed store it in upper case
			bodyData.type && (bodyData.type = bodyData.type.toUpperCase())
			// session can be edited by only the creator
			if (sessionDetail.created_by != userId) {
				return responses.failureResponse({
					message: 'INVALID_PERMISSION',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			if (
				(sessionDetail.mentor_id &&
					sessionDetail.created_by &&
					sessionDetail.mentor_id !== sessionDetail.created_by) ||
				bodyData.mentee
			) {
				isSessionCreatedByManager = true
				// If session is created by manager update userId with mentor_id
				userId = sessionDetail.mentor_id
			}

			let mentorExtension = await mentorExtensionQueries.getMentorExtension(userId)
			if (!mentorExtension) {
				return responses.failureResponse({
					message: 'INVALID_PERMISSION',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			let isEditingAllowedAtAnyTime = process.env.SESSION_EDIT_WINDOW_MINUTES == 0

			const currentDate = moment.utc()
			const startDate = moment.unix(sessionDetail.start_date)
			let elapsedMinutes = startDate.diff(currentDate, 'minutes')

			if (!isEditingAllowedAtAnyTime && elapsedMinutes < process.env.SESSION_EDIT_WINDOW_MINUTES) {
				return responses.failureResponse({
					message: {
						key: 'SESSION_EDIT_WINDOW',
						interpolation: { editWindow: process.env.SESSION_EDIT_WINDOW_MINUTES },
					},
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const timeSlot = await this.isTimeSlotAvailable(userId, bodyData.start_date, bodyData.end_date, sessionId)
			if (timeSlot.isTimeSlotAvailable === false) {
				return responses.failureResponse({
					message: {
						key: 'INVALID_TIME_SELECTION',
						interpolation: { sessionName: timeSlot.sessionName },
					},
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const { getDefaultOrgId } = require('@helpers/getDefaultOrgId')
			const defaultOrgId = await getDefaultOrgId()
			if (!defaultOrgId)
				return responses.failureResponse({
					message: 'DEFAULT_ORG_ID_NOT_SET',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})

			const sessionModelName = await sessionQueries.getModelName()

			let entityTypes = await entityTypeQueries.findUserEntityTypesAndEntities({
				status: 'ACTIVE',
				organization_id: {
					[Op.in]: [orgId, defaultOrgId],
				},
				model_names: { [Op.contains]: [sessionModelName] },
			})

			//validationData = utils.removeParentEntityTypes(JSON.parse(JSON.stringify(validationData)))
			if (bodyData.status == common.VALID_STATUS) {
				bodyData.status = sessionDetail.status
			}
			const validationData = removeDefaultOrgEntityTypes(entityTypes, orgId)
			if (!method === common.DELETE_METHOD) {
				let res = utils.validateInput(bodyData, validationData, sessionModelName, skipValidation)
				if (!res.success) {
					return responses.failureResponse({
						message: 'SESSION_CREATION_FAILED',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
						result: res.errors,
					})
				}
			}
			let sessionModel = await sessionQueries.getColumns()
			bodyData = utils.restructureBody(bodyData, validationData, sessionModel)

			let isSessionDataChanged = false
			let updatedSessionData = {}

			if (method != common.DELETE_METHOD && (bodyData.end_date || bodyData.start_date)) {
				let duration = moment.duration(moment.unix(bodyData.end_date).diff(moment.unix(bodyData.start_date)))
				let elapsedMinutes = duration.asMinutes()
				if (elapsedMinutes < 30) {
					return responses.failureResponse({
						message: 'BELOW_MINIMUM_SESSION_TIME',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}

				if (elapsedMinutes > 1440) {
					return responses.failureResponse({
						message: 'EXCEEDED_MAXIMUM_SESSION_TIME',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
			}

			let message
			const sessionRelatedJobIds = common.notificationJobIdPrefixes.map((element) => element + sessionDetail.id)
			if (method == common.DELETE_METHOD) {
				if (sessionDetail.status == common.PUBLISHED_STATUS) {
					await sessionQueries.deleteSession({
						id: sessionId,
					})
					message = 'SESSION_DELETED_SUCCESSFULLY'

					// Delete scheduled jobs associated with deleted session
					for (let jobIndex = 0; jobIndex < sessionRelatedJobIds.length; jobIndex++) {
						// Remove scheduled notification jobs using the jobIds
						await schedulerRequest.removeScheduledJob({ jobId: sessionRelatedJobIds[jobIndex] })
					}
				} else {
					return responses.failureResponse({
						message: 'CANNOT_DELETE_LIVE_SESSION',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
			} else {
				// If the api is called for updating the session details execution flow enters to this  else block
				// If request body contains mentees field enroll/unenroll mentees from the session
				if (bodyData.mentees) {
					// Fetch mentees currently enrolled to the session
					const sessionAttendees = await sessionAttendeesQueries.findAll({
						session_id: sessionId,
					})
					let sessionAttendeesIds = []
					sessionAttendees.forEach((attendee) => {
						sessionAttendeesIds.push(attendee.mentee_id)
					})

					// Filter mentees to enroll/unEnroll
					const { menteesToRemove, menteesToAdd } = await this.filterMenteesToAddAndRemove(
						sessionAttendeesIds,
						bodyData.mentees
					)

					// Enroll newly added mentees by manager t the session
					if (menteesToAdd.length > 0) {
						await this.addMentees(sessionId, menteesToAdd, bodyData.time_zone)
					}

					// unenroll mentees
					if (menteesToRemove.length > 0) {
						await this.removeMentees(sessionId, menteesToRemove, bodyData.time_zone)
					}
				}
				const { rowsAffected, updatedRows } = await sessionQueries.updateOne({ id: sessionId }, bodyData, {
					returning: true,
				})
				if (rowsAffected == 0) {
					return responses.failureResponse({
						message: 'SESSION_ALREADY_UPDATED',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
				message = 'SESSION_UPDATED_SUCCESSFULLY'
				updatedSessionData = updatedRows[0].dataValues
				// check what are the values changed only if session is updated/deleted by manager
				// This is to decide on which email to trigger
				if (isSessionCreatedByManager) {
					// Confirm if session is edited or not.
					const updatedSessionDetails = updatedDiff(sessionDetail, updatedSessionData)
					delete updatedSessionDetails.updated_at
					const keys = Object.keys(updatedSessionDetails)
					if (keys.length > 0) {
						isSessionDataChanged = true
					}
				}
				// If new start date is passed update session notification jobs

				if (bodyData.start_date && bodyData.start_date !== Number(sessionDetail.start_date)) {
					isSessionReschedule = true

					const updateDelayData = sessionRelatedJobIds.map((jobId) => ({ id: jobId }))

					// Calculate new delays for notification jobs
					updateDelayData[0].delay = await utils.getTimeDifferenceInMilliseconds(
						bodyData.start_date,
						1,
						'hour'
					)
					updateDelayData[1].delay = await utils.getTimeDifferenceInMilliseconds(
						bodyData.start_date,
						24,
						'hour'
					)
					updateDelayData[2].delay = await utils.getTimeDifferenceInMilliseconds(
						bodyData.start_date,
						15,
						'minutes'
					)

					// Update scheduled notification job delays
					for (let jobIndex = 0; jobIndex < updateDelayData.length; jobIndex++) {
						await schedulerRequest.updateDelayOfScheduledJob(updateDelayData[jobIndex])
					}
				}
				if (bodyData.end_date && bodyData.end_date !== Number(sessionDetail.end_date)) {
					isSessionReschedule = true

					const jobId = common.jobPrefixToMarkSessionAsCompleted + sessionDetail.id
					await schedulerRequest.updateDelayOfScheduledJob({
						id: jobId,
						delay: await utils.getTimeDifferenceInMilliseconds(bodyData.end_date, 0, 'minutes'),
					})
				}
			}

			if (method == common.DELETE_METHOD || isSessionReschedule || isSessionDataChanged) {
				const sessionAttendees = await sessionAttendeesQueries.findAll({
					session_id: sessionId,
				})
				let sessionAttendeesIds = []
				sessionAttendees.forEach((attendee) => {
					sessionAttendeesIds.push(attendee.mentee_id)
				})

				const attendeesAccounts = await userRequests.getUserDetailedList(sessionAttendeesIds)

				sessionAttendees.map((attendee) => {
					for (let index = 0; index < attendeesAccounts.result.length; index++) {
						const element = attendeesAccounts.result[index]
						if (element.id == attendee.mentee_id) {
							attendee.attendeeEmail = element.email
							attendee.attendeeName = element.name
							break
						}
					}
				})

				/* Find email template according to request type */
				let templateData
				let mentorEmailTemplate
				if (method == common.DELETE_METHOD) {
					let sessionDeleteEmailTemplate = process.env.MENTOR_SESSION_DELETE_BY_MANAGER_EMAIL_TEMPLATE
					// commenting this part for 2.6 release products confirmed to use the new delete email template for all.
					// Keeping this logic because if new template for mentor deleting a session is added we can use it.
					// isSessionCreatedByManager
					// 	? (sessionDeleteEmailTemplate = process.env.MENTOR_SESSION_DELETE_BY_MANAGER_EMAIL_TEMPLATE)
					// 	: (sessionDeleteEmailTemplate = process.env.MENTOR_SESSION_DELETE_EMAIL_TEMPLATE)
					templateData = await notificationQueries.findOneEmailTemplate(sessionDeleteEmailTemplate, orgId)
					mentorEmailTemplate = sessionDeleteEmailTemplate
				} else if (isSessionReschedule && !isSessionCreatedByManager) {
					templateData = await notificationQueries.findOneEmailTemplate(
						process.env.MENTOR_SESSION_RESCHEDULE_EMAIL_TEMPLATE,
						orgId
					)
				} else if (isSessionDataChanged && notifyUser) {
					// session is edited by the manager
					// if only title is changed. then a different email has to send to mentor and mentees
					let sessionUpdateByMangerTemplate = process.env.MENTEE_SESSION_EDITED_BY_MANAGER_EMAIL_TEMPLATE
					// This is the template used to send email to session mentees when it is edited
					templateData = await notificationQueries.findOneEmailTemplate(sessionUpdateByMangerTemplate, orgId)
					// This is the email template code we have to use to send email to mentor of a session
					mentorEmailTemplate = process.env.MENTOR_SESSION_EDITED_BY_MANAGER_EMAIL_TEMPLATE
				}

				// send mail associated with action to session mentees
				sessionAttendees.forEach(async (attendee) => {
					if (method == common.DELETE_METHOD) {
						let duration = moment.duration(
							moment.unix(sessionDetail.end_date).diff(moment.unix(sessionDetail.start_date))
						)
						let sessionDuration = duration.asMinutes()
						const payload = {
							type: 'email',
							email: {
								to: attendee.attendeeEmail,
								subject: templateData.subject,
								body: utils.composeEmailBody(templateData.body, {
									name: attendee.attendeeName,
									sessionTitle: sessionDetail.title,
									sessionDuration: Math.round(sessionDuration),
									unitOfTime: common.UNIT_OF_TIME,
									startDate: utils.getTimeZone(
										sessionDetail.start_date,
										common.dateFormat,
										sessionDetail.time_zone
									),
									startTime: utils.getTimeZone(
										sessionDetail.start_date,
										common.timeFormat,
										sessionDetail.time_zone
									),
								}),
							},
						}

						// send email only if notify user is true
						if (notifyUser) await kafkaCommunication.pushEmailToKafka(payload)
					} else if (isSessionReschedule || (isSessionDataChanged && notifyUser)) {
						// Find old duration of session
						let oldDuration = moment.duration(
							moment.unix(sessionDetail.end_date).diff(moment.unix(sessionDetail.start_date))
						)
						let oldSessionDuration = oldDuration.asMinutes()
						// if session is rescheduled find new duration
						let revisedDuration = oldSessionDuration
						if (isSessionReschedule) {
							let duration = moment.duration(
								moment.unix(bodyData.end_date).diff(moment.unix(bodyData.start_date))
							)
							revisedDuration = duration.asMinutes()
						}
						const payload = {
							type: 'email',
							email: {
								to: attendee.attendeeEmail,
								subject: templateData.subject,
								body: utils.composeEmailBody(templateData.body, {
									name: attendee.attendeeName,
									sessionTitle: sessionDetail.title,
									oldStartDate: utils.getTimeZone(
										sessionDetail.start_date,
										common.dateFormat,
										sessionDetail.time_zone
									),
									startDate: utils.getTimeZone(
										sessionDetail.start_date,
										common.dateFormat,
										sessionDetail.time_zone
									),
									oldStartTime: utils.getTimeZone(
										sessionDetail.startDateUtc
											? sessionDetail.startDateUtc
											: sessionDetail.start_date,
										common.timeFormat,
										sessionDetail.time_zone
									),
									startTime: utils.getTimeZone(
										sessionDetail.startDateUtc
											? sessionDetail.startDateUtc
											: sessionDetail.start_date,
										common.timeFormat,
										sessionDetail.time_zone
									),
									oldEndDate: utils.getTimeZone(
										sessionDetail.end_date,
										common.dateFormat,
										sessionDetail.time_zone
									),
									oldEndTime: utils.getTimeZone(
										sessionDetail.end_date,
										common.timeFormat,
										sessionDetail.time_zone
									),
									newStartDate: utils.getTimeZone(
										bodyData['start_date'] ? bodyData['start_date'] : sessionDetail.start_date,
										common.dateFormat,
										sessionDetail.time_zone
									),
									newStartTime: utils.getTimeZone(
										bodyData['start_date'] ? bodyData['start_date'] : sessionDetail.start_date,
										common.timeFormat,
										sessionDetail.time_zone
									),
									newEndDate: utils.getTimeZone(
										bodyData['end_date'] ? bodyData['end_date'] : sessionDetail.end_date,
										common.dateFormat,
										sessionDetail.time_zone
									),
									newEndTime: utils.getTimeZone(
										bodyData['end_date'] ? bodyData['end_date'] : sessionDetail.end_date,
										common.timeFormat,
										sessionDetail.time_zone
									),
									originalSessionTitle: sessionDetail.title,
									unitOfTime: common.UNIT_OF_TIME,
									newSessionDuration: Math.round(revisedDuration),
									sessionDuration: Math.round(oldSessionDuration),
									sessionType: sessionDetail.type,
									sessionPlatform:
										sessionDetail.meeting_info && sessionDetail.meeting_info.platform
											? sessionDetail.meeting_info.platform
											: '',
									newSessionPlatform:
										updatedSessionData.meeting_info && updatedSessionData.meeting_info.platform
											? updatedSessionData.meeting_info.platform
											: sessionDetail.meeting_info.platform,
									newSessionType: updatedSessionData.type
										? updatedSessionData.type
										: sessionDetail.type,
									revisedSessionTitle: updatedSessionData.title
										? updatedSessionData.title
										: sessionDetail.title,
								}),
							},
						}
						if (notifyUser) {
							let kafkaRes = await kafkaCommunication.pushEmailToKafka(payload)
							console.log('Kafka payload:', payload)
							console.log('Session attendee mapped, isSessionReschedule true and kafka res: ', kafkaRes)
						}
					}
				})
				// send mail to mentor if session is created and handled by a manager and if there is any data change
				// send notification only if front end request for user notification
				// notifyUser ---> this key is added for above purpose
				if (
					(method == common.DELETE_METHOD && isSessionCreatedByManager) ||
					(notifyUser && isSessionDataChanged)
				) {
					let response = await this.pushSessionRelatedMentorEmailToKafka(
						mentorEmailTemplate,
						orgId,
						sessionDetail,
						updatedSessionData,
						method
					)
				}
			}

			return responses.successResponse({
				statusCode: httpStatusCode.accepted,
				message: message,
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	/**
	 * Session details.
	 * @method
	 * @name details
	 * @param {String} id 						- Session id.
	 * @param {Number} userId 					- User id.
	 * @param {Boolean} isAMentor 				- user mentor or not.
	 * @returns {JSON} 							- Session details
	 */

	static async details(id, userId = '', isAMentor = '', queryParams, roles, orgId) {
		try {
			let filter = {}
			if (utils.isNumeric(id)) {
				filter.id = id
			} else {
				filter.share_link = id
			}

			const sessionDetails = await sessionQueries.findOne(filter, {
				attributes: {
					exclude: ['share_link', 'mentee_password', 'mentor_password'],
				},
			})
			if (!sessionDetails) {
				return responses.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			let sessionAttendee = await sessionAttendeesQueries.findOne({
				session_id: sessionDetails.id,
				mentee_id: userId,
			})
			if (!sessionAttendee) {
				let validateDefaultRules
				if (userId != sessionDetails.mentor_id) {
					validateDefaultRules = await validateDefaultRulesFilter({
						ruleType: common.DEFAULT_RULES.SESSION_TYPE,
						requesterId: userId,
						roles: roles,
						requesterOrganizationId: orgId,
						data: sessionDetails,
					})
				}
				if (validateDefaultRules?.error && validateDefaultRules?.error?.missingField) {
					return responses.failureResponse({
						message: 'PROFILE_NOT_UPDATED',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}

				if (!validateDefaultRules && userId != sessionDetails.mentor_id) {
					return responses.failureResponse({
						message: 'SESSION_NOT_FOUND',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
			}

			sessionDetails.is_enrolled = false
			let isInvited = false
			if (userId && sessionAttendee) {
				sessionDetails.is_enrolled = true
				sessionDetails.enrolment_type = sessionAttendee.type
				isInvited = sessionAttendee.type === common.INVITED
			}

			// check for accessibility
			if (userId !== '' && isAMentor !== '') {
				let isAccessible = await this.checkIfSessionIsAccessible(sessionDetails, userId, isAMentor)

				// Throw access error
				if (!isAccessible) {
					return responses.failureResponse({
						statusCode: httpStatusCode.not_found,
						message: 'SESSION_RESTRICTED',
					})
				}
			}

			if (userId != sessionDetails.mentor_id && userId != sessionDetails.created_by) {
				delete sessionDetails?.meeting_info?.link
				delete sessionDetails?.meeting_info?.meta
			} else {
				sessionDetails.is_assigned = sessionDetails.mentor_id !== sessionDetails.created_by
			}

			const isMenteesListRequested = queryParams?.get_mentees === 'true'
			const canRetrieveMenteeList = userId === sessionDetails.created_by || userId === sessionDetails.mentor_id

			if (isMenteesListRequested && canRetrieveMenteeList) {
				sessionDetails.mentees = await getEnrolledMentees(id, {}, userId)
			}

			if (sessionDetails.image && sessionDetails.image.some(Boolean)) {
				sessionDetails.image = sessionDetails.image.map(async (imgPath) => {
					if (imgPath != '') {
						return await utils.getDownloadableUrl(imgPath)
					}
				})
				sessionDetails.image = await Promise.all(sessionDetails.image)
			}

			const mentorExtension = await mentorExtensionQueries.getMentorExtension(
				sessionDetails.mentor_id,
				['user_id', 'name', 'designation', 'organization_id', 'custom_entity_text'],
				true
			)

			if (isInvited || sessionDetails.is_assigned) {
				sessionDetails.manager_name = mentorExtension.name
			}

			const orgDetails = await organisationExtensionQueries.findOne(
				{ organization_id: mentorExtension.organization_id },
				{ attributes: ['name'] }
			)

			if (orgDetails && orgDetails.name) {
				sessionDetails.organization = orgDetails.name
			}

			sessionDetails.mentor_name = mentorExtension.name
			sessionDetails.mentor_designation = []

			const defaultOrgId = await getDefaultOrgId()
			if (!defaultOrgId)
				return responses.failureResponse({
					message: 'DEFAULT_ORG_ID_NOT_SET',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})

			if (mentorExtension?.user_id) {
				const mentorExtensionsModelName = await mentorExtensionQueries.getModelName()

				let entityTypes = await entityTypeQueries.findUserEntityTypesAndEntities({
					status: 'ACTIVE',
					organization_id: {
						[Op.in]: [mentorExtension.organization_id, defaultOrgId],
					},
					model_names: { [Op.contains]: [mentorExtensionsModelName] },
				})
				const validationData = removeDefaultOrgEntityTypes(entityTypes, mentorExtension.organization_id)

				const processedEntityType = utils.processDbResponse(
					{
						designation: mentorExtension.designation,
						custom_entity_text: mentorExtension.custom_entity_text,
					},
					validationData
				)
				sessionDetails.mentor_designation = processedEntityType.designation
			}

			const sessionModelName = await sessionQueries.getModelName()
			let entityTypes = await entityTypeQueries.findUserEntityTypesAndEntities({
				status: 'ACTIVE',
				organization_id: {
					[Op.in]: [sessionDetails.mentor_organization_id, defaultOrgId],
				},
				model_names: { [Op.contains]: [sessionModelName] },
			})

			//validationData = utils.removeParentEntityTypes(JSON.parse(JSON.stringify(validationData)))
			const validationData = removeDefaultOrgEntityTypes(entityTypes, sessionDetails.mentor_organization_id)
			const processDbResponse = utils.processDbResponse(sessionDetails, validationData)

			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'SESSION_FETCHED_SUCCESSFULLY',
				result: processDbResponse,
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	/**
	 * @description 							- check if session is accessible based on user's saas policy.
	 * @method
	 * @name checkIfSessionIsAccessible
	 * @param {Number} userId 					- User id.
	 * @param {Array}							- Session data
	 * @param {Boolean} isAMentor 				- user mentor or not.
	 * @returns {JSON} 							- List of filtered sessions
	 */
	static async checkIfSessionIsAccessible(session, userId, isAMentor) {
		try {
			if ((isAMentor && session.mentor_id === userId) || session.created_by == userId) return true

			// Check if session is private and user is not enrolled
			if (session.type === common.SESSION_TYPE.PRIVATE && session.is_enrolled === false) return false

			const userPolicyDetails = isAMentor
				? await mentorExtensionQueries.getMentorExtension(userId, [
						'external_session_visibility',
						'organization_id',
				  ])
				: await menteeExtensionQueries.getMenteeExtension(userId, [
						'external_session_visibility',
						'organization_id',
				  ])

			// Throw error if mentor/mentee extension not found
			if (!userPolicyDetails || Object.keys(userPolicyDetails).length === 0) {
				return responses.failureResponse({
					statusCode: httpStatusCode.not_found,
					message: isAMentor ? 'MENTORS_NOT_FOUND' : 'MENTEE_EXTENSION_NOT_FOUND',
					responseCode: 'CLIENT_ERROR',
				})
			}

			// check the accessibility conditions
			let isAccessible = false
			if (userPolicyDetails.external_session_visibility && userPolicyDetails.organization_id) {
				const { external_session_visibility, organization_id } = userPolicyDetails
				const isEnrolled = session.is_enrolled || false

				switch (external_session_visibility) {
					/**
					 * If {userPolicyDetails.external_session_visibility === CURRENT} user will be able to sessions-
					 *  -created by his/her organization mentors.
					 * So will check if mentor_organization_id equals user's  organization_id
					 */
					case common.CURRENT:
						isAccessible = isEnrolled || session.mentor_organization_id === organization_id
						break
					/**
					 * user external_session_visibility is ASSOCIATED
					 * user can see sessions where session's visible_to_organizations contain user's organization_id and -
					 *  - session's visibility not CURRENT (In case of same organization session has to be
					 * fetched for that we added OR condition {"mentor_organization_id" = ${userPolicyDetails.organization_id}})
					 */
					case common.ASSOCIATED:
						isAccessible =
							isEnrolled ||
							(session.visible_to_organizations.includes(organization_id) &&
								session.visibility != common.CURRENT) ||
							session.mentor_organization_id === organization_id
						break
					/**
					 * user's external_session_visibility === ALL (ASSOCIATED sessions + sessions whose visibility is ALL)
					 */
					case common.ALL:
						isAccessible =
							isEnrolled ||
							(session.visible_to_organizations.includes(organization_id) &&
								session.visibility != common.CURRENT) ||
							session.visibility === common.ALL ||
							session.mentor_organization_id === organization_id
						break
					default:
						break
				}
			}
			return isAccessible
		} catch (err) {
			return err
		}
	}

	/**
	 * Sessions list
	 * @method
	 * @name list
	 * @param {Object} req -request data.
	 * @param {String} req.decodedToken.id - User Id.
	 * @param {String} req.pageNo - Page No.
	 * @param {String} req.pageSize - Page size limit.
	 * @param {String} req.searchText - Search text.
	 * @param {Boolean} isAMentor - Is a mentor.
	 * @returns {JSON} - Session List.
	 */

	static async list(loggedInUserId, page, limit, search, searchOn, queryParams, isAMentor, roles, orgId) {
		try {
			let allSessions = await menteeService.getAllSessions(
				page,
				limit,
				search,
				loggedInUserId,
				queryParams,
				isAMentor,
				searchOn,
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
			// add index number to the response
			allSessions.rows = allSessions.rows.map((data, index) => ({
				...data,
				index_number: index + 1 + limit * (page - 1), //To keep consistency with pagination
			}))

			const result = {
				data: allSessions.rows,
				count: allSessions.count,
			}

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_FETCHED_SUCCESSFULLY',
				result,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Enroll Session.
	 * @method
	 * @name enroll
	 * @param {String} sessionId 			- Session id.
	 * @param {Object} userTokenData
	 * @param {String} userTokenData.id 	- user id.
	 * @param {String} timeZone 			- timezone.
	 * @param {Boolean} isSelfEnrolled 		- true/false.
	 * @param {Object} session 				- session details.
	 * @param {Boolean} isAMentor 			- user is mentor or not.
	 * @returns {JSON} 						- Enroll session.
	 */

	static async enroll(
		sessionId,
		userTokenData,
		timeZone,
		isAMentor,
		isSelfEnrolled = true,
		session = {},
		roles,
		orgId
	) {
		try {
			let email
			let name
			let userId
			let enrollmentType
			let emailTemplateCode = process.env.MENTEE_SESSION_ENROLLMENT_EMAIL_TEMPLATE
			// If enrolled by the mentee get email and name from user service via api call.
			// Else it will be available in userTokenData
			if (isSelfEnrolled) {
				const userDetails = await mentorExtensionQueries.getMentorExtension(
					userTokenData.id,
					['user_id', 'name', 'email'],
					true
				)

				userId = userDetails.user_id
				email = userDetails.email
				name = userDetails.name
				enrollmentType = common.ENROLLED
			} else {
				userId = userTokenData.id
				email = userTokenData.email
				name = userTokenData.name
				emailTemplateCode = process.env.MENTEE_SESSION_ENROLLMENT_BY_MANAGER_EMAIL_TEMPLATE // update with new template
				enrollmentType = common.INVITED
			}
			// search for session only if session data not passed
			if (!session || Object.keys(session).length === 0) {
				session = await sessionQueries.findById(sessionId)
			}
			if (!session) {
				return responses.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			let validateDefaultRules
			if (isSelfEnrolled) {
				validateDefaultRules = await validateDefaultRulesFilter({
					ruleType: common.DEFAULT_RULES.SESSION_TYPE,
					requesterId: userId,
					roles: roles,
					requesterOrganizationId: orgId,
					data: session,
				})
			}
			if (validateDefaultRules?.error && validateDefaultRules?.error?.missingField) {
				return responses.failureResponse({
					message: 'PROFILE_NOT_UPDATED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (!validateDefaultRules && isSelfEnrolled) {
				return responses.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			// Restrict self enrollment to a private session
			if (isSelfEnrolled && session.type == common.SESSION_TYPE.PRIVATE && userId !== session.created_by) {
				return responses.failureResponse({
					message: 'INVALID_PERMISSION',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			// check if the session is accessible to the user
			let isAccessible = await this.checkIfSessionIsAccessible(session, userId, isAMentor)

			if (!isAccessible) {
				return responses.failureResponse({
					message: 'INVALID_PERMISSION',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			const sessionAttendeeExist = await sessionAttendeesQueries.findOne({
				session_id: sessionId,
				mentee_id: userId,
			})

			if (sessionAttendeeExist) {
				return responses.failureResponse({
					message: 'USER_ALREADY_ENROLLED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (session.seats_remaining <= 0 && session.created_by != userId) {
				return responses.failureResponse({
					message: 'SESSION_SEAT_FULL',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const attendee = {
				session_id: sessionId,
				mentee_id: userId,
				time_zone: timeZone,
				type: enrollmentType,
			}

			await sessionAttendeesQueries.create(attendee)
			await sessionEnrollmentQueries.create(_.omit(attendee, 'time_zone'))

			if (session.created_by !== userId) {
				await sessionQueries.updateEnrollmentCount(sessionId, false)
			}

			const templateData = await notificationQueries.findOneEmailTemplate(
				emailTemplateCode,
				session.mentor_organization_id
			)
			let duration = moment.duration(moment.unix(session.end_date).diff(moment.unix(session.start_date)))
			let elapsedMinutes = duration.asMinutes()

			if (templateData) {
				// Push successful enrollment to session in kafka
				const payload = {
					type: 'email',
					email: {
						to: email,
						subject: templateData.subject,
						body: utils.composeEmailBody(templateData.body, {
							name,
							sessionTitle: session.title,
							mentorName: session.mentor_name,
							startDate: utils.getTimeZone(session.start_date, common.dateFormat, session.time_zone),
							startTime: utils.getTimeZone(session.start_date, common.timeFormat, session.time_zone),
							sessionDuration: Math.round(elapsedMinutes),
							sessionPlatform: session.meeting_info.platform,
							unitOfTime: common.UNIT_OF_TIME,
						}),
					},
				}
				await kafkaCommunication.pushEmailToKafka(payload)
			}

			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'USER_ENROLLED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * UnEnroll Session.
	 * @method
	 * @name enroll
	 * @param {String} sessionId 				- Session id.
	 * @param {Object} userTokenData
	 * @param {String} userTokenData._id 		- user id.
	 * @param {Boolean} isSelfEnrolled 			- true/false.
	 * @param {Boolean} session 				- session details.
	 * @returns {JSON} 							- UnEnroll session.
	 */

	static async unEnroll(sessionId, userTokenData, isSelfUnenrollment = true, session = {}) {
		try {
			let email
			let name
			let userId
			let emailTemplateCode = process.env.MENTEE_SESSION_CANCELLATION_EMAIL_TEMPLATE
			// If mentee request unenroll get email and name from user service via api call.
			// Else it will be available in userTokenData
			if (isSelfUnenrollment) {
				const userDetails = await mentorExtensionQueries.getMentorExtension(
					userTokenData.id,
					['user_id', 'name', 'email'],
					true
				)

				userId = userDetails.user_id
				email = userDetails.email
				name = userDetails.name
			} else {
				userId = userTokenData.id
				email = userTokenData.email
				name = userTokenData.name
				emailTemplateCode = process.env.MENTOR_SESSION_DELETE_BY_MANAGER_EMAIL_TEMPLATE // update with new template
			}
			if (!session || Object.keys(session).length === 0) {
				session = await sessionQueries.findById(sessionId)
			}

			if (!session) {
				return responses.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const mentorDetails = await mentorExtensionQueries.getMentorExtension(session.mentor_id, ['name'], true)

			session.mentor_name = mentorDetails.name

			const deletedRows = await sessionAttendeesQueries.unEnrollFromSession(sessionId, userId)
			if (deletedRows === 0) {
				return responses.failureResponse({
					message: 'USER_NOT_ENROLLED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			await sessionEnrollmentQueries.unEnrollFromSession(sessionId, userId)

			if (session.created_by !== userId) {
				await sessionQueries.updateEnrollmentCount(sessionId)
			}

			const templateData = await notificationQueries.findOneEmailTemplate(
				emailTemplateCode,
				session.mentor_organization_id
			)

			if (templateData) {
				let duration = moment.duration(moment.unix(session.end_date).diff(moment.unix(session.start_date)))
				let sessionDuration = duration.asMinutes()
				// Push successful unenrollment to session in kafka
				const payload = {
					type: 'email',
					email: {
						to: email,
						subject: templateData.subject,
						body: utils.composeEmailBody(templateData.body, {
							name,
							sessionTitle: session.title,
							mentorName: session.mentor_name,
							unitOfTime: common.UNIT_OF_TIME,
							startDate: utils.getTimeZone(session.start_date, common.dateFormat, session.time_zone),
							startTime: utils.getTimeZone(session.start_date, common.timeFormat, session.time_zone),
							sessionDuration: Math.round(sessionDuration),
						}),
					},
				}
				await kafkaCommunication.pushEmailToKafka(payload)
			}

			return responses.successResponse({
				statusCode: httpStatusCode.accepted,
				message: 'USER_UNENROLLED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Verify whether user is a mentor
	 * @method
	 * @name verifyMentor
	 * @param {String} id - user id.
	 * @returns {Boolean} - true/false.
	 */

	static async verifyMentor(id) {
		return new Promise((resolve, reject) => {
			try {
				let options = {
					headers: {
						'Content-Type': 'application/json',
						internal_access_token: process.env.INTERNAL_ACCESS_TOKEN,
					},
				}

				let apiUrl = apiBaseUrl + apiEndpoints.VERIFY_MENTOR + '?userId=' + id
				try {
					request.post(apiUrl, options, (err, data) => {
						if (err) {
							return reject({
								message: 'USER_SERVICE_DOWN',
							})
						} else {
							data.body = JSON.parse(data.body)
							if (data.body.result && data.body.result.isAMentor) {
								return resolve(true)
							} else {
								return resolve(false)
							}
						}
					})
				} catch (error) {
					reject(error)
				}
			} catch (error) {
				reject(error)
			}
		})
	}

	/**
	 * Share a session.
	 * @method
	 * @name share
	 * @param {String} sessionId - session id.
	 * @returns {JSON} - Session share link.
	 */

	static async share(sessionId) {
		try {
			const session = await sessionQueries.findById(sessionId)
			if (!session) {
				return responses.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			let shareLink = session.share_link
			if (!shareLink) {
				shareLink = utils.md5Hash(sessionId + '###' + session.mentor_id)
				await sessionQueries.updateOne(
					{
						id: sessionId,
					},
					{ share_link: shareLink }
				)
			}
			return responses.successResponse({
				message: 'SESSION_LINK_GENERATED_SUCCESSFULLY',
				statusCode: httpStatusCode.ok,
				result: {
					shareLink,
				},
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * List of upcoming sessions.
	 * @method
	 * @name upcomingPublishedSessions
	 * @param {Number} page - page no.
	 * @param {Number} limit - page limit.
	 * @param {String} search - search text.
	 * @returns {JSON} - List of upcoming sessions.
	 */

	static async upcomingPublishedSessions(page, limit, search) {
		try {
			const publishedSessions = await sessionData.searchAndPagination(page, limit, search)
			return publishedSessions
		} catch (error) {
			return error
		}
	}

	/**
	 * Start session.
	 * @method
	 * @name start
	 * @param {String} sessionId - session id.
	 * @param {String} token - token information.
	 * @returns {JSON} - start session link
	 */

	static async start(sessionId, userTokenData) {
		const loggedInUserId = userTokenData.id
		const mentorName = userTokenData.name
		try {
			const mentor = await mentorExtensionQueries.getMentorExtension(loggedInUserId)
			if (!mentor) {
				return responses.failureResponse({
					message: 'NOT_A_MENTOR',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const session = await sessionQueries.findById(sessionId)
			if (!session) {
				return resolve(
					responses.failureResponse({
						message: 'SESSION_NOT_FOUND',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				)
			}

			if (session.mentor_id !== mentor.user_id) {
				return responses.failureResponse({
					message: 'CANNOT_START_OTHER_MENTOR_SESSION',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (process.env.DEFAULT_MEETING_SERVICE == 'OFF' && !session?.meeting_info?.link) {
				return responses.failureResponse({
					message: 'MEETING_SERVICE_INFO_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			let meetingInfo
			if (session?.meeting_info?.value !== common.BBB_VALUE && !session.started_at) {
				await sessionQueries.updateOne(
					{
						id: sessionId,
					},
					{
						status: common.LIVE_STATUS,
						started_at: utils.utcFormat(),
					}
				)
			}
			if (session?.meeting_info?.link) {
				meetingInfo = session.meeting_info
			} else {
				let currentDate = moment().utc().format(common.UTC_DATE_TIME_FORMAT)

				const formattedStartDate = moment.unix(session.start_date).format(common.UTC_DATE_TIME_FORMAT)

				const formattedEndDate = moment.unix(session.end_date).format(common.UTC_DATE_TIME_FORMAT)

				let elapsedMinutes = moment(formattedStartDate).diff(currentDate, 'minutes')

				if (elapsedMinutes > 10) {
					return responses.failureResponse({
						message: 'SESSION_ESTIMATED_TIME',
						statusCode: httpStatusCode.bad_request,
						responseCode: 'CLIENT_ERROR',
					})
				}
				let sessionDuration = moment(formattedEndDate).diff(formattedStartDate, 'minutes')

				const meetingDetails = await bigBlueButtonRequests.createMeeting(
					session.id,
					session.title,
					session.mentee_password,
					session.mentor_password,
					sessionDuration
				)
				if (!meetingDetails.success) {
					return responses.failureResponse({
						message: 'MEETING_NOT_CREATED',
						statusCode: httpStatusCode.internal_server_error,
						responseCode: 'SERVER_ERROR',
					})
				}

				const moderatorMeetingLink = await bigBlueButtonService.joinMeetingAsModerator(
					session.id,
					mentorName,
					session.mentor_password
				)
				meetingInfo = {
					platform: common.BBB_PLATFORM,
					value: common.BBB_VALUE,
					link: moderatorMeetingLink,
					meta: {
						meeting_id: meetingDetails.data.response.internalMeetingID,
					},
				}

				await sessionQueries.updateOne(
					{
						id: sessionId,
					},
					{
						status: common.LIVE_STATUS,
						started_at: utils.utcFormat(),
						meeting_info: meetingInfo,
					}
				)
			}

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_START_LINK',
				result: meetingInfo,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Set mentor password in session collection..
	 * @method
	 * @name setMentorPassword
	 * @param {String} sessionId - session id.
	 * @param {String} userId - user id.
	 * @returns {JSON} - updated session data.
	 */

	static async setMentorPassword(sessionId, userId) {
		try {
			let hashPassword = utils.hash('' + sessionId + userId + '')
			const result = await sessionQueries.updateOne(
				{
					id: sessionId,
				},
				{
					mentor_password: hashPassword,
				}
			)

			return result
		} catch (error) {
			return error
		}
	}

	/**
	 * Set mentee password in session collection.
	 * @method
	 * @name setMenteePassword
	 * @param {String} sessionId - session id.
	 * @param {String} userId - user id.
	 * @returns {JSON} - update session data.
	 */

	static async setMenteePassword(sessionId, createdAt) {
		try {
			let hashPassword = utils.hash(sessionId + createdAt)
			const result = await sessionQueries.updateOne(
				{
					id: sessionId,
				},
				{
					mentee_password: hashPassword,
				}
			)

			return result
		} catch (error) {
			return error
		}
	}

	/**
	 * Update session collection status to completed.
	 * @method
	 * @name completed
	 * @param {String} sessionId - session id.
	 * @returns {JSON} - updated session data.
	 */

	static async completed(sessionId, isBBB) {
		try {
			const sessionDetails = await sessionQueries.findOne({
				id: sessionId,
			})
			if (!sessionDetails) {
				return responses.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			if (sessionDetails.meeting_info.value == common.BBB_VALUE && sessionDetails.started_at != null && !isBBB) {
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					result: [],
				})
			}

			await sessionQueries.updateOne(
				{
					id: sessionId,
				},
				{
					status: common.COMPLETED_STATUS,
					completed_at: utils.utcFormat(),
				},
				{ returning: false, raw: true }
			)

			if (sessionDetails.meeting_info.value == common.BBB_VALUE && isBBB) {
				const recordingInfo = await bigBlueButtonRequests.getRecordings(sessionId)

				if (recordingInfo?.data?.response) {
					const { recordings } = recordingInfo.data.response

					// Update recording info in post_session_table
					await postSessionQueries.create({
						session_id: sessionId,
						recording_url: recordings.recording.playback.format.url,
						recording: recordings,
					})
				}
			}

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				result: [],
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Get recording details.
	 * @method
	 * @name getRecording
	 * @param {String} sessionId - session id.
	 * @returns {JSON} - Recording details.
	 */

	static async getRecording(sessionId) {
		try {
			const session = await sessionQueries.findById(sessionId)
			if (!session) {
				return responses.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const recordingInfo = await bigBlueButtonRequests.getRecordings(sessionId)

			// let response = await requestUtil.get("https://dev.mentoring.shikshalokam.org/playback/presentation/2.3/6af6737c986d83e8d5ce2ff77af1171e397c739e-1638254682349");
			// console.log(response);

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				result: recordingInfo.data.response.recordings,
			})
		} catch (error) {
			return error
		}
	}

	/**
	 * Get recording details.
	 * @method
	 * @name updateRecordingUrl
	 * @param {String} internalMeetingID - Internal Meeting ID
	 * @returns {JSON} - Recording link updated.
	 */

	static async updateRecordingUrl(internalMeetingId, recordingUrl) {
		try {
			const sessionDetails = await sessionQueries.findOne({
				'meeting_info.meta.meeting_id': internalMeetingId,
			})

			if (!sessionDetails) {
				return responses.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const rowsAffected = await postSessionQueries.updateOne(
				{
					session_id: sessionDetails.id,
				},
				{
					recording_url: recordingUrl,
				}
			)

			if (rowsAffected === 0) {
				return responses.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_UPDATED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}
	/**
	 * Verify if time slot is available for the mentor
	 * @method
	 * @name isTimeSlotAvailable
	 * @param {String} id - user id.
	 * @param {String} startDate - start date in utc.
	 * @param {String} endDate - end date in utc.
	 * @returns {String} - STAR_AND_END_DATE_OVERLAP/START_DATE_OVERLAP/END_DATE_OVERLAP.
	 */

	static async isTimeSlotAvailable(id, startDate, endDate, sessionId) {
		try {
			const sessions = await sessionQueries.getSessionByUserIdAndTime(id, startDate, endDate, sessionId)
			if (
				!sessions ||
				(sessions.startDateResponse.length < process.env.SESSION_CREATION_MENTOR_LIMIT &&
					sessions.endDateResponse.length < process.env.SESSION_CREATION_MENTOR_LIMIT)
			) {
				return true
			}

			const startDateResponse = sessions.startDateResponse?.[0]
			const endDateResponse = sessions.endDateResponse?.[0]

			if (startDateResponse && endDateResponse && startDateResponse.id !== endDateResponse.id) {
				return {
					isTimeSlotAvailable: false,
					sessionName: `${startDateResponse.title} and ${endDateResponse.title}`,
				}
			}

			if (startDateResponse || endDateResponse) {
				return {
					isTimeSlotAvailable: false,
					sessionName: (startDateResponse || endDateResponse).title,
				}
			}

			return true
		} catch (error) {
			return error
		}
	}

	/**
	 * Downloads a list of sessions created by a user in CSV format based on query parameters.
	 * @method
	 * @name downloadList
	 * @param {string} userId - User ID of the creator.
	 * @param {Object} queryParams - Query parameters for filtering sessions.
	 * @param {string} timezone - Time zone for date and time formatting.
	 * @param {string} searchText - Text to search for in session titles.
	 * @returns {Promise<Object>} - A promise that resolves to a response object containing
	 *                             a CSV stream of the session list for download.
	 * @throws {Error} - Throws an error if there's an issue during processing.
	 */

	static async downloadList(userId, queryParams, timezone, searchText) {
		try {
			const filter = {
				created_by: userId,
				...(queryParams.status && { status: queryParams.status.split(',') }),
				...(queryParams.type && { type: queryParams.type.split(',') }),
				...(searchText && {
					[Op.or]: [
						{ title: { [Op.iLike]: `%${searchText}%` } },
						{ mentor_name: { [Op.iLike]: `%${searchText}%` } },
					],
				}),
			}
			const sortBy = queryParams.sort_by || 'created_at'
			const order = queryParams.order || 'DESC'

			let sessions = await sessionQueries.findAll(filter, {
				order: [[sortBy, order]],
			})

			const CSVFields = [
				{ label: 'No.', value: 'index_number' },
				{ label: 'Session Name', value: 'title' },
				{ label: 'Type', value: 'type' },
				{ label: 'Mentors', value: 'mentor_name' },
				{ label: 'Date', value: 'start_date' },
				{ label: 'Time', value: 'start_time' },
				{ label: 'Duration (Min)', value: 'duration_in_minutes' },
				{ label: 'Mentee Count', value: 'mentee_count' },
				{ label: 'Status', value: 'status' },
			]

			//Return an empty CSV if sessions list is empty
			if (sessions.length == 0) {
				const parser = new Parser({
					fields: ['No Data Found'],
					header: true,
					includeEmptyRows: true,
					defaultValue: null,
				})
				const csv = parser.parse()
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					isResponseAStream: true,
					stream: csv,
					fileName: 'session_list' + moment() + '.csv',
				})
			}

			sessions = await this.populateSessionDetails({
				sessions: sessions,
				timezone: timezone,
				transformEntities: true,
			})

			const parser = new Parser({ fields: CSVFields, header: true, includeEmptyRows: true, defaultValue: null })
			const csv = parser.parse(sessions)

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				isResponseAStream: true,
				stream: csv,
				fileName: 'session_list' + moment() + '.csv',
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	/**
	 * Transform session data from epoch format to date time format with duration.
	 *
	 * @static
	 * @method
	 * @name transformSessionDate
	 * @param {Object} session - Sequelize response for a mentoring session.
	 * @param {string} [timezone='Asia/Kolkata'] - Time zone for date and time formatting.
	 * @returns {Object} - Transformed session data.
	 * @throws {Error} - Throws an error if any issues occur during transformation.
	 */
	static async transformSessionDate(session, timezone = 'Asia/Kolkata') {
		try {
			const transformDate = (epochTimestamp) => {
				const date = moment.unix(epochTimestamp) // Use moment.unix() to handle Unix timestamps
				const formattedDate = date.clone().tz(timezone).format('DD-MMM-YYYY')
				const formattedTime = date.clone().tz(timezone).format('hh:mm A')
				return { formattedDate, formattedTime }
			}

			const transformDuration = (startEpoch, endEpoch) => {
				const startDate = moment.unix(startEpoch)
				const endDate = moment.unix(endEpoch)
				const duration = moment.duration(endDate.diff(startDate))
				return duration.asMinutes()
			}

			const startDate = session.start_date
			const endDate = session.end_date

			const { formattedDate: startDateFormatted, formattedTime: startTimeFormatted } = transformDate(startDate)

			const durationInMinutes = transformDuration(startDate, endDate)

			return {
				start_date: startDateFormatted,
				start_time: startTimeFormatted,
				duration_in_minutes: durationInMinutes,
			}
		} catch (error) {
			throw error
		}
	}
	/**
	 * Populates session details with additional information such as start_date,
	 * start_time, duration_in_minutes, mentee_count, and index_number.
	 * @method
	 * @name populateSessionDetails
	 * @param {Object[]} sessions - Array of session objects.
	 * @param {string} timezone - Time zone for date and time formatting.
	 * @param {number} [page] - Page number for pagination.
	 * @param {number} [limit] - Limit of sessions per page for pagination.
	 * @param {boolean} [transformEntities=false] - Flag to indicate whether to transform entity types.
	 * @param {boolean} sendEpochTime - Flag to indicate whether to pass start_date as epoch.
	 * @returns {Promise<Array>} - Array of session objects with populated details.
	 * @throws {Error} - Throws an error if there's an issue during processing.
	 */
	static async populateSessionDetails(
		{ sessions, timezone, page, limit, transformEntities = false },
		sendEpochTime = false
	) {
		try {
			const uniqueOrgIds = [...new Set(sessions.map((obj) => obj.mentor_organization_id))]
			sessions = await entityTypeService.processEntityTypesToAddValueLabels(
				sessions,
				uniqueOrgIds,
				common.sessionModelName,
				'mentor_organization_id'
			)

			await Promise.all(
				sessions.map(async (session, index) => {
					if (transformEntities) {
						if (session.status) session.status = session.status.label
						if (session.type) session.type = session.type.label
					}
					const res = await this.transformSessionDate(session, timezone)
					const menteeCount = session.seats_limit - session.seats_remaining
					let indexNumber

					indexNumber = index + 1 + (page && limit ? limit * (page - 1) : 0)

					Object.assign(session, {
						// Check if sendEpochTimeAndMeetingInfo is false before adding start_date
						...(sendEpochTime
							? {}
							: {
									start_date: res.start_date,
							  }),
						start_time: res.start_time,
						duration_in_minutes: res.duration_in_minutes,
						mentee_count: menteeCount,
						index_number: indexNumber,
					})
				})
			)
			return sessions
		} catch (error) {
			throw error
		}
	}

	/**
	 * Retrieves and formats sessions created by a user based on query parameters.
	 * @method
	 * @name createdSessions
	 * @param {string} userId - User ID of the creator.
	 * @param {Object} queryParams - Query parameters for filtering and sorting sessions.
	 * @param {string} timezone - Time zone for date and time formatting.
	 * @param {number} page - Page number for pagination.
	 * @param {number} limit - Limit of sessions per page for pagination.
	 * @param {string} searchText - Text to search for in session titles or mentor names.
	 * @returns {Promise<Object>} - A promise that resolves to a response object containing
	 *                             the formatted list of created sessions and count.
	 * @throws {Error} - Throws an error if there's an issue during processing.
	 */

	static async createdSessions(userId, queryParams, timezone, page, limit, searchText) {
		try {
			const filter = {
				created_by: userId,
				...(queryParams.status && { status: queryParams.status.split(',') }),
				...(queryParams.type && { type: queryParams.type.split(',') }),
				...(searchText && {
					[Op.or]: [
						{ title: { [Op.iLike]: `%${searchText}%` } },
						{ mentor_name: { [Op.iLike]: `%${searchText}%` } },
					],
				}),
			}
			const sortBy = queryParams.sort_by || 'created_at'
			const order = queryParams.order || 'DESC'
			const attributes = { exclude: ['mentee_password', 'mentor_password'] }
			let sessions = await sessionQueries.findAndCountAll(
				filter,
				{
					order: [[sortBy, order]],
					offset: limit * (page - 1),
					limit: limit,
				},
				{ attributes: attributes }
			)
			if (sessions.rows.length == 0) {
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'LIST_FETCHED',
					result: { data: [], count: 0 },
				})
			}

			sessions.rows = await this.populateSessionDetails(
				{
					sessions: sessions.rows,
					timezone: timezone,
					page: page,
					limit: limit,
				},
				true
			)

			const formattedSessionList = sessions.rows.map((session, index) => ({
				id: session.id,
				index_number: index + 1 + limit * (page - 1), //To keep consistency with pagination
				title: session.title,
				type: session.type,
				mentor_name: session.mentor_name,
				start_date: session.start_date,
				end_date: session.end_date,
				duration_in_minutes: session.duration_in_minutes,
				status: session.status,
				mentee_count: session.mentee_count,
				mentor_organization_id: session.mentor_organization_id,
				mentor_id: session.mentor_id,
			}))

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_LIST_FETCHED',
				result: { data: formattedSessionList, count: sessions.count },
			})
		} catch (error) {
			throw error
		}
	}
	/**
	 * Bulk update mentor names for sessions.
	 * @method
	 * @name bulkUpdateMentorNames
	 * @param {Array} mentorIds - Array of mentor IDs to update.
	 * @param {STRING} mentorsName - Mentor name that needs to be updated.
	 * @returns {Object} - Success response indicating the update was performed successfully.
	 * @throws {Error} - Throws an error if there's an issue during the bulk update.
	 */
	static async bulkUpdateMentorNames(mentorIds, mentorsName) {
		try {
			mentorIds = mentorIds.map(String)
			await sessionQueries.updateSession(
				{
					mentor_id: mentorIds,
				},
				{
					mentor_name: mentorsName,
				}
			)

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_UPDATED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Get details of mentees enrolled in a session, including their extension details.
	 *
	 * @static
	 * @async
	 * @method
	 * @name enrolledMentees
	 * @param {string} sessionId - ID of the session.
	 * @param {Object} queryParams - Query parameters.
	 * @param {string} userID - ID of the user making the request.
	 * @returns {Promise<Object>} - A promise that resolves with the success response containing details of enrolled mentees.
	 * @throws {Error} - Throws an error if there's an issue during data retrieval.
	 */
	static async enrolledMentees(sessionId, queryParams, userID) {
		try {
			const session = await sessionQueries.findOne({
				id: sessionId,
				[Op.or]: [{ mentor_id: userID }, { created_by: userID }],
			})
			if (!session) {
				return responses.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			const enrolledMentees = await getEnrolledMentees(sessionId, queryParams, userID)

			if (queryParams?.csv === 'true') {
				const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss')
				const fileName = `mentee_list_${sessionId}_${timestamp}.csv`
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					isResponseAStream: true,
					stream: enrolledMentees,
					fileName: fileName,
				})
			}

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_ATTENDEES',
				result: enrolledMentees,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Add mentees to session.
	 * @method
	 * @name addMentees
	 * @param {String} sessionId 				- Session id.
	 * @param {Number} menteeIds				- Mentees id.
	 * @returns {JSON} 							- Session details
	 */

	static async addMentees(sessionId, menteeIds, timeZone) {
		try {
			// check if session exists or not
			const sessionDetails = await sessionQueries.findOne({ id: sessionId })
			if (!sessionDetails || Object.keys(sessionDetails).length === 0) {
				return responses.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			// Get mentee name and email from user service
			const menteeAccounts = await userRequests.getListOfUserDetails(menteeIds, true)
			if (!menteeAccounts.result || !menteeAccounts.result.length > 0) {
				return responses.failureResponse({
					message: 'USER_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			const menteeDetails = menteeAccounts.result.map((element) => ({
				id: element.id,
				email: element.email,
				name: element.name,
				roles: element.user_roles,
			}))

			// Enroll mentees to the given session
			const failedIds = []
			const successIds = []

			const enrollPromises = menteeDetails.map((menteeData) => {
				let isAMentor = utils.isAMentor(menteeData.roles)
				return this.enroll(sessionId, menteeData, timeZone, isAMentor, false, sessionDetails)
					.then((response) => {
						if (response.statusCode == httpStatusCode.created) {
							// Enrolled successfully
							successIds.push(menteeData.id)
						} else {
							// Enrollment failed
							failedIds.push(menteeData.id)
						}
					})
					.catch((error) => {
						// mentee enroll error
						failedIds.push(menteeData.id)
					})
			})

			// Wait for all promises to settle
			await Promise.all(enrollPromises)

			if (failedIds.length > 0) {
				return responses.failureResponse({
					message: 'FAILED_TO_ADD_MENTEES',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'MENTEES_ARE_ADDED_SUCCESSFULLY',
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	/**
	 * pushSessionRelatedMentorEmailToKafka.
	 * @method
	 * @name addMentees
	 * @param {String} templateCode 				- email template code.
	 * @param {String} orgId 						- orgIde.
	 * @param {Object} sessionDetail 				- session details.
	 * @param {Object} updatedSessionDetails 		- updated session details.
	 * @returns {JSON} 								- Kafka push response
	 */
	static async pushSessionRelatedMentorEmailToKafka(templateCode, orgId, sessionDetail, updatedSessionDetails) {
		try {
			const userDetails = await mentorExtensionQueries.getMentorExtension(
				sessionDetail.mentor_id,
				['name', 'email'],
				true
			)

			// Fetch email template
			let durationStartDate = updatedSessionDetails.start_date
				? updatedSessionDetails.start_date
				: sessionDetail.start_date
			let durationEndDate = updatedSessionDetails.end_date
				? updatedSessionDetails.end_date
				: sessionDetail.end_date
			let duration = moment.duration(moment.unix(durationEndDate).diff(moment.unix(durationStartDate)))
			let sessionDuration = duration.asMinutes()
			let oldSessionDuration
			if (!updatedSessionDetails.start_date) {
				let duration = moment.duration(
					moment.unix(sessionDetail.end_date).diff(moment.unix(sessionDetail.start_date))
				)
				oldSessionDuration = duration.asMinutes()
			}
			const templateData = await notificationQueries.findOneEmailTemplate(templateCode, orgId)

			// Construct data
			const payload = {
				type: 'email',
				email: {
					to: userDetails.email,
					subject: templateData.subject,
					body: utils.composeEmailBody(templateData.body, {
						name: userDetails.name,
						sessionTitle: updatedSessionDetails.title ? updatedSessionDetails.title : sessionDetail.title,
						sessionDuration: oldSessionDuration
							? Math.round(oldSessionDuration)
							: Math.round(sessionDuration),
						unitOfTime: common.UNIT_OF_TIME,
						startDate: utils.getTimeZone(
							sessionDetail.start_date,
							common.dateFormat,
							sessionDetail.time_zone
						),
						startTime: utils.getTimeZone(
							sessionDetail.start_date,
							common.timeFormat,
							sessionDetail.time_zone
						),
						newStartDate: utils.getTimeZone(
							updatedSessionDetails['start_date']
								? updatedSessionDetails['start_date']
								: sessionDetail.start_date,
							common.dateFormat,
							sessionDetail.time_zone
						),
						newStartTime: utils.getTimeZone(
							updatedSessionDetails['start_date']
								? updatedSessionDetails['start_date']
								: sessionDetail.start_date,
							common.timeFormat,
							sessionDetail.time_zone
						),
						newSessionDuration: Math.round(sessionDuration),
						sessionPlatform: sessionDetail.meeting_info.platform,
						originalSessionTitle: sessionDetail.title,
						revisedSessionTitle: updatedSessionDetails.title
							? updatedSessionDetails.title
							: sessionDetail.title,
						sessionType: sessionDetail.type,
						newSessionPlatform:
							updatedSessionDetails.meeting_info && updatedSessionDetails.meeting_info.platform
								? updatedSessionDetails.meeting_info.platform
								: sessionDetail.meeting_info.platform,
						newSessionType: updatedSessionDetails.type ? updatedSessionDetails.type : sessionDetail.type,
					}),
				},
			}
			// Push to Kafka
			const kafkaResponse = await kafkaCommunication.pushEmailToKafka(payload)
			return kafkaResponse
		} catch (error) {
			console.log(error)
			throw error
		}
	}
	/**
	 * Remove mentees from session.
	 * @method
	 * @name removeMentees
	 * @param {String} sessionId 				- Session id.
	 * @param {Number} menteeIds				- Mentees id.
	 * @returns {JSON} 							- unenroll status
	 */

	static async removeMentees(sessionId, menteeIds) {
		try {
			// check if session exists or not
			const sessionDetails = await sessionQueries.findOne({ id: sessionId })

			if (!sessionDetails || Object.keys(sessionDetails).length === 0) {
				return responses.failureResponse({
					message: 'SESSION_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			// Get mentee name and email from user service
			const menteeAccounts = await userRequests.getUserDetailedList(menteeIds)

			if (!menteeAccounts.result || !menteeAccounts.result.length > 0) {
				return responses.failureResponse({
					message: 'USER_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			const menteeDetails = menteeAccounts.result.map((element) => ({
				id: element.id,
				email: element.email,
				name: element.name,
			}))

			// Uneroll mentees from the given session
			const failedIds = []
			const successIds = []

			const enrollPromises = menteeDetails.map((menteeData) => {
				return this.unEnroll(sessionId, menteeData, false, sessionDetails)
					.then((response) => {
						if (response.statusCode == httpStatusCode.accepted) {
							// Unerolled successfully
							successIds.push(menteeData.id)
						} else {
							// Unenrollment failed
							failedIds.push(menteeData.id)
						}
					})
					.catch((error) => {
						// mentee Unenroll error
						failedIds.push(menteeData.id)
					})
			})

			// Wait for all promises to settle
			await Promise.all(enrollPromises)

			if (failedIds.length > 0) {
				return responses.failureResponse({
					message: 'FAILED_TO_UNENROLL_MENTEES',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'USER_UNENROLLED_SUCCESSFULLY',
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	/**
	 * This function used to find menteeIds to enroll and unEnroll based on the arrays passed
	 * @method
	 * @name filterMenteesToAddAndRemove
	 * @param {Array} existingMentees 				- mentee_ids enrolled to a session.
	 * @param {Array} updatedMentees				- latest mentee ids to update
	 * @returns {Object} 							- mentees to enroll and unenroll
	 */

	static async filterMenteesToAddAndRemove(existingMentees, updatedMentees) {
		// Find the intersection
		const intersection = _.intersection(existingMentees, updatedMentees)

		// Find mentees to remove (unenroll)
		const menteesToRemove = _.difference(existingMentees, intersection)

		// Find mentees to add (enroll)
		const menteesToAdd = _.difference(updatedMentees, intersection)

		return {
			menteesToRemove,
			menteesToAdd,
		}
	}

	/**
	 * Bulk create users
	 * @method
	 * @name bulkUserCreate
	 * @param {Array} users - user details.
	 * @param {Object} tokenInformation - token details.
	 * @returns {CSV} - created users.
	 */

	static async bulkSessionCreate(filePath, tokenInformation) {
		try {
			const { id, organization_id } = tokenInformation
			const downloadCsv = await this.downloadCSV(filePath)
			const csvData = await csv().fromFile(downloadCsv.result.downloadPath)

			const getLocalizedMessage = (key) => {
				return messages[key] || key
			}

			// Filter out empty rows
			const nonEmptyCsvData = csvData.filter((row) => Object.values(row).some((value) => value !== ''))

			if (nonEmptyCsvData.length === 0 || nonEmptyCsvData.length > process.env.CSV_MAX_ROW) {
				const baseMessage = getLocalizedMessage('CSV_ROW_LIMIT_EXCEEDED')
				const message =
					nonEmptyCsvData.length === 0
						? getLocalizedMessage('EMPTY_CSV')
						: `${baseMessage}${process.env.CSV_MAX_ROW}`
				return responses.failureResponse({
					message: message,
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const expectedHeadings = [
				'Action',
				'id',
				'title',
				'description',
				'type',
				'Mentor(Email)',
				'Mentees(Email)',
				'Date(DD-MM-YYYY)',
				'Time Zone(IST/UTC)',
				'Time (24 hrs)',
				'Duration(Min)',
				'recommended_for',
				'categories',
				'medium',
				'Meeting Platform',
				'Meeting Link',
				'Meeting Passcode (if needed)',
			]

			const validateCsvHeadings = async (filePath, expectedHeadings) => {
				const csvStream = fs.createReadStream(filePath)
				return new Promise((resolve, reject) => {
					csv()
						.fromStream(csvStream)
						.preFileLine((line, index) => {
							if (index === 0) {
								const headers = line.split(',')
								resolve(headers)
							}
							return line
						})
						.on('error', (error) => {
							reject(error)
						})
				})
			}

			const headings = await validateCsvHeadings(downloadCsv.result.downloadPath, expectedHeadings)

			// Compare the fetched headings with the expected ones
			const areHeadingsValid =
				expectedHeadings.every((heading) => headings.includes(heading)) &&
				headings.every((heading) => expectedHeadings.includes(heading) || true)

			if (!areHeadingsValid) {
				return responses.failureResponse({
					message: `Invalid CSV Headings.`,
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const creationData = {
				name: utils.extractFilename(filePath),
				input_path: filePath,
				type: common.FILE_TYPE_CSV,
				organization_id,
				created_by: id,
			}
			const result = await fileUploadQueries.create(creationData)
			if (!result?.id) {
				return responses.successResponse({
					responseCode: 'CLIENT_ERROR',
					statusCode: httpStatusCode.bad_request,
					message: 'SESSION_CSV_UPLOADED_FAILED',
				})
			}

			const userDetail = await mentorExtensionQueries.getMentorExtension(id, ['name', 'email'], true)

			const orgDetails = await organisationExtensionQueries.findOne(
				{ organization_id: organization_id },
				{ attributes: ['name'] }
			)

			//push to queue
			const redisConfiguration = utils.generateRedisConfigForQueue()
			const sessionQueue = new Queue(process.env.DEFAULT_QUEUE, redisConfiguration)
			const session = await sessionQueue.add(
				'upload_sessions',
				{
					fileDetails: result,
					user: {
						id,
						name: userDetail.name,
						email: userDetail.email,
						organization_id,
						org_name: orgDetails.name,
					},
				},
				{
					removeOnComplete: true,
					attempts: common.NO_OF_ATTEMPTS,
					backoff: {
						type: 'fixed',
						delay: common.BACK_OFF_RETRY_QUEUE, // Wait 10 min between attempts
					},
				}
			)
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'SESSION_CSV_UPLOADED',
				result: result,
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	static async getSampleCSV(orgId) {
		try {
			const defaultOrgId = await getDefaultOrgId()
			if (!defaultOrgId) {
				return responses.failureResponse({
					message: 'DEFAULT_ORG_ID_NOT_SET',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			let path = process.env.SAMPLE_CSV_FILE_PATH
			if (orgId != defaultOrgId) {
				const result = await organisationExtensionQueries.findOne(
					{ organization_id: orgId },
					{ attributes: ['uploads'] }
				)
				if (result && result.uploads) {
					path = result.uploads.session_csv_path
				}
			}

			const response = await fileService.getDownloadableUrl(path)
			return response
		} catch (error) {
			throw error
		}
	}

	static async downloadCSV(filePath) {
		try {
			const downloadableUrl = await fileService.getDownloadableUrl(filePath)
			let fileName = path.basename(downloadableUrl.result)

			// Find the index of the first occurrence of '?'
			const index = fileName.indexOf('?')
			// Extract the portion of the string before the '?' if it exists, otherwise use the entire string
			fileName = index !== -1 ? fileName.substring(0, index) : fileName
			const downloadPath = path.join(inviteeFileDir, fileName)
			const response = await axios.get(downloadableUrl.result, {
				responseType: common.responseType,
			})

			const writeStream = fs.createWriteStream(downloadPath)
			response.data.pipe(writeStream)

			await new Promise((resolve, reject) => {
				writeStream.on('finish', resolve)
				writeStream.on('error', (err) => {
					reject(new Error('FAILED_TO_DOWNLOAD_FILE'))
				})
			})

			return {
				success: true,
				result: {
					destPath: inviteeFileDir,
					fileName,
					downloadPath,
				},
			}
		} catch (error) {
			return {
				success: false,
				message: error.message,
			}
		}
	}

	static async validateMentorExtensions(userIds) {
		try {
			const filteredUserIds = userIds.filter((id) => typeof id === 'number')
			const mentors = await mentorExtensionQueries.getMentorExtensions(filteredUserIds)
			const mentorMap = new Map(mentors.map((mentor) => [mentor.user_id, mentor]))
			const validMentors = []
			const invalidMentors = []
			userIds.forEach((userId) => {
				const mentor = mentorMap.get(userId)
				if (mentor) {
					validMentors.push(mentor)
				} else {
					invalidMentors.push(userId)
				}
			})
			return { validMentors, invalidMentors }
		} catch (error) {
			throw error
		}
	}

	static async validateMenteeExtensions(userIds) {
		try {
			const filteredUserIds = userIds.filter((id) => typeof id === 'number')
			const mentees = await menteeExtensionQueries.getMenteeExtensions(filteredUserIds)
			const menteeMap = new Map(mentees.map((mentee) => [mentee.user_id, mentee]))
			const validMentees = []
			const invalidMentees = []
			userIds.forEach((userId) => {
				const mentee = menteeMap.get(userId)
				if (mentee) {
					validMentees.push(mentee)
				} else {
					invalidMentees.push(userId)
				}
			})
			return { validMentees, invalidMentees }
		} catch (error) {
			throw error
		}
	}

	static async removeAllSessions(criteria) {
		try {
			const results = criteria.mentorIds
				? await this.#removeSessionsByMentorIds(criteria.mentorIds)
				: await this.#removeSessionsByOrgId(criteria.orgId)

			const successfulMentorIds = []
			const failedMentorIds = []

			results.forEach((result) => {
				if (result.status === 'fulfilled') {
					successfulMentorIds.push(result.value)
				} else {
					failedMentorIds.push({
						mentorId: result.reason?.data?.mentorId,
						reason: result.reason?.message,
					})
				}
			})

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'BULK_SESSIONS_REMOVED',
				result: {
					successfulMentors: successfulMentorIds,
					failedMentors: failedMentorIds,
				},
			})
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	static async #removeSessionsByMentorIds(mentorIds) {
		return Promise.allSettled(
			mentorIds.map(async (mentorId) => {
				const mentor = await mentorQueries.getMentorExtension(mentorId, ['organization_id'])
				if (!mentor) throw new MentorError('Invalid Mentor Id', { mentorId })

				const removedSessionsDetail = await sessionQueries.removeAndReturnMentorSessions(mentorId)
				await adminService.unenrollAndNotifySessionAttendees(removedSessionsDetail, mentor.organization_id)
				return mentorId
			})
		)
	}

	static async #removeSessionsByOrgId(orgId) {
		const mentors = await mentorQueries.getAllMentors({
			where: { organization_id: orgId },
			attributes: ['user_id', 'organization_id'],
		})

		return Promise.allSettled(
			mentors.map(async (mentor) => {
				const removedSessionsDetail = await sessionQueries.removeAndReturnMentorSessions(mentor.user_id)
				await adminService.unenrollAndNotifySessionAttendees(removedSessionsDetail, mentor.organization_id)
				return mentor.user_id
			})
		)
	}
}

class MentorError extends Error {
	constructor(message, data) {
		super(message)
		this.name = 'MentorError'
		this.data = data
	}
}
