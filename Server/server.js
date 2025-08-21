const http = require('http');
const app = require('./index');


const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});
