'use strict'

const defaultChatEnabled = process.env.ENABLE_CHAT === 'true'

module.exports = {
	up: async (queryInterface, Sequelize) => {
		// Add the new column without a default value
		await queryInterface.addColumn('user_extensions', 'settings', {
			type: Sequelize.JSONB,
			allowNull: true,
		})

		// Update existing rows to set chat_enabled based on the environment variable
		await queryInterface.sequelize.query(`
      UPDATE user_extensions
      SET settings = JSON_BUILD_OBJECT('chat_enabled', ${defaultChatEnabled})
      WHERE settings IS NULL;
    `)
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.removeColumn('user_extensions', 'settings')
	},
}
