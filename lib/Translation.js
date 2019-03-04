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
		if (this.translationMap.has(key)) {
			return this.translationMap.get(key);
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
		for (let [key, value] of Object.entries(args)) {
			translated = translated.replace('{{' + key + '}}', value);
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

		this.translationMap = new Map(Object.entries(JSON.parse(content)));
	}

	getGermanLanguageFile() {
		return fs.readFileSync('lang/de.json', 'utf8');
	}

	getEnglishLanguageFile() {
		return fs.readFileSync('lang/en.json', 'utf8');
	}
};