const common = require('@constants/common')
const defaultRuleQueries = require('@database/queries/defaultRule')
const entityTypeQueries = require('@database/queries/entityType')
const mentorExtensionQueries = require('@database/queries/mentorExtension')
const menteeExtensionQueries = require('@database/queries/userExtension')
const sessionQueries = require('@database/queries/sessions')
const { getDefaultOrgId } = require('@helpers/getDefaultOrgId')
const responses = require('@helpers/responses')
const httpStatusCode = require('@generics/http-status')
const { Op } = require('sequelize')
const { UniqueConstraintError } = require('sequelize')

module.exports = class DefaultRuleHelper {
	/**
	 * Validates the target and requester fields in the body data.
	 *
	 * @param {string} defaultOrgId - The ID of the default organization.
	 * @param {Object} bodyData - The data to be validated.
	 * @param {string} bodyData.type - The type of the rule.
	 * @param {boolean} bodyData.is_target_from_sessions_mentor - Whether the target is from sessions mentor.
	 * @param {string} bodyData.target_field - The target field to be validated.
	 * @param {string} bodyData.requester_field - The requester field to be validated.
	 *
	 * @returns {Promise<Object>} A promise that resolves to an object indicating the validation result.
	 * The object contains a boolean `isValid` indicating if the validation passed and an array `errors` with the validation errors if any.
	 */
	static async validateFields(defaultOrgId, bodyData) {
		const modelName =
			bodyData.type === common.DEFAULT_RULES.SESSION_TYPE && !bodyData.is_target_from_sessions_mentor
				? await sessionQueries.getModelName()
				: await mentorExtensionQueries.getModelName()

		const [validTargeField, validRequesterField] = await Promise.all([
			entityTypeQueries.findAllEntityTypes(defaultOrgId, ['id'], {
				status: 'ACTIVE',
				organization_id: defaultOrgId,
				value: bodyData.target_field,
				model_names: { [Op.contains]: [modelName] },
			}),
			entityTypeQueries.findAllEntityTypes(defaultOrgId, ['id'], {
				status: 'ACTIVE',
				organization_id: defaultOrgId,
				value: bodyData.requester_field,
				model_names: {
					[Op.contains]: [
						await mentorExtensionQueries.getModelName(),
						await menteeExtensionQueries.getModelName(),
					],
				},
			}),
		])

		const errors = []

		if (validTargeField.length === 0) {
			errors.push({
				param: 'target_field',
				msg: `Invalid target_field`,
			})
		}

		if (validRequesterField.length === 0) {
			errors.push({
				param: 'requester_field',
				msg: `Invalid requester_field`,
			})
		}

		if (errors.length !== 0) {
			return {
				isValid: false,
				errors,
			}
		}

		return {
			isValid: true,
		}
	}

	/**
	 * Create default rule.
	 * @method
	 * @name create
	 * @param {Object} bodyData - Default rule body data.
	 * @param {String} userId - User ID creating the rule.
	 * @param {String} orgId - Org Id of the user.
	 * @returns {Promise<JSON>} - Created default rule response.
	 */
	static async create(bodyData, userId, orgId) {
		bodyData.created_by = userId
		bodyData.updated_by = userId
		bodyData.organization_id = orgId

		try {
			const defaultOrgId = await getDefaultOrgId()

			const validation = await validateFields(defaultOrgId, bodyData)

			if (!validation.isValid) {
				return responses.failureResponse({
					message: 'VALIDATION_FAILED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
					result: validation.errors,
				})
			}

			const defaultRule = await defaultRuleQueries.create(bodyData)
			return responses.successResponse({
				statusCode: httpStatusCode.created,
				message: 'DEFAULT_RULE_CREATED_SUCCESSFULLY',
				result: defaultRule,
			})
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return responses.failureResponse({
					message: 'DEFAULT_RULE_ALREADY_EXISTS',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			throw error
		}
	}

	/**
	 * Update default rule.
	 * @method
	 * @name update
	 * @param {Object} bodyData - Body data to update.
	 * @param {String} ruleId - Default rule ID.
	 * @param {String} userId - User ID updating the rule.
	 * @param {String} orgId - Org Id of the user.
	 * @returns {Promise<JSON>} - Updated default rule response.
	 */
	static async update(bodyData, ruleId, userId, orgId) {
		bodyData.updated_by = userId
		bodyData.organization_id = orgId

		try {
			const defaultOrgId = await getDefaultOrgId()

			const validation = await validateFields(defaultOrgId, bodyData)

			if (!validation.isValid) {
				return responses.failureResponse({
					message: 'VALIDATION_FAILED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
					result: validation.errors,
				})
			}

			const [updateCount, updatedDefaultRule] = await defaultRuleQueries.updateOne(
				{ id: ruleId, organization_id: orgId },
				bodyData,
				{
					returning: true,
					raw: true,
				}
			)

			if (updateCount === 0) {
				return responses.failureResponse({
					message: 'DEFAULT_RULE_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			return responses.successResponse({
				statusCode: httpStatusCode.accepted,
				message: 'DEFAULT_RULE_UPDATED_SUCCESSFULLY',
				result: updatedDefaultRule,
			})
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return responses.failureResponse({
					message: 'DEFAULT_RULE_ALREADY_EXISTS',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			throw error
		}
	}

	/**
	 * Read all default rules.
	 * @method
	 * @name readAll
	 * @param {String} orgId - Org Id of the user.
	 * @returns {Promise<JSON>} - Found default rules response.
	 */
	static async readAll(orgId) {
		try {
			const defaultRules = await defaultRuleQueries.findAndCountAll({ organization_id: orgId })

			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'DEFAULT_RULES_FETCHED_SUCCESSFULLY',
				result: {
					data: defaultRules.rows,
					count: defaultRules.count,
				},
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Read a single default rule by ID.
	 * @method
	 * @name readOne
	 * @param {String} ruleId - Default rule ID.
	 * @param {String} orgId - Org Id of the user.
	 * @returns {Promise<JSON>} - Found default rule response.
	 */
	static async readOne(ruleId, orgId) {
		try {
			const defaultRule = await defaultRuleQueries.findOne({ id: ruleId, organization_id: orgId })
			if (!defaultRule) {
				return responses.failureResponse({
					message: 'DEFAULT_RULE_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			return responses.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'DEFAULT_RULE_FETCHED_SUCCESSFULLY',
				result: defaultRule,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Delete default rule.
	 * @method
	 * @name delete
	 * @param {String} ruleId - Default rule ID.
	 * @param {String} orgId - Org Id of the user.
	 * @returns {Promise<JSON>} - Default rule deleted response.
	 */
	static async delete(ruleId, orgId) {
		try {
			const deleteCount = await defaultRuleQueries.deleteOne({ id: ruleId, organization_id: orgId })
			if (deleteCount === 0) {
				return responses.failureResponse({
					message: 'DEFAULT_RULE_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			return responses.successResponse({
				statusCode: httpStatusCode.accepted,
				message: 'DEFAULT_RULE_DELETED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}
}
