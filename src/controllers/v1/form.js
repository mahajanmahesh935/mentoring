/**
 * name : form.js
 * author : Aman Gupta
 * created-date : 04-Nov-2021
 * Description : Form Controller.
 */

// Dependencies
const formsHelper = require('@services/form')

module.exports = class Form {
	/**
	 * create mentoring form
	 * @method
	 * @name create
	 * @param {Object} req -request data.
	 * @returns {JSON} - forms creation object.
	 */

	async create(req) {
		const params = req.body
		try {
			const createdForm = await formsHelper.create(params)
			return createdForm
		} catch (error) {
			return error
		}
	}

	/**
	 * updates mentoring form
	 * @method
	 * @name update
	 * @param {Object} req - request data.
	 * @returns {JSON} - forms updation response.
	 */

	async update(req) {
		const params = req.body
		try {
			const updatedForm = await formsHelper.update(req.params.id, params)
			return updatedForm
		} catch (error) {
			return error
		}
	}

	/**
	 * reads mentoring form
	 * @method
	 * @name read
	 * @param {Object} req -request data.
	 * @returns {JSON} - form object.
	 */

	async read(req) {
		const params = req.body
		try {
			if (!req.params.id && Object.keys(req.body).length === 0) {
				const form = await formsHelper.readAllFormsVersion()
				return form
			} else {
				const form = await formsHelper.read(req.params.id, params)
				return form
			}
		} catch (error) {
			return error
		}
	}
}
