'use strict'
require('module-alias/register')
require('dotenv').config({ path: '../../.env' })
const userRequests = require('@requests/user')

module.exports = {
	up: async (queryInterface, Sequelize) => {
		try {
			const { STRING } = Sequelize

			await queryInterface.addColumn('user_extensions', 'image', { type: STRING, allowNull: true })

			const [userCount] = await queryInterface.sequelize.query(
				'SELECT count(*) AS "count" FROM user_extensions WHERE image IS NULL AND deleted_at IS NULL;'
			)

			console.log(`Number of users to update: ${userCount[0].count}`)

			const updateUsers = async (table, userIds, batchSize = 5000) => {
				const updateBatch = async (batch) => {
					const userDetails = (await userRequests.getListOfUserDetails(batch)).result
					console.log('userDetails', userDetails)
					const userDetailsMap = Object.fromEntries(userDetails.map((user) => [user.id, user]))

					const updates = batch.map(async (userId) => {
						const matchingUser = userDetailsMap[userId]
						if (matchingUser) {
							try {
								let imagePath
								if (matchingUser.image_cloud_path) {
									imagePath = matchingUser.image_cloud_path
								} else {
									imagePath = matchingUser.image
								}
								await queryInterface.sequelize.query(
									`UPDATE ${table} SET image = ? WHERE user_id = ?`,
									{
										replacements: [imagePath, userId],
									}
								)
							} catch (error) {
								console.error(`Error updating userId ${userId} in ${table}:`, error)
							}
						} else {
							console.warn(`No matching user found for userId: ${userId} in ${table}`)
						}
					})

					await Promise.all(updates)
				}

				for (let i = 0; i < userIds.length; i += batchSize) {
					const batch = userIds.slice(i, i + batchSize)
					await updateBatch(batch)
				}
			}

			if (userCount[0].count > 0) {
				const [users] = await queryInterface.sequelize.query(
					'SELECT user_id FROM user_extensions WHERE image IS NULL AND deleted_at IS NULL;'
				)
				const userIds = users.map((item) => item.user_id)
				await updateUsers('user_extensions', userIds)
			}
		} catch (error) {
			console.error('Migration failed:', error)
			throw error
		}
	},

	down: async (queryInterface) => {
		try {
			await queryInterface.removeColumn('user_extensions', 'image')
		} catch (err) {
			console.error('Rollback failed:', err)
			throw err
		}
	},
}
