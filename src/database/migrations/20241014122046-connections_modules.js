'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	up: async (queryInterface, Sequelize) => {
		const modulesData = [{ code: 'connections', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() }]

		// Insert the data into the 'modules' table
		await queryInterface.bulkInsert('modules', modulesData)
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.bulkDelete('modules', null, {})
	},
}
