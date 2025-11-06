require('dotenv').config();
const express = require('express');
const cors = require('cors');

const ALLOWED_ORIGINS = [
  'http://127.0.0.1:5501',
  'http://localhost:5501',   // add if you sometimes use localhost
  'http://localhost:5173',
  'https://supportingsoulss.netlify.app',
  'https://supportingsouls.vercel.app',
  'https://supportingsouls.vercel.app/final_index_s_img_hidden_verified.html'
   // add any other dev origins you use
];

const app = express();
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true
}));
app.use(express.json());
app.get('/health', (req,res)=>res.json({ok:true}));

app.use('/auth', require('./routes/auth'));

app.use((req,res)=>res.status(404).json({error:'Not Found'}));

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  const publicUrl =
    process.env.PUBLIC_URL || // <- set this to your final HTTPS domain if you have one
    (process.env.VERCEL_URL && `https://supportingsouls.vercel.app`) || // (only if you really run Express on Vercel)
    `http://localhost:${PORT}` || (process.env.VERCEL_URL && `https://supportingsouls.vercel.app/final_index_s_img_hidden_verified.html`);

  console.log(`API listening at ${publicUrl}`);
});