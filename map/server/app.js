

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { extractGPSDataFromCSV } = require('./extracter'); // Ensure this is correctly implemented

const app = express();
app.use(bodyParser.json());
app.use(cors());

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

const csvPath = 'C:/Users/rishi/OneDrive/Desktop/map/Assignment Gps Data- convertcsv.csv.csv'; // Update path to your CSV file

app.post('/process-csv', async (req, res) => {
  try {
    const { threshold } = req.body;

    const gpsData = await extractGPSDataFromCSV(csvPath); // Use csvPath directly
    console.log("gpsdata is", gpsData);

    const stoppages = detectStoppages(gpsData, threshold);
    console.log("stoppage detected");
    console.log(stoppages);

    res.json({ message: 'Data processed successfully', gpsData, stoppages });
  } catch (error) {
    console.error('Error processing CSV data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
