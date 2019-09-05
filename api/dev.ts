import express from 'express';
import api from './send';

const app = express();

app.get('/send', api);

const { PORT = 5000 } = process.env;

const startServer = () => {
  app.listen(PORT, async () => {
    console.log(`Server started at http://localhost:${PORT}`);
  });
};

startServer();
process.on('uncaughtException', console.log);