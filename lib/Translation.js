'use strict';

const fs = require('fs');

const LanguageToFile = {
	DE:'lang/de.json',
	EN:'lang/en.json'
};

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

		let file = LanguageToFile[language];
		if (typeof file === 'undefined') {
			console.error(`Using EN as language cause '${language}' was not a vaild key`);
			file = LanguageToFile.EN;
		}

		this.translationMap = new Map(Object.entries(JSON.parse(fs.readFileSync(file, 'utf8'))));
	}
};