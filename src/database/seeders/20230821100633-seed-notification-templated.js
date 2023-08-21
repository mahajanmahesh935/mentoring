'use strict'

module.exports = {
	up: async (queryInterface, Sequelize) => {
		return queryInterface.bulkInsert('notification_templates', [
			{
				id: 1,
				type: 'email',
				code: 'mentor_one_hour_before_session_reminder',
				subject: 'MentorED - Your scheduled session starts in 1 hour',
				body: "{{default}}<div><p>Dear {name},</p> The live session scheduled by you - {sessionTitle} begins in 1 hour. Please ensure that you join at least 10 minutes before for the set time to allow Mentees to settle in.</div>{{/default}}{{linkWarning}}<div><p>Please add a meeting link for your scheduled session that starts in less than 1 hour. To add a meeting link, click on the 'edit session' option on the session details page of MentorED.</div></p>{{/linkWarning}}",
				status: 'active',
				email_header: 'email_header',
				email_footer: 'email_footer',
				created_by: 1, // Replace with appropriate user ID
				updated_by: 1, // Replace with appropriate user ID
				created_at: new Date(),
				updated_at: new Date(),
			},
			{
				id: 2,
				type: 'emailHeader',
				code: 'email_header',
				body: "<div style='margin:auto;width:100%;max-width:650px;'><p style='text-align:center'><img class='img_path' style='width:35%' alt='MentorED' src='https://mentoring-dev-storage.s3.ap-south-1.amazonaws.com/email/image/emailLogo.png'></p><div style='text-align:center'>",
				status: 'active',
				created_at: new Date(),
				updated_at: new Date(),
				created_by: 1, // Replace with appropriate user ID
				updated_by: 1, // Replace with appropriate user ID
			},
			{
				id: 3,
				type: 'emailFooter',
				code: 'email_footer',
				body: "</div><div style='margin-top:20px;text-align:center;'><div>Regards,</div><div>Team MentorED</div><div style='margin-top:20px;color:#b13e33;text-align:center'><div>Note: Do not reply to this email. This email is sent from an unattended mailbox. Replies will not be read.</div><div>For any queries, please feel free to reach out to us at support@shikshalokam.org</div></div></div></div>",
				status: 'active',
				created_at: new Date(),
				updated_at: new Date(),
				created_by: 1, // Replace with appropriate user ID
				updated_by: 1, // Replace with appropriate user ID
			},
			{
				id: 4,
				type: 'email',
				code: 'mentee_session_reminder',
				subject: 'MentorED - Your enrolled session starts in 15 minutes',
				body: '<p>Dear {name},</p> The live session you have enrolled in {sessionTitle} begins in 15 minutes. Please ensure that you join at least 5 minutes before for the session to begin on time.',
				status: 'active',
				created_at: new Date(),
				updated_at: new Date(),
				created_by: 1, // Replace with appropriate user ID
				updated_by: 1, // Replace with appropriate user ID
				email_footer: 'email_footer',
				email_header: 'email_header',
			},
			{
				id: 5,
				type: 'email',
				code: 'mentor_session_reminder',
				subject: 'MentorED - Your scheduled session starts in 24 hours',
				body: "{{default}}<p>Dear {name},</p> The live session scheduled by you - {sessionTitle} is scheduled in 24 hours from now. Please ensure that you join at least ten minutes before the set time to allow Mentees to settle in.{{/default}}{{linkWarning}}<div><p>Please add a meeting link for your scheduled session that starts in less than 24 hours. To add a meeting link, click on the 'edit session' option on the session details page of MentorED.</div></p>{{/linkWarning}}",
				status: 'active',
				created_at: new Date(),
				updated_at: new Date(),
				created_by: 1, // Replace with appropriate user ID
				updated_by: 1, // Replace with appropriate user ID
				email_footer: 'email_footer',
				email_header: 'email_header',
			},
			{
				id: 6,
				type: 'email',
				code: 'mentor_session_delete',
				subject: 'MentorED - Changes updated in your session',
				body: '<p>Dear {name},</p> Please note that the Mentor has cancelled the session - {sessionTitle}.',
				status: 'active',
				created_at: new Date(),
				updated_at: new Date(),
				created_by: 1, // Replace with appropriate user ID
				updated_by: 1, // Replace with appropriate user ID
				email_footer: 'email_footer',
				email_header: 'email_header',
			},
			{
				id: 7,
				type: 'email',
				code: 'mentor_session_reschedule',
				subject: 'MentorED - Changes in your enrolled session',
				body: '<p>Dear {name},</p> Please note that the Mentor has rescheduled the session - {sessionTitle} from {oldStartDate} {oldStartTime} - {oldEndDate} {oldEndTime} to {newStartDate} {newStartTime} - {newStartDate} {newStartTime} Please make note of the changes.',
				status: 'active',
				created_at: new Date(),
				updated_at: new Date(),
				created_by: 1, // Replace with appropriate user ID
				updated_by: 1, // Replace with appropriate user ID
				email_footer: 'email_footer',
				email_header: 'email_header',
			},
			{
				id: 8,
				type: 'email',
				code: 'mentee_session_cancel',
				subject: 'MentorED - Changes in your enrolled session',
				body: "<div><p>Dear {name}, </p> You have cancelled your enrollment for the session - {sessionTitle} by {mentorName} Please explore 'All sessions' on your app to enroll for new sessions of your choice.</div>",
				status: 'active',
				created_at: new Date(),
				updated_at: new Date(),
				created_by: 1, // Replace with appropriate user ID
				updated_by: 1, // Replace with appropriate user ID
				email_footer: 'email_footer',
				email_header: 'email_header',
			},
			{
				id: 9,
				type: 'email',
				code: 'mentee_session_enrollment',
				subject: 'MentorED - Session Enrollment Details',
				body: "<p>Dear {name},</p> Thank you for enrolling for the session - {sessionTitle} by {mentorName}, The session is scheduled on {startDate} at {startTime} You will be able to join from 'My sessions' on the app once the host starts the meeting.",
				status: 'active',
				created_at: new Date(),
				updated_at: new Date(),
				created_by: 1, // Replace with appropriate user ID
				updated_by: 1, // Replace with appropriate user ID
				email_footer: 'email_footer',
				email_header: 'email_header',
			},
			{
				id: 10,
				type: 'email',
				code: 'user_issue_reported',
				subject: 'Support request for MentorED',
				body: '<div><p>Hi Team,</p><p>{role} {name}, is facing an issue in <b>{description}</b> -{userEmailId},User ID: <b>{userId}</b> .</p><p>Kindly look into it.</p><div style="background-color: #f5f5f5; padding: 10px; margin-top: 10px;"><p><b>Meta Information:</b></p><ul style="list-style-type: none; padding: 0;">{metaItems}</ul></div></div>',
				status: 'active',
				created_at: new Date(),
				updated_at: new Date(),
				created_by: 1,
				updated_by: 1,
				email_footer: 'email_footer',
				email_header: 'email_header',
			},
		])
	},

	down: async (queryInterface, Sequelize) => {
		return queryInterface.bulkDelete('notification_templates', null, {})
	},
}
