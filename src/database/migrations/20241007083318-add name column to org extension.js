'use strict'
require('module-alias/register')
require('dotenv').config({ path: '../../.env' })
const userRequests = require('@requests/user')

module.exports = {
	up: async (queryInterface, Sequelize) => {
		try {
			const { STRING } = Sequelize

			await queryInterface.addColumn('organization_extension', 'name', {
				type: STRING,
				allowNull: true,
			})

			await queryInterface.addIndex('organization_extension', ['name'])

			// Fetch the count of distinct organizations
			const [[orgList]] = await queryInterface.sequelize.query(
				'SELECT COUNT(organization_id) AS count FROM organization_extension;'
			)

			const orgsCount = orgList.count
			console.log(`Number of organizations: ${orgsCount}`)

			const getOrgDetails = async (orgIds, batchSize = 500) => {
				const updateBatch = async (batchOrgs) => {
					const orgDetails = await userRequests.listOrganization(batchOrgs)

					if (!orgDetails.success || !orgDetails.data.result) {
						console.error(`Failed to retrieve organization details for batch: ${batchOrgs}`)
						return
					}

					const updatePromises = orgDetails.data.result.map(async (orgInfo) => {
						console.log(`Updating organization_extension for the : ${orgInfo.name} (ID: ${orgInfo.id})`)
						await queryInterface.sequelize.query(
							`UPDATE organization_extension 
                             SET name = :organization_name 
                             WHERE organization_id = :organizationId`,
							{
								replacements: {
									organization_name: orgInfo.name,
									organizationId: orgInfo.id.toString(),
								},
							}
						)
					})

					await Promise.all(updatePromises)
				}

				for (let i = 0; i < orgIds.length; i += batchSize) {
					const batch = orgIds.slice(i, i + batchSize)
					await updateBatch(batch)
				}
			}

			if (orgsCount > 0) {
				const [orgsList] = await queryInterface.sequelize.query(
					'SELECT DISTINCT organization_id FROM organization_extension;'
				)
				const orgIds = orgsList.map((item) => item.organization_id)
				await getOrgDetails(orgIds)
			}
		} catch (error) {
			console.error('Migration failed:', error)
			throw error
		}
	},

	down: async (queryInterface) => {
		try {
			await queryInterface.removeColumn('organization_extension', 'name')
		} catch (err) {
			console.error('Rollback failed:', err)
			throw err
		}
	},
}
