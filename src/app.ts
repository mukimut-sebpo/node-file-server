import express from 'express';
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('It works on ' + port);
});

app.get('/:location', (req, res) => {
    res.send('path is ' + req.params.location);
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});

function trace(t) {console.log(t)}