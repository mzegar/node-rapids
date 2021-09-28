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

export function cudfTypeToCsvType(cudfType: number) {
  switch (cudfType) {
    case 1: return 'int8';
    case 2: return 'int16';
    case 3: return 'int32';
    case 4: return 'int64';
    case 5: return 'uint8';
    case 6: return 'uint16';
    case 7: return 'uint32';
    case 8: return 'uint64';
    case 9: return 'float32';
    case 10: return 'float64';
    case 11: return 'boolean';
    case 12: return 'date32';
    case 13: return 'timestamp[s]';
    case 14: return 'timestamp[ms]';
    case 15: return 'timestamp[us]';
    case 16: return 'timestamp[ns]';
    case 17: return 'timedelta[D]';
    case 18: return 'timedelta64[s]';
    case 19: return 'timedelta64[ms]';
    case 20: return 'timedelta64[us]';
    case 21: return 'timedelta64[ns]';
    case 23: return 'str';
    case 26: return 'decimal64';
  }
  return '';
}

export class BlazingTable {
  // TODO: Might not need some of these. Init from constructor.
  private name: string;
  private input: string[];
  private files: string[];
  private fileType: number;
  // @ts-ignore TODO remove this.
  private dataSource: string[];
  private calciteToFilesIndicies: number[];
  public args: Record<string, unknown>;
  private uriValues: any[];
  private inFile: any[];
  public localFiles: boolean;
  private mappingFiles: Record<string, unknown>;

  public slices: unknown;
  public metadata: unknown;
  public rowGroupsIds: number[];
  public offset: unknown;
  public columnNames: string[];
  public columnTypes: number[];
  public fileColumnNames: string[];

  constructor(name: string,
              input: string[],
              filetype: number,
              dataSource: string[]                  = [],
              calciteToFilesIndicies: number[]      = [],
              args: Record<string, unknown>         = {},
              uriValues: any[]                      = [],
              inFile: any[]                         = [],
              localFiles                            = false,
              mappingFiles: Record<string, unknown> = {}) {
    this.name     = name;
    this.fileType = filetype;
    this.input    = input;

    this.calciteToFilesIndicies = calciteToFilesIndicies;
    this.files                  = input;

    this.localFiles   = localFiles;
    this.mappingFiles = mappingFiles;

    this.dataSource = dataSource;

    this.args      = args;
    this.uriValues = uriValues;
    this.inFile    = inFile;

    this.slices       = undefined;
    this.metadata     = undefined;
    this.rowGroupsIds = [];
    this.offset       = [];

    this.columnNames = [];
    this.columnTypes = [];

    this.fileColumnNames = this.columnNames;
  }

  getSlices(numSlices: number) {
    const nodeFilesList = [];
    if (this.files.length == 0) {
      for (let i = 0; i < numSlices; ++i) {
        const bt       = new BlazingTable(this.name, this.input, this.fileType, [], [], this.args);
        bt.columnNames = this.columnNames;
        bt.columnTypes = this.columnTypes;
        nodeFilesList.push(bt);
      }
      return nodeFilesList;
    }
    let remaining  = this.files.length;
    let startIndex = 0;
    for (let i = 0; i < numSlices; ++i) {
      const batchSize = ~~(remaining / (numSlices - 1));  // drop any decimals
      const tempFiles = this.files.slice(startIndex, startIndex + batchSize);
      const uriValues = this.uriValues.slice(startIndex, startIndex + batchSize);

      let sliceRowGroupIds: any[] = [];
      if (this.rowGroupsIds.length !== 0) {
        sliceRowGroupIds = this.rowGroupsIds.slice(startIndex, startIndex + batchSize);
      }

      const bt           = new BlazingTable(this.name,
                                  this.input,
                                  this.fileType,
                                  tempFiles,
                                  this.calciteToFilesIndicies,
                                  this.args,
                                  uriValues,
                                  this.inFile,
                                  false,
                                  {});
      bt.rowGroupsIds    = sliceRowGroupIds;
      bt.offset          = [startIndex, batchSize];  // TODO: tuple
      bt.columnNames     = this.columnNames;
      bt.fileColumnNames = this.fileColumnNames;
      bt.columnTypes     = this.columnTypes;
      nodeFilesList.push(bt);

      startIndex = startIndex + batchSize;
      remaining  = remaining - batchSize;
    }

    return nodeFilesList;
  }

  getSlicesByWorker(numSlices: number) {
    const nodeFilesList = [];
    if (this.files.length === 0) {
      for (let i = 0; i < numSlices; ++i) {
        nodeFilesList.push(new BlazingTable(this.name, this.input, this.fileType));
      }
      return nodeFilesList;
    }

    let offsetX = 0;
    for (const [_, value] of Object.entries(this.mappingFiles)) {
      const bt           = new BlazingTable(this.name,
                                  this.input,
                                  this.fileType,
                                  value as string[],
                                  this.calciteToFilesIndicies,
                                  this.args,
                                  this.uriValues,
                                  this.inFile,
                                  false,
                                  {});
      bt.offset          = [offsetX, (value as string[]).length];
      offsetX            = offsetX + (value as string[]).length;
      bt.columnNames     = this.columnNames;
      bt.fileColumnNames = this.fileColumnNames;
      bt.columnTypes     = this.columnTypes;
      nodeFilesList.push(bt);
    }
    return nodeFilesList;
  }
}
