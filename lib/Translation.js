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

		const LanguageToFile = {
			DE:'lang/de.json',
			EN:'lang/en.json'
		};

		let file = LanguageToFile[language];

		this.translationJson = JSON.parse(fs.readFileSync(file, 'utf8'));
	}

};