'use strict';

const Config = require('./Config');
const Markdown = require('./Markdown');

module.exports = class Command {

	/**
	 * @param {string} name 
	 * @param {string} args 
	 * @param {string} description 
	 * @param {(message: any, args: string[]) => void} functionToCall 
	 */
	constructor(name, args, description, functionToCall) {
		this.name = name;
		this.args = args;
		this.description = description;
		this.functionToCall = functionToCall;

		this.markdown = new Markdown();
	}

	toString() {
		let usage = `${Config.getPrefix()} ${this.name} ${this.args}`;
		return `${this.markdown.markdownCode(usage)} - ${this.description}`;
	}

};