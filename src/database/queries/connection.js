'use strict'
const Connection = require('../models/index').Connection
const ConnectionRequest = require('../models/index').ConnectionRequest

const { Op } = require('sequelize')
const sequelize = require('@database/models/index').sequelize

const common = require('@constants/common')
const MenteeExtension = require('@database/models/index').UserExtension
const { QueryTypes } = require('sequelize')

exports.addFriendRequest = async (userId, friendId, message) => {
	try {
		const result = await sequelize.transaction(async (t) => {
			const friendRequestData = [
				{
					user_id: userId,
					friend_id: friendId,
					status: common.CONNECTIONS_STATUS.REQUESTED,
					created_by: userId,
					updated_by: userId,
					meta: {
						message,
					},
				},
				{
					user_id: friendId,
					friend_id: userId,
					status: common.CONNECTIONS_STATUS.REQUESTED,
					created_by: userId,
					updated_by: userId,
					meta: {
						message,
					},
				},
			]

			const requests = await ConnectionRequest.bulkCreate(friendRequestData, { transaction: t })

			return requests[0].get({ plain: true })
		})

		return result
	} catch (error) {
		throw error
	}
}

exports.getPendingRequests = async (userId, page, pageSize) => {
	try {
		const result = await ConnectionRequest.findAndCountAll({
			where: {
				user_id: userId,
				status: common.CONNECTIONS_STATUS.REQUESTED,
				created_by: { [Op.ne]: userId },
			},
			raw: true,
			limit: pageSize,
			offset: (page - 1) * pageSize,
		})
		return result
	} catch (error) {
		throw error
	}
}

exports.approveRequest = async (userId, friendId, meta) => {
	try {
		const requests = await sequelize.transaction(async (t) => {
			const deletedCount = await ConnectionRequest.destroy({
				where: {
					[Op.or]: [
						{ user_id: userId, friend_id: friendId },
						{ user_id: friendId, friend_id: userId },
					],
					status: common.CONNECTIONS_STATUS.REQUESTED,
					created_by: friendId,
				},
				individualHooks: true,
				transaction: t,
			})
			if (deletedCount != 2) {
				throw new Error('Error while deleting from "ConnectionRequest"')
			}

			const friendRequestData = [
				{
					user_id: userId,
					friend_id: friendId,
					status: common.CONNECTIONS_STATUS.ACCEPTED,
					created_by: friendId,
					updated_by: userId,
					meta,
				},
				{
					user_id: friendId,
					friend_id: userId,
					status: common.CONNECTIONS_STATUS.ACCEPTED,
					created_by: friendId,
					updated_by: userId,
					meta,
				},
			]

			const requests = await Connection.bulkCreate(friendRequestData, {
				transaction: t,
			})

			return requests
		})

		return requests
	} catch (error) {
		throw error
	}
}

exports.rejectRequest = async (userId, friendId) => {
	try {
		const updateData = {
			status: common.CONNECTIONS_STATUS.REJECTED,
			updated_by: userId,
			deleted_at: Date.now(),
		}

		return await ConnectionRequest.update(updateData, {
			where: {
				status: common.CONNECTIONS_STATUS.REQUESTED,
				[Op.or]: [
					{ user_id: userId, friend_id: friendId },
					{ user_id: friendId, friend_id: userId },
				],
				created_by: friendId,
			},
			individualHooks: true,
		})
	} catch (error) {
		throw error
	}
}
exports.findOneRequest = async (userId, friendId) => {
	try {
		const connectionRequest = await ConnectionRequest.findOne({
			where: {
				[Op.or]: [
					{ user_id: userId, friend_id: friendId },
					{ user_id: friendId, friend_id: userId },
				],
				status: common.CONNECTIONS_STATUS.REQUESTED,
				created_by: friendId,
			},
			raw: true,
		})

		return connectionRequest
	} catch (error) {
		throw error
	}
}

exports.checkPendingRequest = async (userId, friendId) => {
	try {
		const result = await ConnectionRequest.findOne({
			where: {
				user_id: userId,
				friend_id: friendId,
				status: common.CONNECTIONS_STATUS.REQUESTED,
			},
			raw: true,
		})
		return result
	} catch (error) {
		throw error
	}
}

exports.getSentAndReceivedRequests = async (userId) => {
	try {
		const result = await Connection.findAll({
			where: {
				[Op.or]: [{ user_id: userId }, { friend_id: userId }],
				status: common.CONNECTIONS_STATUS.REQUESTED,
			},
			raw: true,
		})
		return result
	} catch (error) {
		throw error
	}
}

exports.getConnection = async (userId, friendId) => {
	try {
		const result = await Connection.findOne({
			where: {
				user_id: userId,
				friend_id: friendId,
				status: {
					[Op.or]: [common.CONNECTIONS_STATUS.ACCEPTED, common.CONNECTIONS_STATUS.BLOCKED],
				},
			},
			raw: true,
		})
		return result
	} catch (error) {
		throw error
	}
}

exports.getConnectionsByUserIds = async (userId, friendIds, projection) => {
	try {
		const defaultProjection = ['user_id', 'friend_id']

		const result = await Connection.findAll({
			where: {
				user_id: userId,
				friend_id: {
					[Op.in]: friendIds,
				},
				status: common.CONNECTIONS_STATUS.ACCEPTED,
			},
			attributes: projection || defaultProjection,
			raw: true,
		})
		return result
	} catch (error) {
		throw error
	}
}

exports.getConnectionsDetails = async (
	page,
	limit,
	filter,
	searchText = '',
	userId,
	organizationIds = [],
	roles = []
) => {
	try {
		let additionalFilter = ''
		let orgFilter = ''
		let filterClause = ''
		let rolesFilter = ''

		if (searchText) {
			additionalFilter = `AND name ILIKE :search`
		}

		if (organizationIds.length > 0) {
			orgFilter = `AND organization_id IN (:organizationIds)`
		}

		if (filter?.query?.length > 0) {
			filterClause = filter.query.startsWith('AND') ? filter.query : 'AND ' + filter.query
		}

		// Add the roles filter
		if (roles.includes('mentor') && roles.includes('mentee')) {
			// Show both mentors and mentees, no additional filter needed
		} else if (roles.includes('mentor')) {
			rolesFilter = `AND is_mentor = true`
		} else if (roles.includes('mentee')) {
			rolesFilter = `AND is_mentor = false`
		}

		const userFilterClause = `user_id IN (SELECT friend_id FROM ${Connection.tableName} WHERE user_id = :userId)`

		const projectionClause = `
		name,
		user_id,
		mentee_visibility,
		organization_id,
		designation,
		area_of_expertise,
		education_qualification,
		custom_entity_text::JSONB AS custom_entity_text,
		meta::JSONB AS meta
		`

		let query = `
            SELECT ${projectionClause}
            FROM ${common.materializedViewsPrefix + MenteeExtension.tableName}
            WHERE ${userFilterClause}
            ${orgFilter}
            ${filterClause}
            ${rolesFilter}
            ${additionalFilter}
        `

		const replacements = {
			...filter?.replacements,
			search: `%${searchText}%`,
			userId,
			organizationIds,
		}

		if (page !== null && limit !== null) {
			query += `
                OFFSET :offset
                LIMIT :limit;
            `
			replacements.offset = limit * (page - 1)
			replacements.limit = limit
		}

		const connectedUsers = await sequelize.query(query, {
			type: QueryTypes.SELECT,
			replacements: replacements,
		})

		const countQuery = `
		    SELECT count(*) AS "count"
		    FROM ${common.materializedViewsPrefix + MenteeExtension.tableName}
		    WHERE ${userFilterClause}
		    ${filterClause}
		    ${rolesFilter}
		    ${orgFilter}
		    ${additionalFilter};
		`
		const count = await sequelize.query(countQuery, {
			type: QueryTypes.SELECT,
			replacements: replacements,
		})

		return {
			data: connectedUsers,
			count: Number(count[0].count),
		}
	} catch (error) {
		throw error
	}
}
