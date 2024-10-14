'use strict'
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('connection_requests', {
			id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			user_id: {
				type: Sequelize.STRING,
				allowNull: false,
				primaryKey: true,
			},
			friend_id: {
				type: Sequelize.STRING,
				allowNull: false,
				primaryKey: true,
			},
			status: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			meta: {
				type: Sequelize.JSON,
			},

			updated_by: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			created_by: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			deleted_at: {
				type: Sequelize.DATE,
				allowNull: true,
			},
		})
		await queryInterface.addIndex('connection_requests', ['user_id', 'friend_id'], {
			unique: true,
			name: 'unique_user_id_friend_id_connection_requests',
			where: {
				deleted_at: null,
			},
		})

		await queryInterface.addIndex('connection_requests', ['friend_id'], {
			name: 'index_friend_id_connection_requests',
		})
		await queryInterface.addIndex('connection_requests', ['status'], {
			name: 'index_status_connection_requests',
		})
		await queryInterface.addIndex('connection_requests', ['created_by'], {
			name: 'index_created_by_connection_requests',
		})
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.removeIndex('connection_requests', 'unique_user_id_friend_id_connection_requests')
		await queryInterface.removeIndex('connection_requests', 'index_friend_id_connections')
		await queryInterface.removeIndex('connection_requests', 'index_status_connection_requests')
		await queryInterface.removeIndex('connection_requests', 'index_created_by_connection_requests')

		await queryInterface.dropTable('connection_requests')
	},
}
