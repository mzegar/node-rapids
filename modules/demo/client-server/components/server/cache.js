// Copyright (c) 2021, NVIDIA CORPORATION.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const fs = require('fs/promises');
const { DataFrame, Series, Uint32 } = require('@rapidsai/cudf');
const { Field, Vector, Float32, List } = require('apache-arrow');
const path = require('path');

module.exports = () => {
  let timeout = null;
  let datasets = {
    uber: null,
    mortgage: null
  }
  // let uberTracts = null;

  function clearCachedGPUData() {
    datasets.uber = null;
    datasets.mortgage = null;
  }

  return async function loadDataMiddleware(datasetName, req, res, next) {
    if (timeout) { clearTimeout(timeout); }

    // Set a 10-minute debounce to release server GPU memory
    timeout = setTimeout(clearCachedGPUData, 10 * 60 * 1000);

    req[datasetName] = datasets[datasetName] || (datasets[datasetName] = await readDataset(datasets, datasetName));

    next();
  }
}

async function readDataset(datasets, datasetName) {
  if (datasetName == "uber") {
    //clear mortgage dataset from mem
    datasets.mortgage = null;
    return readUberTrips();
  }
  if (datasetName == "mortgage") {
    //clear uber dataset from mem
    datasets.uber = null;
    return readMortgageData();
  }
}

async function readUberTrips() {
  const trips = DataFrame.readCSV({
    header: 0,
    sourceType: 'files',
    sources: [path.resolve('./public', 'data/san_fran_uber.csv')],
    dataTypes: {
      sourceid: 'int16',
      dstid: 'int16',
      month: 'int8',
      day: 'int8',
      start_hour: 'int8',
      end_hour: 'int8',
      travel_time: 'float32'
    }
  });
  return new DataFrame({
    // TODO: do we want to add our own indices?
    // id: Series.sequence({ type: new Uint32, init: 0, size: trips.numRows }),
    sourceid: trips.get('sourceid'),
    dstid: trips.get('dstid'),
    month: trips.get('month'),
    day: trips.get('day'),
    start_hour: trips.get('start_hour'),
    end_hour: trips.get('end_hour'),
    travel_time: trips.get('travel_time'),
  });
}

async function readMortgageData() {
  const mortgage = DataFrame.readCSV({
    header: 0,
    sourceType: 'files',
    sources: [path.resolve('./public', 'data/mortgage.csv')],
    dataTypes: {
      index: 'int16',
      zip: 'int32',
      dti: 'float32',
      current_actual_upb: 'float32',
      borrower_credit_score: 'int16',
      load_id: 'int32',
      delinquency_12_prediction: 'float32',
      seller_name: 'int16'
    }
  });
  return new DataFrame({
    // TODO: do we want to add our own indices?
    // id: Series.sequence({ type: new Uint32, init: 0, size: trips.numRows }),
    zip: mortgage.get('zip'),
    dti: mortgage.get('dti'),
    current_actual_upb: mortgage.get('current_actual_upb'),
    borrower_credit_score: mortgage.get('borrower_credit_score'),
    load_id: mortgage.get('load_id'),
    delinquency_12_prediction: mortgage.get('delinquency_12_prediction'),
    seller_name: mortgage.get('seller_name'),
  });
}

async function readUberTracts() {

  const { features } = JSON.parse(await fs.readFile(
    'public/data/san_francisco_censustracts.geojson',
    { encoding: 'utf8' }
  ));

  const polygons = features
    .filter((f) => f.geometry.type === 'MultiPolygon')
    .reduce((x, { geometry }) => x.concat(geometry.coordinates), []);

  return new DataFrame({
    id: Series.sequence({ type: new Uint32, init: 0, size: polygons.length }),
    polygons: Series.new(featureToVector(polygons))
  });

  function featureToVector(coordinates) {
    return Vector.from({
      values: coordinates,
      highWaterMark: Number.POSITIVE_INFINITY,
      type: new List(Field.new({
        name: 'rings', type: new List(Field.new({
          name: 'coords', type: new List(Field.new({
            name: 'points', type: new Float32()
          }))
        }))
      })),
    });
  }
}
