const Markdown = require('./Markdown');

module.exports = class Command {

	/**
	 * @param {string} prefix
	 * @param {string} name
	 * @param {string} args
	 * @param {string} description
	 * @param {(message: any, args: string[]) => void} functionToCall
	 */
	constructor(prefix, name, args, description, functionToCall) {
		this.prefix = prefix;
		this.name = name;
		this.args = args;
		this.description = description;
		this.functionToCall = functionToCall;

		this.markdown = new Markdown();
	}

	/**
	 * @returns {string}
	 */
	toString() {
		const usage = `${this.prefix} ${this.name} ${this.args}`;

		return `${this.markdown.markdownCode(usage)} - ${this.description}`;
	}

};