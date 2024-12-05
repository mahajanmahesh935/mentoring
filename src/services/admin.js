const common = require('@constants/common')
const httpStatusCode = require('@generics/http-status')

const utils = require('@generics/utils')
const kafkaCommunication = require('@generics/kafka-communication')

const sessionQueries = require('@database/queries/sessions')
const sessionAttendeesQueries = require('@database/queries/sessionAttendees')
const notificationTemplateQueries = require('@database/queries/notificationTemplate')
const mentorQueries = require('@database/queries/mentorExtension')
const menteeQueries = require('@database/queries/userExtension')
const adminService = require('../generics/materializedViews')
const responses = require('@helpers/responses')

module.exports = class AdminHelper {
	/**
	 * userDelete
	 * @method
	 * @name userDelete
	 * @param {decodedToken} decodedToken - decoded token of admin.
	 * @param {userId} userId - UserId of the user that needs to be deleted
	 * @returns {JSON} - List of users
	 */

	static async userDelete(decodedToken, userId) {
		try {
			if (!decodedToken.roles.some((role) => role.title === common.ADMIN_ROLE)) {
				return responses.failureResponse({
					message: 'UNAUTHORIZED_REQUEST',
					statusCode: httpStatusCode.unauthorized,
					responseCode: 'UNAUTHORIZED',
				})
			}
			let result = {}

			const mentor = await mentorQueries.getMentorExtension(userId)
			const isMentor = mentor !== null

			let removedUserDetails

			if (isMentor) {
				removedUserDetails = await mentorQueries.removeMentorDetails(userId)
				const removedSessionsDetail = await sessionQueries.removeAndReturnMentorSessions(userId)
				result.isAttendeesNotified = await this.unenrollAndNotifySessionAttendees(
					removedSessionsDetail,
					mentor.organization_id ? mentor.organization_id : ''
				)
			} else {
				removedUserDetails = await menteeQueries.removeMenteeDetails(userId)
			}

			result.areUserDetailsCleared = removedUserDetails > 0
			result.isUnenrolledFromSessions = await this.unenrollFromUpcomingSessions(userId)

			if (result.isUnenrolledFromSessions && result.areUserDetailsCleared) {
				return responses.successResponse({
					statusCode: httpStatusCode.ok,
					message: 'USER_REMOVED_SUCCESSFULLY',
					result,
				})
			}
			return responses.failureResponse({
				statusCode: httpStatusCode.bad_request,
				message: 'USER_NOT_REMOVED_SUCCESSFULLY',
				result,
			})
		} catch (error) {
			console.error('An error occurred in userDelete:', error)
			return error
		}
	}

	static async unenrollAndNotifySessionAttendees(removedSessionsDetail, orgId = '') {
		try {
			const templateData = await notificationTemplateQueries.findOneEmailTemplate(
				process.env.MENTOR_SESSION_DELETE_EMAIL_TEMPLATE,
				orgId
			)

			for (const session of removedSessionsDetail) {
				const sessionAttendees = await sessionAttendeesQueries.findAll({
					session_id: session.id,
				})

				const sessionAttendeesIds = sessionAttendees.map((attendee) => attendee.mentee_id)

				const attendeeProfiles = await menteeQueries.getUsersByUserIds(sessionAttendeesIds, {}, true)

				console.log('ATTENDEE PROFILES: ', attendeeProfiles)

				const sendEmailPromises = attendeeProfiles.map(async (attendee) => {
					const payload = {
						type: 'email',
						email: {
							to: attendee.email,
							subject: templateData.subject,
							body: utils.composeEmailBody(templateData.body, {
								name: attendee.name,
								sessionTitle: session.title,
							}),
						},
					}
					await kafkaCommunication.pushEmailToKafka(payload)
				})
				await Promise.all(sendEmailPromises)
			}
			const sessionIds = removedSessionsDetail.map((session) => session.id)
			const unenrollCount = await sessionAttendeesQueries.unEnrollAllAttendeesOfSessions(sessionIds)
			return true
		} catch (error) {
			console.error('An error occurred in notifySessionAttendees:', error)
			return error
		}
	}

	static async unenrollFromUpcomingSessions(userId) {
		try {
			const upcomingSessions = await sessionQueries.getAllUpcomingSessions(false)

			const upcomingSessionsId = upcomingSessions.map((session) => session.id)
			const usersUpcomingSessions = await sessionAttendeesQueries.usersUpcomingSessions(
				userId,
				upcomingSessionsId
			)
			if (usersUpcomingSessions.length === 0) {
				return true
			}
			await Promise.all(
				usersUpcomingSessions.map(async (session) => {
					await sessionQueries.updateEnrollmentCount(session.session_id, true)
				})
			)

			const unenrollFromUpcomingSessions = await sessionAttendeesQueries.unenrollFromUpcomingSessions(
				userId,
				upcomingSessionsId
			)
			return true
		} catch (error) {
			console.error('An error occurred in unenrollFromUpcomingSessions:', error)
			return error
		}
	}

	static async triggerViewRebuild(decodedToken) {
		try {
			const result = await adminService.triggerViewBuild()
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'MATERIALIZED_VIEW_GENERATED_SUCCESSFULLY',
			})
		} catch (error) {
			console.error('An error occurred in userDelete:', error)
			return error
		}
	}
	static async triggerPeriodicViewRefresh(decodedToken) {
		try {
			const result = await adminService.triggerPeriodicViewRefresh()
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'MATERIALIZED_VIEW_REFRESH_INITIATED_SUCCESSFULLY',
			})
		} catch (error) {
			console.error('An error occurred in userDelete:', error)
			return error
		}
	}
	static async triggerPeriodicViewRefreshInternal(modelName) {
		try {
			const result = await adminService.refreshMaterializedView(modelName)
			console.log(result)
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'MATERIALIZED_VIEW_REFRESH_INITIATED_SUCCESSFULLY',
			})
		} catch (error) {
			console.error('An error occurred in userDelete:', error)
			return error
		}
	}
}
