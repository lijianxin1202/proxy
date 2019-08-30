const http = require('http');
const httpProxy = require('http-proxy');
const net = require('net');

const proxy = httpProxy.createProxyServer();
const config = require('./config');
const options = {
  target: `http://${config.target}`,
  headers: { referer: `http://${config.target}` },
};

const server = http.createServer(function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  proxy.web(req, res, options);
});

// ws-incomming connections (local only)
server.on('upgrade', (req, socket, head) => {
  if (req.url.indexOf('/api/ws') !== 0) {
    proxy.ws(req, socket, head, { target: `http://${config.target}` });
  }
});

// web-incomming error, dev & prod
proxy.on('error', (err, req, res, url) => {
  if (!(res instanceof http.ServerResponse)) {
    return;
  }
  console.error(err, 'proxy error');

  res.writeHead(502);
  res.end(
    JSON.stringify({
      msg: `request to ${url.href} failed, reason: ${err.message}`,
    })
  );
});

// ws-incomming error, dev only
proxy.on('error', (err, req, socket) => {
  if (!(socket instanceof net.Socket)) {
    return;
  }
  console.error(err, 'websocket error');
  socket.destroy();
});

function getProxyBackend(req) {
  // const xmsAuthToken = req.headers['xms-auth-token'];

  // // local request
  // if (xmsAuthToken) {
  //   return {
  //     target: `http://${config.target}`,
  //     headers: {
  //       token: xmsAuthToken,
  //     },
  //   };
  // }

  // login request, which doesn't provide any token header
  return {
    target: `http://${config.target}`,
  };
}

server.listen(5000);
