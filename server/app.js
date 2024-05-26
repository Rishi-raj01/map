const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const { extractGPSDataFromCSV } = require('./extracter');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const upload = multer({ dest: 'uploads/' });

const detectStoppages = (gpsData, threshold) => {
  let stoppages = [];
  let currentStoppage = null;

  for (let i = 1; i < gpsData.length; i++) {
    const previous = gpsData[i - 1];
    const current = gpsData[i];
    const timeDiff = (new Date(current.timestamp) - new Date(previous.timestamp)) / 60000; // in minutes

    if (previous.latitude === current.latitude && previous.longitude === current.longitude) {
      if (currentStoppage) {
        currentStoppage.endTime = current.timestamp;
        currentStoppage.duration += timeDiff;
      } else {
        currentStoppage = {
          reachTime: previous.timestamp,
          endTime: current.timestamp,
          duration: timeDiff,
          location: {
            latitude: previous.latitude,
            longitude: previous.longitude
          }
        };
      }
    } else {
      if (currentStoppage && currentStoppage.duration >= threshold) {
        stoppages.push(currentStoppage);
      }
      currentStoppage = null;
    }
  }

  if (currentStoppage && currentStoppage.duration >= threshold) {
    stoppages.push(currentStoppage);
  }

  return stoppages;
};

app.post('/process-csv', upload.single('file'), async (req, res) => {
  try {
    const { threshold } = req.body;
    const csvPath = req.file.path;

    const gpsData = await extractGPSDataFromCSV(csvPath);
    const stoppages = detectStoppages(gpsData, threshold);

    res.json({ message: 'Data processed successfully', gpsData, stoppages });
  } catch (error) {
    console.error('Error processing CSV data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
