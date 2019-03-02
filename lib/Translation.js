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
		if (key in this.translationJson) {
			return this.translationJson[key];
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
			if ({}.hasOwnProperty.call(args, key)) {
				translated = translated.replace('{{' + key + '}}', args[key]);
			}
		}

		return translated;
	}

	/**
	 * @param {string} language 
	 */
	setLanguage(language) {
		this.language = language;

		let content = '';

		switch (language) {
			case 'DE': 
				content = this.getGermanLanguageFile();
				break;
			case 'EN': 
				content = this.getEnglishLanguageFile();
				break;
			default:
				console.error('No language.json for ', language);
				content = this.getEnglishLanguageFile();
				break;
		}

		this.translationJson = JSON.parse(content);
	}

	getGermanLanguageFile() {
		return fs.readFileSync('lang/de.json', 'utf8');
	}

	getEnglishLanguageFile() {
		return fs.readFileSync('lang/en.json', 'utf8');
	}
};