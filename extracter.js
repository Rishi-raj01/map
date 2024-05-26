


const fs = require('fs');
const csv = require('csv-parser');
const moment = require('moment');

const extractGPSDataFromCSV = async (csvPath) => {
  try {
    const gpsData = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
         // console.log('CSV Row:', row); // Log each row for debugging
          const latitude = parseFloat(row.latitude);
          const longitude = parseFloat(row.longitude);
          const eventGeneratedTime = new Date(parseInt(row.eventGeneratedTime));

          if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(eventGeneratedTime.getTime())) {
            gpsData.push({
              timestamp: eventGeneratedTime,
              latitude,
              longitude,
            });
          } else {
            console.warn(`Invalid data: ${JSON.stringify(row)}`);
          }
        })
        .on('end', () => {
         // console.log('Parsed GPS data:', gpsData); // Log parsed GPS data
          resolve(gpsData);
        })
        .on('error', (error) => {
          console.error('Error reading CSV file:', error);
          reject(error);
        });
    });
  } catch (error) {
    console.error('Error extracting GPS data from CSV:', error);
    throw error;
  }
};

module.exports = {
  extractGPSDataFromCSV,
};
