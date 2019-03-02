'use strict';


module.exports = class Markdown {
    /**
     * Sorrounds a string with '`'
     
    ```javascript
    wrap('hey') // returns '`hey`' 
    ```

    */
    markdownCode(str) {
        return str ? '`' + str + '`' : '`<leer>`';
    }
}