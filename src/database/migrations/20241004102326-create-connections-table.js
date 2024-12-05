'use strict'
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('connections', {
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
		await queryInterface.addIndex('connections', ['user_id', 'friend_id'], {
			unique: true,
			name: 'unique_user_id_friend_id_connections',
			where: {
				deleted_at: null,
			},
		})
		await queryInterface.addIndex('connections', ['friend_id'], {
			name: 'index_friend_id_connections',
		})
		await queryInterface.addIndex('connections', ['status'], {
			name: 'index_status_connections',
		})
		await queryInterface.addIndex('connections', ['created_by'], {
			name: 'index_created_by_connections',
		})
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.removeIndex('connections', 'index_friend_id_connections')
		await queryInterface.removeIndex('connections', 'index_status_connections')
		await queryInterface.removeIndex('connections', 'unique_user_id_friend_id_connections')
		await queryInterface.removeIndex('connections', 'index_created_by_connections')

		await queryInterface.dropTable('connections')
	},
}
