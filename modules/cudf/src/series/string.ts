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

import {MemoryResource} from '@rapidsai/rmm';
import * as arrow from 'apache-arrow';
import {Column} from '../column';

import {Series} from '../series';
import {Bool8, Categorical, DataType, Int32, Uint8, Utf8String} from '../types/dtypes';

/**
 * A Series of utf8-string values in GPU memory.
 */
export class StringSeries extends Series<Utf8String> {
  /**
   * Casts the values to a new dtype (similar to `static_cast` in C++).
   *
   * @param type The new dtype.
   * @param memoryResource The optional MemoryResource used to allocate the result Series's device
   *   memory.
   * @returns Series of same size as the current Series containing result of the `cast` operation.
   */
  cast<R extends DataType>(type: R, memoryResource?: MemoryResource): Series<R> {
    if (this.type.compareTo(type)) { return Series.new<R>(this._col as Column<R>); }
    if (arrow.DataType.isDictionary(type)) {
      const vals = this.cast(type.dictionary).unique(true, memoryResource);
      const keys = this.encodeLabels(vals, undefined, undefined, memoryResource);
      return Series.new<R>(new Column({
        type: new Categorical(type.dictionary) as R,
        length: keys.length,
        nullMask: this.mask,
        children: [keys._col, vals._col]
      }));
    }
    throw new Error(
      `Cast from ${arrow.Type[this.type.typeId]} to ${arrow.Type[type.typeId]} not implemented`);
  }

  /**
   * Return a value at the specified index to host memory
   *
   * @param index the index in this Series to return a value for
   *
   * @example
   * ```typescript
   * import {Series} from "@rapidsai/cudf";
   *
   * // StringSeries
   * Series.new(["foo", "bar", "test"]).getValue(0) // "foo"
   * Series.new(["foo", "bar", "test"]).getValue(2) // "test"
   * Series.new(["foo", "bar", "test"]).getValue(3) // throws index out of bounds error
   * ```
   */
  getValue(index: number) { return this._col.getValue(index); }

  /**
   * set value at the specified index
   *
   * @param index the index in this Series to set a value for
   * @param value the value to set at `index`
   *
   * @example
   * ```typescript
   * import {Series} from "@rapidsai/cudf";
   *
   * // StringSeries
   * const a = Series.new(["foo", "bar", "test"])
   * a.setValue(2, "test1") // inplace update -> Series(["foo", "bar", "test1"])
   * ```
   */
  setValue(index: number, value: string): void { this._col = this.scatter(value, [index])._col; }

  /**
   * Series of integer offsets for each string
   * @example
   * ```typescript
   * import {Series} from '@rapidsai/cudf';
   * const a = Series.new(["foo", "bar"]);
   *
   * a.offsets // Int32Array(3) [ 0, 3, 6 ]
   * ```
   */
  // TODO: Account for this.offset
  get offsets() { return Series.new(this._col.getChild<Int32>(0)); }

  /**
   * Series containing the utf8 characters of each string
   * @example
   * ```typescript
   * import {Series} from '@rapidsai/cudf';
   * const a = Series.new(["foo", "bar"]);
   *
   * a.data // Uint8Array(6) [ 102, 111, 111, 98, 97, 114 ]
   * ```
   */
  // TODO: Account for this.offset
  get data() { return Series.new(this._col.getChild<Uint8>(1)); }

  /**
   * Concat a StringSeries to the end of the caller, returning a new StringSeries.
   *
   * @param other The StringSeries to concat to the end of the caller.
   *
   * @example
   * ```typescript
   * import {Series} from '@rapidsai/cudf';
   *
   * Series.new(["foo"]).concat(Series.new(["bar"])) // ["foo", "bar"]
   * ```
   */
  concat(other: Series<Utf8String>, memoryResource?: MemoryResource): Series<Utf8String> {
    return this.__construct(this._col.concat(other._col, memoryResource));
  }

  /**
   * Returns a boolean series identifying rows which match the given regex pattern.
   *
   * @param pattern Regex pattern to match to each string.
   * @param memoryResource The optional MemoryResource used to allocate the result Series's device
   *   memory.
   *
   * The regex pattern strings accepted are described here:
   *
   * https://docs.rapids.ai/api/libcudf/stable/md_regex.html
   *
   * A RegExp may also be passed, however all flags are ignored (only `pattern.source` is used)
   *
   * @example
   * ```typescript
   * import {Series} from '@rapidsai/cudf';
   * const a = Series.new(['Finland','Colombia','Florida', 'Russia','france']);
   *
   * // items starting with F (only upper case)
   * a.containsRe(/^F/) // [true, false, true, false, false]
   * // items starting with F or f
   * a.containsRe(/^[Ff]/) // [true, false, true, false, true]
   * // items ending with a
   * a.containsRe("a$") // [false, true, true, true, false]
   * // items containing "us"
   * a.containsRe("us") // [false, false, false, true, false]
   * ```
   */
  containsRe(pattern: string|RegExp, memoryResource?: MemoryResource): Series<Bool8> {
    const pat_string = pattern instanceof RegExp ? pattern.source : pattern;
    return Series.new(this._col.containsRe(pat_string, memoryResource));
  }

  /**
   * Returns an Int32 series the number of times the given regex pattern matches
   * in each string.
   *
   * @param pattern Regex pattern to match to each string.
   * @param memoryResource The optional MemoryResource used to allocate the result Series's device
   *   memory.
   *
   * The regex pattern strings accepted are described here:
   *
   * https://docs.rapids.ai/api/libcudf/stable/md_regex.html
   *
   * A RegExp may also be passed, however all flags are ignored (only `pattern.source` is used)
   *
   * @example
   * ```typescript
   * import {Series} from '@rapidsai/cudf';
   * const a = Series.new(['Finland','Colombia','Florida', 'Russia','france']);
   *
   * // count occurences of "o"
   * a.countRe(/o/) // [0, 2, 1, 0, 0]
   * // count occurences of "an"
   * a.countRe('an') // [1, 0, 0, 0, 1]
   *
   * // get number of countries starting with F or f
   * a.countRe(/^[fF]).count() // 3
   * ```
   */
  countRe(pattern: string|RegExp, memoryResource?: MemoryResource): Series<Int32> {
    const pat_string = pattern instanceof RegExp ? pattern.source : pattern;
    return Series.new(this._col.countRe(pat_string, memoryResource));
  }

  /**
   * Returns a boolean series identifying rows which match the given regex pattern
   * only at the beginning of the string
   *
   * @param pattern Regex pattern to match to each string.
   * @param memoryResource The optional MemoryResource used to allocate the result Series's device
   *   memory.
   *
   * The regex pattern strings accepted are described here:
   *
   * https://docs.rapids.ai/api/libcudf/stable/md_regex.html
   *
   * A RegExp may also be passed, however all flags are ignored (only `pattern.source` is used)
   *
   * @example
   * ```typescript
   * import {Series} from '@rapidsai/cudf';
   * const a = Series.new(['Finland','Colombia','Florida', 'Russia','france']);
   *
   * // start of item contains "C"
   * a.matchesRe(/C/) // [false, true, false, false, false]
   * // start of item contains "us", returns false since none of the items start with "us"
   * a.matchesRe('us') // [false, false, false, false, false]
   * ```
   */
  matchesRe(pattern: string|RegExp, memoryResource?: MemoryResource): Series<Bool8> {
    const pat_string = pattern instanceof RegExp ? pattern.source : pattern;
    return Series.new(this._col.matchesRe(pat_string, memoryResource));
  }

  /**
   * Applies a JSONPath(string) where each row in the series is a valid json string. Returns New
   * StringSeries containing the retrieved json object strings
   *
   * @param jsonPath The JSONPath string to be applied to each row of the input column
   * @param memoryResource The optional MemoryResource used to allocate the result Series's device
   *   memory.
   *
   * @example
   * ```typescript
   * import {Series} from '@rapidsai/cudf';
   * const a = const lines = Series.new([
   *  {foo: {bar: "baz"}},
   *  {foo: {baz: "bar"}},
   * ].map(JSON.stringify)); // StringSeries ['{"foo":{"bar":"baz"}}', '{"foo":{"baz":"bar"}}']
   *
   * a.getJSONObject("$.foo") // StringSeries ['{"bar":"baz"}', '{"baz":"bar"}']
   * a.getJSONObject("$.foo.bar") // StringSeries ["baz", null]
   *
   * // parse the resulting strings using JSON.parse
   * [...a.getJSONObject("$.foo").map(JSON.parse)] // object [{ bar: 'baz' }, { baz: 'bar' }]
   * ```
   */
  getJSONObject(jsonPath: string, memoryResource?: MemoryResource): StringSeries {
    return Series.new(this._col.getJSONObject(jsonPath, memoryResource));
  }
}
