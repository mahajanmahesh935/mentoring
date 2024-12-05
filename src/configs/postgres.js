require('module-alias/register')
require('dotenv').config()

let environmentData = require('../envVariables')()

if (!environmentData.success) {
	logger.error('Server could not start . Not all environment variable is provided', {
		triggerNotification: true,
	})
	process.exit()
}

const defaultOrgId =
	process.env.DEFAULT_ORG_ID.toString() ||
	(() => {
		throw new Error(
			'DEFAULT_ORG_ID is not defined in env. Run the script called insertDefaultOrg.js in /scripts folder.'
		)
	})()

module.exports = {
	development: {
		url: process.env.DEV_DATABASE_URL,
		dialect: 'postgres',
		migrationStorageTableName: 'sequelize_meta',
		define: {
			underscored: true,
			freezeTableName: true,
			paranoid: true,
			syncOnAssociation: true,
			charset: 'utf8',
			collate: 'utf8_general_ci',
			timestamps: true,
			createdAt: 'created_at',
			updatedAt: 'updated_at',
			deletedAt: 'deleted_at',
			logging: false,
		},
		defaultOrgId: defaultOrgId,
	},
	test: {
		url: process.env.TEST_DATABASE_URL,
		dialect: 'postgres',
		defaultOrgId: defaultOrgId,
	},
	production: {
		url: process.env.DATABASE_URL,
		dialect: 'postgres',
		defaultOrgId: defaultOrgId,
	},
}
