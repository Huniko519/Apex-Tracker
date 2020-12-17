require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts');
const { getStats } = require('./utils');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const APEX_URL = process.env.APEX_URL;

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());
app.use(cors());
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Routes
app.get('/', (_, res) => {
  res.render('landing');
})
app.post('/', async (req, res) => {
  const { platform, gamertag } = req.body;
  const headers = {
    ['TRN-Api-Key']: API_KEY
  };

  try {
    const response = await fetch(APEX_URL + `${platform}/${gamertag}`, { headers });
    const json = await response.json();

    if (response.status === 200) {
      const { platformInfo: { platformSlug: platform, platformUserId: gamertag, avatarUrl }, userInfo: { countryCode }, segments: [overview, ...legendStats] } = json.data;

      const gamerInfos = {
        platform, gamertag, avatarUrl, countryCode
      };
      const overviewData = getStats(overview.stats);
      const legendsData = legendStats.map(legend => {
        const { name, bgImageUrl: imgCover, isActive } = legend.metadata;
        return { info: { name, imgCover, isActive }, stats: getStats(legend.stats) };
      }).filter(legend => {
        return (legend.info.name !== 'Unknown')
      });

      switch (gamerInfos.platform) {
        case "psn":
          gamerInfos.platform = "PS4";
          break;
        case "xbl":
          gamerInfos.platform = "XBOX ONE";
          break;
        case "origin":
          gamerInfos.platform = "PC";
          break;
        default:
          break;
      }

      res.render('resultsPlayer', { gamerInfos, legendsData, overviewData });

    } else if (response.status === 404) {
      res.render('notification', { notifications: json.errors });
    } else {
      res.send(json);
    }

  } catch (err) {
    console.log(err);
    res.status(500).json({
      errors: [{
        code: "Server error",
        message: "Server could not fetch the url."
      }]
    });
  }

});

app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}.`);
});