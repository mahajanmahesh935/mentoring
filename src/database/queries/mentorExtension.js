const UserExtension = require('@database/models/index').UserExtension
const MentorExtension = UserExtension.scope('mentors')

const { QueryTypes } = require('sequelize')
const sequelize = require('sequelize')
const Sequelize = require('@database/models/index').sequelize
const common = require('@constants/common')
const _ = require('lodash')
const { Op } = require('sequelize')

module.exports = class MentorExtensionQueries {
	static async getColumns() {
		try {
			return await Object.keys(MentorExtension.rawAttributes)
		} catch (error) {
			return error
		}
	}

	static async getModelName() {
		try {
			return await MentorExtension.name
		} catch (error) {
			return error
		}
	}
	static async getTableName() {
		try {
			return await MentorExtension.tableName
		} catch (error) {
			return error
		}
	}

	static async createMentorExtension(data) {
		try {
			data = { ...data, is_mentor: true }
			return await MentorExtension.create(data, { returning: true })
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	static async updateMentorExtension(userId, data, options = {}, customFilter = {}, unscoped = false) {
		try {
			data = { ...data, is_mentor: true }

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

			const result = unscoped
				? await MentorExtension.unscoped().update(data, {
						where: whereClause,
						...options,
				  })
				: await MentorExtension.update(data, {
						where: whereClause,
						...options,
				  })
			return result
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	static async getMentorExtension(userId, attributes = [], unScoped = false) {
		try {
			const queryOptions = {
				where: { user_id: userId },
				raw: true,
			}

			// If attributes are passed update query
			if (attributes.length > 0) {
				queryOptions.attributes = attributes
			}

			let mentor
			if (unScoped) {
				mentor = await MentorExtension.unscoped().findOne(queryOptions)
			} else {
				mentor = await MentorExtension.findOne(queryOptions)
			}

			return mentor
		} catch (error) {
			throw error
		}
	}

	static async deleteMentorExtension(userId, force = false) {
		try {
			const options = { where: { user_id: userId } }

			if (force) {
				options.force = true
			}

			return await MentorExtension.destroy(options)
		} catch (error) {
			throw error
		}
	}
	static async removeMentorDetails(userId) {
		try {
			return await MentorExtension.update(
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
	static async getMentorsByUserIds(ids, options = {}, unscoped = false) {
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
				? await MentorExtension.unscoped().findAll(query)
				: await MentorExtension.findAll(query)

			return result
		} catch (error) {
			console.log(error)
			throw error
		}
	}

	static async getAllMentors(options = {}) {
		try {
			const result = await MentorExtension.findAll({
				...options,
				returning: true,
				raw: true,
			})

			return result
		} catch (error) {
			throw error
		}
	}

	static async getMentorsByUserIdsFromView(
		ids,
		page = null,
		limit = null,
		filter,
		saasFilter = '',
		additionalProjectionclause = '',
		returnOnlyUserId,
		searchFilter = '',
		searchText,
		defaultFilter = ''
	) {
		try {
			const excludeUserIds = ids.length === 0
			let userFilterClause = excludeUserIds ? '' : `user_id IN (${ids.join(',')})`
			let additionalFilter = ''
			if (searchText) {
				additionalFilter = `AND name ILIKE :search`
			}
			if (Array.isArray(searchText)) {
				additionalFilter = `AND email IN ('${searchText.join("','")}')`
			}
			if (searchFilter.whereClause && searchFilter.whereClause != '') {
				additionalFilter = `${searchFilter.whereClause}`
			}

			const filterClause = filter?.query.length > 0 ? `${filter.query}` : ''

			let saasFilterClause = saasFilter !== '' ? saasFilter : ''
			const defaultFilterClause = defaultFilter != '' ? 'AND ' + defaultFilter : ''

			if (excludeUserIds && filter.query.length === 0) {
				saasFilterClause = saasFilterClause.replace('AND ', '') // Remove "AND" if excludeUserIds is true and filter is empty
			}

			let projectionClause =
				'user_id,rating,meta,mentor_visibility,mentee_visibility,organization_id,designation,area_of_expertise,education_qualification,custom_entity_text,name'

			if (returnOnlyUserId) {
				projectionClause = 'user_id'
			} else if (additionalProjectionclause !== '') {
				projectionClause += `,${additionalProjectionclause}`
			}
			if (userFilterClause && filterClause.length > 0) {
				filterClause = filterClause.startsWith('AND') ? filterClause : 'AND ' + filterClause
			}

			let query = `
				SELECT ${projectionClause}
				FROM
					${common.materializedViewsPrefix + MentorExtension.tableName}
				WHERE
					${userFilterClause}
					${filterClause}
					${saasFilterClause}
					${additionalFilter}
					${defaultFilterClause}
					AND is_mentor = true
			`

			const replacements = {
				...filter.replacements, // Add filter parameters to replacements
				search: `%${searchText}%`,
			}

			if (searchFilter && searchFilter?.sortQuery !== '') {
				query += `
				ORDER BY
					${searchFilter.sortQuery}`
			} else {
				query += `
				ORDER BY
					LOWER(name) ASC`
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

			const mentors = await Sequelize.query(query, {
				type: QueryTypes.SELECT,
				replacements: replacements,
			})

			const countQuery = `
			SELECT count(*) AS "count"
			FROM
				${common.materializedViewsPrefix + MentorExtension.tableName}
			WHERE
				${userFilterClause}
				${filterClause}
				${saasFilterClause}
				${additionalFilter}
				${defaultFilterClause}
				AND is_mentor = true
			;
		`
			const count = await Sequelize.query(countQuery, {
				type: QueryTypes.SELECT,
				replacements: replacements,
			})

			return {
				data: mentors,
				count: Number(count[0].count),
			}
		} catch (error) {
			console.log(error)
			return error
		}
	}

	static async addVisibleToOrg(organizationId, newRelatedOrgs, options = {}) {
		await MentorExtension.update(
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
		return await MentorExtension.update(
			{
				visible_to_organizations: sequelize.literal(`COALESCE("visible_to_organizations", 
										 ARRAY[]::integer[]) || ARRAY[${organizationId}]::integer[]`),
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
		  UPDATE "mentor_extensions"
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
		  UPDATE "mentor_extensions"
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
	static async getMentorExtensions(userIds, attributes = []) {
		try {
			const queryOptions = { where: { user_id: { [Op.in]: userIds } }, raw: true }
			if (attributes.length > 0) {
				queryOptions.attributes = attributes
			}
			const mentors = await MentorExtension.findAll(queryOptions)
			return mentors
		} catch (error) {
			throw error
		}
	}
	static async getMentorsFromView(
		whereClause = '',
		projection = 'user_id,rating,meta,mentor_visibility,mentee_visibility,organization_id,designation,area_of_expertise,education_qualification,custom_entity_text',
		saasFilterClause = ''
	) {
		try {
			// Remove leading "AND" from saasFilterClause if necessary
			if (saasFilterClause.startsWith('AND')) {
				saasFilterClause = saasFilterClause.replace('AND', '')
			}

			// Ensure whereClause includes the is_mentor = true condition
			whereClause = `is_mentor = true${whereClause ? ` AND ${whereClause}` : ''}`

			// Construct the query with the provided whereClause, projection, and saasFilterClause
			let query = `
				SELECT ${projection}
				FROM ${common.materializedViewsPrefix + MentorExtension.tableName}
				WHERE ${whereClause}
				${saasFilterClause}
			`

			// Execute the query
			const mentors = await Sequelize.query(query, {
				type: QueryTypes.SELECT,
			})

			// Count query
			const countQuery = `
				SELECT count(*) AS "count"
				FROM ${common.materializedViewsPrefix + MentorExtension.tableName}
				WHERE ${whereClause}
				${saasFilterClause}
			`

			// Execute the count query
			const count = await Sequelize.query(countQuery, {
				type: QueryTypes.SELECT,
			})

			return {
				data: mentors,
				count: Number(count[0].count),
			}
		} catch (error) {
			return error
		}
	}

	static async findOneFromView(userId) {
		try {
			let query = `
				SELECT *
				FROM ${common.materializedViewsPrefix + MentorExtension.tableName}
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
}
