'use strict'

require('module-alias/register')
require('dotenv').config()
const common = require('@constants/common')
const Permissions = require('@database/models/index').Permission

const getPermissionId = async (module, request_type, api_path) => {
	try {
		const permission = await Permissions.findOne({
			where: { module, request_type, api_path },
		})
		if (!permission) {
			throw error
		}
		return permission.id
	} catch (error) {
		throw error
	}
}

module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			const rolePermissionsData = [
				{
					role_title: common.ORG_ADMIN_ROLE,
					permission_id: await getPermissionId('connections', ['POST', 'GET'], '/mentoring/v1/connections/*'),
					module: 'connections',
					request_type: ['POST', 'GET'],
					api_path: '/mentoring/v1/connections/*',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.ADMIN_ROLE,
					permission_id: await getPermissionId('connections', ['POST', 'GET'], '/mentoring/v1/connections/*'),
					module: 'connections',
					request_type: ['POST', 'GET'],
					api_path: '/mentoring/v1/connections/*',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.MENTOR_ROLE,
					permission_id: await getPermissionId('connections', ['POST', 'GET'], '/mentoring/v1/connections/*'),
					module: 'connections',
					request_type: ['POST', 'GET'],
					api_path: '/mentoring/v1/connections/*',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.MENTEE_ROLE,
					permission_id: await getPermissionId('connections', ['POST', 'GET'], '/mentoring/v1/connections/*'),
					module: 'connections',
					request_type: ['POST', 'GET'],
					api_path: '/mentoring/v1/connections/*',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
				{
					role_title: common.USER_ROLE,
					permission_id: await getPermissionId('connections', ['POST', 'GET'], '/mentoring/v1/connections/*'),
					module: 'connections',
					request_type: ['POST', 'GET'],
					api_path: '/mentoring/v1/connections/*',
					created_at: new Date(),
					updated_at: new Date(),
					created_by: 0,
				},
			]
			await queryInterface.bulkInsert('role_permission_mapping', rolePermissionsData)
		} catch (error) {
			console.error(error)
		}
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.bulkDelete('role_permission_mapping', null, {})
	},
}
