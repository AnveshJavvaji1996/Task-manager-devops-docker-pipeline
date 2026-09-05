const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//This is the server of the application. It imports the Express app from app.js and starts listening on a specified port. The port can be set using an environment variable, or it defaults to 3000 if not provided. 
// When the server starts, it logs a message indicating that it's running and on which port.  