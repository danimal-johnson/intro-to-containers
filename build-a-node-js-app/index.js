const http = require("http");

// Node ignores the the system's termination request.
// use process.on('SIGTERM')... to be able to ^C to exit.

http
  .createServer((req,res) => {
    console.log('request received');
    res.end('omg hi', 'utf-8');
  })
  .listen(3000);
  console.log('server started');