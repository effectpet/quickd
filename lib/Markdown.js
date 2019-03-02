'use strict';

module.exports = class Markdown {

	markdownCode(str) {
		return str ? '`' + str + '`' : '`<leer>`';
	}

};