'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			const permissionsData = [
				{
					code: 'connections_permissions',
					module: 'connections',
					request_type: ['POST', 'GET'],
					api_path: '/mentoring/v1/connections/*',
					status: 'ACTIVE',
					created_at: new Date(),
					updated_at: new Date(),
				},
			]
			await queryInterface.bulkInsert('permissions', permissionsData)
		} catch (error) {
			console.log(error)
		}
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.bulkDelete('permissions', null, {})
	},
}
