const MenteeExtension = require('@database/models/index').UserExtension
const { QueryTypes } = require('sequelize')
const sequelize = require('sequelize')
const Sequelize = require('@database/models/index').sequelize
const common = require('@constants/common')
const _ = require('lodash')
const { Op } = require('sequelize')
const emailEncryption = require('@utils/emailEncryption')

module.exports = class MenteeExtensionQueries {
	static async getColumns() {
		try {
			return await Object.keys(MenteeExtension.rawAttributes)
		} catch (error) {
			return error
		}
	}

	static async getModelName() {
		try {
			return await MenteeExtension.name
		} catch (error) {
			return error
		}
	}
	static async createMenteeExtension(data) {
		try {
			return await MenteeExtension.create(data, { returning: true })
		} catch (error) {
			throw error
		}
	}

	static async updateMenteeExtension(userId, data, options = {}, customFilter = {}) {
		try {
			if (data.user_id) {
				delete data['user_id']
			}
			const whereClause = _.isEmpty(customFilter) ? { user_id: userId } : customFilter

			// If `meta` is included in `data`, use `jsonb_set` to merge changes safely
			if (data.meta) {
				for (const [key, value] of Object.entries(data.meta)) {
					data.meta = Sequelize.fn(
						'jsonb_set',
						Sequelize.fn('COALESCE', Sequelize.col('meta'), '{}'), // Initializes `meta` if null
						`{${key}}`,
						JSON.stringify(value),
						true
					)
				}
			}

			return await MenteeExtension.update(data, {
				where: whereClause,
				...options,
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	static async addVisibleToOrg(organizationId, newRelatedOrgs, options = {}) {
		// Update user extension and concat related org to the org id
		await MenteeExtension.update(
			{
				visible_to_organizations: sequelize.literal(
					`array_cat("visible_to_organizations", ARRAY[${newRelatedOrgs}]::integer[])`
				),
			},
			{
				where: {
					organization_id: organizationId,
					[Op.or]: [
						{
							[Op.not]: {
								visible_to_organizations: {
									[Op.contains]: newRelatedOrgs,
								},
							},
						},
						{
							visible_to_organizations: {
								[Op.is]: null,
							},
						},
					],
				},
				...options,
				individualHooks: true,
			}
		)
		// Update user extension and append org id to all the related orgs
		return await MenteeExtension.update(
			{
				visible_to_organizations: sequelize.literal(
					`COALESCE("visible_to_organizations", ARRAY[]::integer[]) || ARRAY[${organizationId}]::integer[]`
				),
			},
			{
				where: {
					organization_id: {
						[Op.in]: [...newRelatedOrgs],
					},
					[Op.or]: [
						{
							[Op.not]: {
								visible_to_organizations: {
									[Op.contains]: [organizationId],
								},
							},
						},
						{
							visible_to_organizations: {
								[Op.is]: null,
							},
						},
					],
				},
				individualHooks: true,
				...options,
			}
		)
	}

	static async removeVisibleToOrg(orgId, elementsToRemove) {
		const organizationUpdateQuery = `
		  UPDATE "user_extensions"
		  SET "visible_to_organizations" = (
			SELECT array_agg(elem)
			FROM unnest("visible_to_organizations") AS elem
			WHERE elem NOT IN (${elementsToRemove.join(',')})
		  )
		  WHERE organization_id = :orgId
		`

		await Sequelize.query(organizationUpdateQuery, {
			replacements: { orgId },
			type: Sequelize.QueryTypes.UPDATE,
		})
		const relatedOrganizationUpdateQuery = `
		  UPDATE "user_extensions"
		  SET "visible_to_organizations" = (
			SELECT array_agg(elem)
			FROM unnest("visible_to_organizations") AS elem
			WHERE elem NOT IN (${orgId})
		  )
		  WHERE organization_id IN (:elementsToRemove)
		`

		await Sequelize.query(relatedOrganizationUpdateQuery, {
			replacements: { elementsToRemove },
			type: Sequelize.QueryTypes.UPDATE,
		})
	}
	static async getMenteeExtension(userId, attributes = [], unScoped = false) {
		try {
			const queryOptions = {
				where: { user_id: userId },
				raw: true,
			}
			// If attributes are passed update query
			if (attributes.length > 0) {
				queryOptions.attributes = attributes
			}
			let mentee
			if (unScoped) {
				mentee = await MenteeExtension.unscoped().findOne(queryOptions)
			} else {
				mentee = await MenteeExtension.findOne(queryOptions)
			}
			if (mentee.email) {
				mentee.email = await emailEncryption.decrypt(mentee.email.toLowerCase())
			}
			return mentee
		} catch (error) {
			throw error
		}
	}

	static async deleteMenteeExtension(userId, force = false) {
		try {
			const options = { where: { user_id: userId } }

			if (force) {
				options.force = true
			}
			return await MenteeExtension.destroy(options)
		} catch (error) {
			throw error
		}
	}
	static async removeMenteeDetails(userId) {
		try {
			return await MenteeExtension.update(
				{
					designation: null,
					area_of_expertise: [],
					education_qualification: null,
					rating: null,
					meta: null,
					stats: null,
					tags: [],
					configs: null,
					mentor_visibility: null,
					visible_to_organizations: [],
					external_session_visibility: null,
					external_mentor_visibility: null,
					external_mentee_visibility: null,
					mentee_visibility: null,
					deleted_at: Date.now(),
				},
				{
					where: {
						user_id: userId,
					},
				}
			)
		} catch (error) {
			console.error('An error occurred:', error)
			throw error
		}
	}

	static async getUsersByUserIds(ids, options = {}, unscoped = false) {
		try {
			const query = {
				where: {
					user_id: ids,
				},
				...options,
				returning: true,
				raw: true,
			}

			const result = unscoped
				? await MenteeExtension.unscoped().findAll(query)
				: await MenteeExtension.findAll(query)

			return result
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	static async getUsersByUserIdsFromView(
		ids,
		page,
		limit,
		filter,
		saasFilter = '',
		additionalProjectionclause = '',
		returnOnlyUserId,
		searchText = ''
	) {
		try {
			let additionalFilter = ''

			if (searchText) {
				additionalFilter = `AND name ILIKE :search`
			}
			if (Array.isArray(searchText)) {
				additionalFilter = `AND email IN ('${searchText.join("','")}')`
			}

			const excludeUserIds = ids.length === 0
			const userFilterClause = excludeUserIds ? '' : `user_id IN (${ids.join(',')})`

			const filterClause = filter?.query.length > 0 ? `${filter.query}` : ''

			let saasFilterClause = saasFilter !== '' ? saasFilter : ''
			if (excludeUserIds && filter.query.length === 0) {
				saasFilterClause = saasFilterClause.replace('AND ', '') // Remove "AND" if excludeUserIds is true and filter is empty
			}

			let projectionClause =
				'user_id,meta,mentee_visibility,organization_id,designation,area_of_expertise,education_qualification'

			if (returnOnlyUserId) {
				projectionClause = 'user_id'
			} else if (additionalProjectionclause !== '') {
				projectionClause += `,${additionalProjectionclause}`
			}

			if (userFilterClause && filter?.query.length > 0) {
				filterClause = filterClause.startsWith('AND') ? filterClause : 'AND' + filterClause
			}

			let query = `
				SELECT ${projectionClause}
				FROM
					${common.materializedViewsPrefix + MenteeExtension.tableName}
				WHERE
					${userFilterClause}
					${filterClause}
					${saasFilterClause}
					${additionalFilter}
			`

			const replacements = {
				...filter.replacements, // Add filter parameters to replacements
				search: `%${searchText}%`,
			}

			if (page !== null && limit !== null) {
				query += `
					OFFSET
						:offset
					LIMIT
						:limit;
				`

				replacements.offset = limit * (page - 1)
				replacements.limit = limit
			}

			const mentees = await Sequelize.query(query, {
				type: QueryTypes.SELECT,
				replacements: replacements,
			})

			const countQuery = `
			SELECT count(*) AS "count"
			FROM
				${common.materializedViewsPrefix + MenteeExtension.tableName}
			WHERE
				${userFilterClause}
				${filterClause}
				${saasFilterClause}
				${additionalFilter}
;
		`
			const count = await Sequelize.query(countQuery, {
				type: QueryTypes.SELECT,
				replacements: replacements,
			})

			return {
				data: mentees,
				count: Number(count[0].count),
			}
		} catch (error) {
			throw error
		}
	}
	static async getMenteeExtensions(userIds, attributes = []) {
		try {
			const queryOptions = { where: { user_id: { [Op.in]: userIds } }, raw: true }
			// If attributes are passed update query
			if (attributes.length > 0) {
				queryOptions.attributes = attributes
			}
			const mentee = await MenteeExtension.findAll(queryOptions)
			return mentee
		} catch (error) {
			throw error
		}
	}
	static async findOneFromView(userId) {
		try {
			let query = `
				SELECT *
				FROM ${common.materializedViewsPrefix + MenteeExtension.tableName}
				WHERE user_id = :userId
				LIMIT 1
			`
			const user = await Sequelize.query(query, {
				replacements: { userId },
				type: QueryTypes.SELECT,
			})

			return user.length > 0 ? user[0] : null
		} catch (error) {
			return error
		}
	}

	static async getAllUsers(
		ids,
		page,
		limit,
		filter,
		saasFilter = '',
		additionalProjectionClause = '',
		returnOnlyUserId,
		searchText = '',
		defaultFilter = ''
	) {
		try {
			const excludeUserIds = ids.length === 0
			const userFilterClause = excludeUserIds ? '' : `user_id IN (${ids.join(',')})`
			let additionalFilter = ''

			if (searchText) {
				additionalFilter = `AND name ILIKE :search`
			}
			if (Array.isArray(searchText)) {
				additionalFilter = `AND email IN ('${searchText.join("','")}')`
			}

			const filterClause = filter?.query.length > 0 ? `${filter.query}` : ''
			let saasFilterClause = saasFilter !== '' ? saasFilter : ''

			if (excludeUserIds && filter.query.length === 0) {
				saasFilterClause = saasFilterClause.replace('AND ', '') // Remove "AND" if excludeUserIds is true and filter is empty
			}

			let projectionClause = `
				user_id,
				mentee_visibility,
				organization_id,
				designation,
				area_of_expertise,
				education_qualification,
				custom_entity_text::JSONB AS custom_entity_text,
				meta::JSONB AS meta
			`
			if (returnOnlyUserId) {
				projectionClause = 'user_id'
			} else if (additionalProjectionClause !== '') {
				projectionClause += `, ${additionalProjectionClause}`
			}

			if (userFilterClause && filter?.query.length > 0) {
				filterClause = filterClause.startsWith('AND') ? filterClause : 'AND ' + filterClause
			}

			const query = `
				SELECT ${projectionClause}
				FROM ${common.materializedViewsPrefix + MenteeExtension.tableName}
				WHERE
					${userFilterClause}
					${filterClause}
					${saasFilterClause}
					${additionalFilter}
					${defaultFilter}
				OFFSET :offset
				LIMIT :limit
			`

			const replacements = {
				...filter.replacements, // Add filter parameters to replacements
				search: `%${searchText}%`,
			}

			if (page !== null && limit !== null) {
				replacements.offset = limit * (page - 1)
				replacements.limit = limit
			}

			const results = await Sequelize.query(query, {
				type: QueryTypes.SELECT,
				replacements: replacements,
			})

			const countQuery = `
				SELECT COUNT(*) AS count
				FROM ${common.materializedViewsPrefix + MenteeExtension.tableName}
				WHERE
					${userFilterClause}
					${filterClause}
					${saasFilterClause}
					${additionalFilter}
					${defaultFilter}
			`

			const count = await Sequelize.query(countQuery, {
				type: QueryTypes.SELECT,
				replacements: replacements,
			})

			return {
				data: results,
				count: Number(count[0].count),
			}
		} catch (error) {
			throw error
		}
	}
	static async getAllUsersByIds(ids) {
		try {
			const excludeUserIds = ids.length === 0
			const userFilterClause = excludeUserIds ? '' : `user_id IN (${ids.map((id) => `'${id}'`).join(',')})`

			const query = `
				SELECT *
				FROM ${common.materializedViewsPrefix + MenteeExtension.tableName}
				WHERE
					${userFilterClause}
				`

			const results = await Sequelize.query(query, {
				type: QueryTypes.SELECT,
			})
			return results
		} catch (error) {
			throw error
		}
	}

	/**
	 * Retrieves users from the database based on the provided email IDs.
	 *
	 * This static method constructs and executes a SQL query to fetch users whose email
	 * addresses are provided in the `emailIds` array. It returns an array of user records
	 * matching the given email IDs.
	 *
	 * @param {Array<string>} emailIds - An array of email IDs to filter the users by.
	 * @returns {Promise<Array<object>>} - A promise that resolves to an array of user objects.
	 *
	 * @example
	 * const emailIds = ['user1@example.com', 'user2@example.com'];
	 * const users = await getUsersByEmailIds(emailIds);
	 * console.log(users); // Outputs an array of user records matching the provided email IDs.
	 */
	static async getUsersByEmailIds(emailIds) {
		try {
			const userFilterClause =
				emailIds.length === 0 ? '' : `email IN (${emailIds.map((id) => `'${id}'`).join(',')})`

			const query = `
				SELECT *
				FROM ${common.materializedViewsPrefix + MenteeExtension.tableName}
				WHERE
					${userFilterClause}
				`

			const results = await Sequelize.query(query, {
				type: QueryTypes.SELECT,
			})
			return results
		} catch (error) {
			throw error
		}
	}
}
