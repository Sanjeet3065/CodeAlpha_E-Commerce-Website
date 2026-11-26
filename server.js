const { createApp } = require('./src/app');

const PORT = Number(process.env.PORT || 3000);
const { app } = createApp();

app.listen(PORT, () => {
  console.log(`KŌBŌ Store server listening at http://localhost:${PORT}`);
});
