import express from 'express';
import api from '../api/send';

const app = express();

app.get('/send', api);

const { PORT = 3000 } = process.env;

const startServer = () => {
  app.listen(PORT, async () => {
    console.log(`Server started at http://localhost:${PORT}`);
  });
};

startServer();
process.on('uncaughtException', console.log);
