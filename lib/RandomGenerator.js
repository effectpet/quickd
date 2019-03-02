'use strict';

module.exports = class RandomGenerator{

	constructor() {
		this.chars = "ABCDEFGHiJKLMNOPQRSTUVWXYZ";
	}
	
	/**
	 * @param {number} countOfChars 
	 * @returns {string}
	 */
	getRandomString(countOfChars){
		let result = '';
		for (let i = 0; i < countOfChars; i++) {
			result += this.getRandomChar();
		}
	
		return result;
	}

	getRandomChar() {
		return this.chars.charAt(Math.floor(Math.random() * this.chars.length));
	}

};