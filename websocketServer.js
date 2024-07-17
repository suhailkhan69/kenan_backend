const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let clients = [];

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.type === 'register' && parsedMessage.patientId) {
      ws.patientId = parsedMessage.patientId;
      clients.push(ws);
    }
  });

  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
  });
});

const notifyPatient = (patientId) => {
  clients.forEach((client) => {
    if (client.patientId === patientId) {
      client.send(JSON.stringify({ status: 'consultation_started' }));
    }
  });
};

module.exports = { notifyPatient };
