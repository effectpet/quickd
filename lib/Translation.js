'use strict';

const fs = require('fs');

module.exports = class Translation {

	constructor(language) {
		this.setLanguage(language);
	}

	/**
	 * translate
	 * @param {string} key 
	 * @returns {string}
	 */
	t(key) {
		let translated = this.translationJson[key];
		if (typeof translated !== 'undefined') {
			return translated;
		} else {
			console.error('Translation error occured: ', key);

			return key;
		}
	}

	/**
	 * format and translate
	 * @param {string} key 
	 * @param {any} args
	 * @returns {string}
	 */
	f(key, args) {
		let translated = this.t(key);
		for (let key in args) {
			let value = args[key];
			translated = translated.replace(new RegExp('{{' + key + '}}', 'g'), value);
		}

		return translated;
	}

	/**
	 * @param {string} language 
	 */
	setLanguage(language) {
		this.language = language;
		this.translationJson = JSON.parse(fs.readFileSync(`lang/${language}.json`, 'utf8'));
	}
}