const {BlazingContext} = require('@rapidsai/blazingsql');

const bc = new BlazingContext();
bc.createTableCSV('test_table', [`${__dirname}/wikipedia_pages.csv`]);

const df = bc.sql('SELECT * FROM test_table');

// df.names.forEach((n) => { console.log([...df.get(n)]); });
