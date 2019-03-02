'use strict';

require('dotenv').config();

module.exports = class Config {

	static getPrefix() {
		return process.env.PREFIX || '!qd';
	}

	static getLanguage() {
		return process.env.LANGUAGE || 'EN';
	}

	static getToken() {
		return process.env.TOKEN;
	}

};