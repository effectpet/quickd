require('dotenv').config();

const App = require('./lib/App');

const app = new App();
app.run(process.env.TOKEN);
