'use strict';

const CHARS = "ABCDEFGHiJKLMNOPQRSTUVWXYZ";

/**
 * @returns {string}
 */
function getRandomChar(){
	return CHARS.charAt(Math.floor(Math.random() * CHARS.length))
}

module.exports = {
    getRandomChar: getRandomChar
}